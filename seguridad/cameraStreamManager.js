const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class CameraStreamManager {
  constructor(options = {}) {
    this.baseDir = options.baseDir;
    this.ffmpegPath = options.ffmpegPath || process.env.FFMPEG_PATH || 'ffmpeg';
    this.processes = new Map();

    if (!this.baseDir) {
      throw new Error('CameraStreamManager requires a baseDir.');
    }

    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  sanitizeSegment(value) {
    return String(value || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  getKey(cameraId, profile) {
    return `${cameraId}:${profile}`;
  }

  getStreamDir(cameraId, profile) {
    return path.join(
      this.baseDir,
      this.sanitizeSegment(cameraId),
      this.sanitizeSegment(profile)
    );
  }

  clearDirectory(dirPath) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    fs.mkdirSync(dirPath, { recursive: true });
  }

  ensureStream(cameraId, profile, sourceUrl) {
    const key = this.getKey(cameraId, profile);
    const existing = this.processes.get(key);

    if (existing && !existing.process.killed) {
      return existing.outputDir;
    }

    const outputDir = this.getStreamDir(cameraId, profile);
    this.clearDirectory(outputDir);

    const manifestPath = path.join(outputDir, 'index.m3u8');
    const segmentPattern = path.join(outputDir, 'segment_%03d.ts');

    const args = [
      '-hide_banner',
      '-loglevel', 'warning',
      '-fflags', 'nobuffer',
      '-flags', 'low_delay'
    ];

    if (String(sourceUrl).toLowerCase().startsWith('rtsp://')) {
      args.push('-rtsp_transport', 'tcp');
    }

    args.push(
      '-i', sourceUrl,
      '-an',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-g', '30',
      '-sc_threshold', '0',
      '-f', 'hls',
      '-hls_time', '1',
      '-hls_list_size', '6',
      '-hls_flags', 'delete_segments+append_list+omit_endlist+independent_segments',
      '-hls_segment_filename', segmentPattern,
      manifestPath
    );

    const child = spawn(this.ffmpegPath, args, {
      windowsHide: true,
      stdio: ['ignore', 'ignore', 'pipe']
    });

    const state = {
      process: child,
      outputDir,
      manifestPath,
      startedAt: Date.now(),
      lastError: ''
    };

    child.stderr.on('data', (chunk) => {
      state.lastError = `${state.lastError}${chunk.toString()}`.slice(-4000);
    });

    child.on('error', (error) => {
      state.lastError = error.message;
      this.processes.delete(key);
    });

    child.on('close', () => {
      this.processes.delete(key);
    });

    this.processes.set(key, state);
    return outputDir;
  }

  async waitForFile(cameraId, profile, filename = 'index.m3u8', timeoutMs = 12000) {
    const outputDir = this.getStreamDir(cameraId, profile);
    const targetFile = path.join(outputDir, filename);
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      if (fs.existsSync(targetFile)) {
        return targetFile;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return null;
  }

  getLastError(cameraId, profile) {
    const state = this.processes.get(this.getKey(cameraId, profile));
    return state?.lastError || '';
  }

  stopStream(cameraId, profile) {
    const key = this.getKey(cameraId, profile);
    const state = this.processes.get(key);

    if (!state) {
      return;
    }

    try {
      state.process.kill('SIGTERM');
    } catch (error) {
      // Ignore cleanup errors during shutdown.
    }

    this.processes.delete(key);
  }

  stopAll() {
    for (const key of this.processes.keys()) {
      const [cameraId, profile] = key.split(':');
      this.stopStream(cameraId, profile);
    }
  }
}

module.exports = CameraStreamManager;
