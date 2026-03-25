const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config();

const nodemailer = require('nodemailer');
const authMiddleware = require('./middleware/authMiddleware');
const CameraStreamManager = require('./cameraStreamManager');

// --- STRIPE CONFIGURATION ---
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY no configurada en .env - Los pagos no funcionarán');
}
const stripe = stripeKey ? Stripe(stripeKey) : null;

console.log('\n\n');
console.log('=================================================');
console.log('!!! SERVER STARTING IN SUPABASE MODE !!!');
console.log('=================================================\n\n');

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('\n❌ FATAL: SUPABASE_SERVICE_KEY no está configurada en .env');
  console.error('   El backend DEBE usar la service role key, NO la anon key.');
  console.error('   Agrega SUPABASE_SERVICE_KEY=eyJhbG... en tu archivo .env\n');
  process.exit(1);
}

const supabase = require('@supabase/supabase-js').createClient(supabaseUrl, supabaseServiceKey);

const app = express();
const port = 3000;

// Path to data for migration purposes only
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'data', 'uploads');
const cameraStreamsDir = path.join(__dirname, 'data', 'camera-streams');
const DEFAULT_SITE_ID = '00000000-0000-0000-0000-000000000001';
const cameraStreamManager = new CameraStreamManager({ baseDir: cameraStreamsDir });

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadsDir); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- Helper for Migration ---
const readJsonFile = (filename) => {
  try {
    const filePath = path.join(dataDir, filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
  }
  return [];
};

const writeJsonFile = (filename, data) => {
  try {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
  }
};

const inferStreamType = (value, fallback = 'rtsp') => {
  const url = String(value || '').trim().toLowerCase();

  if (!url) return fallback;
  if (url.includes('.m3u8')) return 'hls';
  if (url.startsWith('http://') || url.startsWith('https://')) return 'hls';
  if (url.startsWith('rtsp://')) return 'rtsp';

  return fallback;
};

const buildPublicPlaybackUrl = (cameraId, profile, siteId) => {
  const query = siteId ? `?site_id=${encodeURIComponent(siteId)}` : '';
  return `/api/public/camera-streams/${encodeURIComponent(cameraId)}/${profile}/index.m3u8${query}`;
};

const normalizeCamera = (rawCamera, fallbackSiteId = DEFAULT_SITE_ID) => {
  const camera = { ...(rawCamera || {}) };
  const id = camera.id || crypto.randomUUID();
  const siteId = camera.site_id || fallbackSiteId;
  const name = camera.name || camera.id || 'Camara sin nombre';
  const active = camera.is_active ?? camera.activa ?? true;
  const primaryStreamUrl =
    camera.primary_stream_url || camera.primaryStreamUrl || camera.stream_url || camera.rtsp_url || '';
  const primaryStreamType =
    camera.primary_stream_type || camera.primaryStreamType || inferStreamType(primaryStreamUrl);
  const streamMode = camera.stream_mode || camera.streamMode || (camera.stereo_enabled ? 'stereo' : 'single');
  const leftStreamUrl = camera.left_stream_url || camera.leftStreamUrl || '';
  const rightStreamUrl = camera.right_stream_url || camera.rightStreamUrl || '';
  const leftStreamType =
    camera.left_stream_type || camera.leftStreamType || inferStreamType(leftStreamUrl, primaryStreamType);
  const rightStreamType =
    camera.right_stream_type || camera.rightStreamType || inferStreamType(rightStreamUrl, primaryStreamType);
  const stereoEnabled = Boolean(
    camera.stereo_enabled ??
    camera.stereoEnabled ??
    (streamMode === 'stereo' && leftStreamUrl && rightStreamUrl)
  );

  const playbackUrls = {
    primary: primaryStreamType === 'hls'
      ? primaryStreamUrl
      : (primaryStreamUrl ? buildPublicPlaybackUrl(id, 'primary', siteId) : ''),
    left: leftStreamUrl
      ? (leftStreamType === 'hls'
        ? leftStreamUrl
        : buildPublicPlaybackUrl(id, 'left', siteId))
      : '',
    right: rightStreamUrl
      ? (rightStreamType === 'hls'
        ? rightStreamUrl
        : buildPublicPlaybackUrl(id, 'right', siteId))
      : ''
  };

  return {
    id,
    site_id: siteId,
    name,
    ip: camera.ip || '',
    marca: camera.marca || camera.brand || '',
    modelo: camera.modelo || camera.model || '',
    area: camera.area || camera.location_description || '',
    alertas: Number.isFinite(camera.alertas) ? camera.alertas : 0,
    activa: Boolean(active),
    is_active: Boolean(active),
    location_description: camera.location_description || camera.area || '',
    primaryStreamUrl,
    primaryStreamType,
    rtsp_url: camera.rtsp_url || (primaryStreamType === 'rtsp' ? primaryStreamUrl : ''),
    streamMode: stereoEnabled ? 'stereo' : 'single',
    stereoEnabled,
    leftStreamUrl,
    leftStreamType,
    rightStreamUrl,
    rightStreamType,
    playbackUrls
  };
};

const readCameras = (siteIds = [DEFAULT_SITE_ID]) => {
  const cameras = readJsonFile('cameras.json')
    .map((camera) => normalizeCamera(camera))
    .filter((camera) => !siteIds?.length || siteIds.includes(camera.site_id));

  return cameras;
};

const writeCameras = (cameras) => {
  const serialized = cameras.map((camera) => ({
    id: camera.id,
    site_id: camera.site_id,
    name: camera.name,
    ip: camera.ip,
    marca: camera.marca,
    modelo: camera.modelo,
    area: camera.area,
    alertas: camera.alertas,
    activa: camera.activa,
    location_description: camera.location_description,
    primary_stream_url: camera.primaryStreamUrl,
    primary_stream_type: camera.primaryStreamType,
    rtsp_url: camera.rtsp_url,
    stream_mode: camera.streamMode,
    stereo_enabled: camera.stereoEnabled,
    left_stream_url: camera.leftStreamUrl,
    left_stream_type: camera.leftStreamType,
    right_stream_url: camera.rightStreamUrl,
    right_stream_type: camera.rightStreamType
  }));

  writeJsonFile('cameras.json', serialized);
};

const buildCameraFromPayload = (payload, existingCamera = null, siteId = DEFAULT_SITE_ID) => {
  const merged = {
    ...(existingCamera || {}),
    ...(payload || {}),
    id: existingCamera?.id || payload?.id || crypto.randomUUID(),
    site_id: existingCamera?.site_id || payload?.site_id || siteId
  };

  return normalizeCamera(merged, siteId);
};

const getCameraById = (cameraId) => {
  const cameras = readCameras();
  return cameras.find((camera) => camera.id === cameraId) || null;
};

const getStreamProfile = (camera, profile) => {
  const profiles = {
    primary: {
      sourceUrl: camera.primaryStreamUrl,
      sourceType: camera.primaryStreamType
    },
    left: {
      sourceUrl: camera.leftStreamUrl,
      sourceType: camera.leftStreamType
    },
    right: {
      sourceUrl: camera.rightStreamUrl,
      sourceType: camera.rightStreamType
    }
  };

  return profiles[profile] || null;
};

const sendMediaFile = (res, filePath) => {
  if (filePath.endsWith('.m3u8')) {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  } else if (filePath.endsWith('.ts')) {
    res.setHeader('Content-Type', 'video/mp2t');
  }

  res.sendFile(filePath);
};

// --- PUBLIC HEALTH/PING ENDPOINT (no auth required) ---
app.get('/api/ping', (req, res) => {
  console.log('[DEBUG-SERVER] Ping received at', new Date().toISOString());
  res.json({ status: 'ok', ts: Date.now(), debug: true });
});

app.get('/api/test-top', (req, res) => {
  res.json({ message: 'top ok' });
});

// --- MIGRATION ENDPOINT ---
app.post('/api/migrate', async (req, res) => {
  try {
    console.log('Starting migration...');
    const summaries = {};

    // 1. Admins
    const admins = readJsonFile('admins.json');
    if (admins.length > 0) {
      // Remove 'password' if you want to enforce new passwords, or keep it.
      // Note: Supabase Auth is better, but this populates the 'admins' table.
      const { error } = await supabase.from('admins').upsert(admins, { onConflict: 'email' });
      if (error) throw error;
      summaries.admins = admins.length;
    }

    // 2. Guards
    const guards = readJsonFile('guards.json');
    if (guards.length > 0) {
      const { error } = await supabase.from('guards').upsert(guards, { onConflict: 'idEmpleado' });
      if (error) throw error;
      summaries.guards = guards.length;
    }

    // 3. Cameras
    const cameras = readJsonFile('cameras.json');
    if (cameras.length > 0) {
      const { error } = await supabase.from('cameras').upsert(cameras, { onConflict: 'id' });
      if (error) throw error;
      summaries.cameras = cameras.length;
    }

    // 4. Reports
    const reports = readJsonFile('reports.json');
    if (reports.length > 0) {
      const { error } = await supabase.from('reports').upsert(reports, { onConflict: 'id' });
      if (error) throw error;
      summaries.reports = reports.length;
    }

    // 5. Buildings
    const buildings = readJsonFile('buildings.json');
    if (buildings.length > 0) {
      const { error } = await supabase.from('buildings').upsert(buildings, { onConflict: 'id' });
      if (error) throw error;
      summaries.buildings = buildings.length;
    }

    // 6. Entries/Exits
    const entries = readJsonFile('entries_exits.json');
    if (entries.length > 0) {
      const { error } = await supabase.from('entries_exits').upsert(entries, { onConflict: 'id' });
      if (error) throw error;
      summaries.entries = entries.length;
    }

    res.json({ message: 'Migration successful', details: summaries });
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ message: 'Migration failed', error: error.message });
  }
});


// --- MIGRATION CHECK ---
// Auto-migrate on start if DB seems empty (Optional - simpler to let user trigger it via endpoint)

// --- API Endpoints Refactored for Supabase ---

// --- Auth Endpoints ---

// POST: Login (Proxy to Supabase Auth)
// [REMOVED DUPLICATE LOGIN ENDPOINT]

// POST: Upload photo — sube a Supabase Storage y retorna URL pública
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });

  try {
    // Read the file from disk (multer already saved it)
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileName = `guards/${req.file.filename}`;
    const contentType = req.file.mimetype || 'image/jpeg';

    // Upload to Supabase Storage bucket 'guard-photos'
    const { data, error } = await supabase.storage
      .from('guard-photos')
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Supabase Storage upload error:', error.message);
      // Fallback: return local URL
      const localUrl = `/uploads/${req.file.filename}`;
      return res.status(200).json({ url: localUrl, message: 'Guardado localmente (Supabase Storage falló).' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('guard-photos')
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl;
    console.log('Photo uploaded to Supabase Storage:', publicUrl);

    // Clean up local file after successful upload
    try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }

    res.status(200).json({ url: publicUrl, message: 'Archivo subido correctamente a la nube.' });
  } catch (err) {
    console.error('Upload error:', err);
    // Fallback to local
    const localUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ url: localUrl, message: 'Guardado localmente (error en la nube).' });
  }
});

// --- Guards (Protegido por authMiddleware, filtrado por site_id) ---
app.get('/api/guards', authMiddleware, async (req, res) => {
  let localGuards = [];
  try {
    const allLocal = readJsonFile('guards.json');
    localGuards = allLocal.filter(g => req.siteIds.includes(g.site_id));
  } catch (e) { console.error('Error reading local guards:', e); }

  let dbGuards = [];
  try {
    const { data, error } = await supabase.from('guards').select('*').in('site_id', req.siteIds);
    if (!error && data) {
      dbGuards = data;
    }
  } catch (err) {
    console.error('Error reading supabase guards:', err);
  }

  // Merge lists favoring DB (or avoiding duplicates)
  const mergedMap = new Map();
  dbGuards.forEach(g => mergedMap.set(g.idEmpleado || g.document_id, g));
  localGuards.forEach(g => {
    if (!mergedMap.has(g.idEmpleado || g.document_id)) {
      mergedMap.set(g.idEmpleado || g.document_id, g);
    }
  });

  res.json(Array.from(mergedMap.values()));
});

app.get('/api/guards/:idEmpleado', authMiddleware, async (req, res) => {
  try {
    // 1. Buscar con site_id del admin
    const { data: data1 } = await supabase.from('guards').select('*').eq('idEmpleado', req.params.idEmpleado).in('site_id', req.siteIds).single();
    if (data1) return res.json(data1);

    const { data: data2 } = await supabase.from('guards').select('*').eq('document_id', req.params.idEmpleado).in('site_id', req.siteIds).single();
    if (data2) return res.json(data2);

    // 2. Fallback: buscar sin filtro de site_id (guardias de app móvil)
    const { data: data3 } = await supabase.from('guards').select('*').eq('idEmpleado', req.params.idEmpleado).maybeSingle();
    if (data3) return res.json(data3);

    const { data: data4 } = await supabase.from('guards').select('*').eq('document_id', req.params.idEmpleado).maybeSingle();
    if (data4) return res.json(data4);
  } catch (err) {
    console.error('Error querying supabase guards:', err);
  }

  // Fallback to Local JSON (sin filtro de site_id)
  try {
    const guards = readJsonFile('guards.json');
    const guard = guards.find(g => g.document_id === req.params.idEmpleado || g.idEmpleado === req.params.idEmpleado);
    if (guard) return res.json(guard);
  } catch (e) { console.error(e); }

  return res.status(404).json({ message: 'Guardia no encontrado' });
});

app.post('/api/guards', authMiddleware, async (req, res) => {
  const {
    full_name,
    document_id,
    photo_url,
    foto,
    image_url,
    email,
    telefono,
    direccion,
    area
  } = req.body;

  if (!document_id || !full_name) {
    return res.status(400).json({ message: 'Faltan datos obligatorios (Nombre, ID).' });
  }

  try {
    const tempPassword = Math.random().toString(36).slice(-8);
    // Usar UUID v4 válido para compatibilidad con el campo id de Supabase
    const userId = crypto.randomUUID();
    // El email siempre normalizado a lowercase; si no se proveyó uno real usar local temporal
    const guardEmail = (email && email.trim()) ? email.trim().toLowerCase() : `guard_${document_id}@tiresis.local`;

    // site_id se asigna desde el middleware, NUNCA del frontend
    const guardPhoto = photo_url || foto || image_url || '/assets/images/guards/default.png';

    const newGuard = {
      id: userId,
      full_name: full_name,
      nombre: full_name,
      document_id: document_id,
      idEmpleado: document_id,
      email: guardEmail,
      password: tempPassword,
      phone: telefono || '',
      direccion: direccion || '',
      area: area || '',
      foto: guardPhoto,
      role: 'guard',
      is_active: true,
      estado: 'Fuera de servicio',
      created_at: new Date().toISOString(),
      actividades: [],
      site_id: req.activeSiteId
    };

    // Save to guards.json
    const guards = readJsonFile('guards.json');
    if (guards.find(g => (g.document_id === document_id || g.idEmpleado === document_id) && g.site_id === req.activeSiteId)) {
      return res.status(400).json({ message: 'El guardia ya existe en este sitio.' });
    }
    guards.push(newGuard);
    writeJsonFile('guards.json', guards);
    console.log('[BE] Guard saved locally:', userId, 'email:', guardEmail, 'site:', req.activeSiteId);

    // Save to Supabase — solo columnas que existen en la tabla guards
    try {
      const sbGuard = {
        id: userId,
        nombre: full_name,
        idEmpleado: document_id,
        email: guardEmail,
        telefono: telefono || '',
        direccion: direccion || '',
        area: area || '',
        foto: guardPhoto,
        estado: 'Fuera de servicio',
        created_at: newGuard.created_at,
        actividades: [],
        site_id: req.activeSiteId
      };

      const { error: sbError } = await supabase.from('guards').insert([sbGuard]);
      if (sbError) {
        console.error('[BE] Error guardando guardia en Supabase:', sbError.message, '| Código:', sbError.code, '| Detalles:', sbError.details);
      } else {
        console.log('[BE] Guard saved to Supabase OK — email:', guardEmail);
      }
    } catch (sbEx) {
      console.error('[BE] Excepción guardando en Supabase:', sbEx.message);
    }

    res.status(201).json({ message: 'Guardia registrado', guard: newGuard, password: tempPassword });

  } catch (err) {
    console.error("Guard Insert Error:", err);
    return res.status(500).json({ message: 'Error registrando guardia', error: err.message });
  }
});

app.patch('/api/guards/:idEmpleado', authMiddleware, async (req, res) => {
  const idEmpleado = req.params.idEmpleado;
  const updateData = { ...req.body };

  if (!updateData.foto && typeof updateData.photo_url === 'string' && updateData.photo_url.trim()) {
    updateData.foto = updateData.photo_url.trim();
  }

  if (!updateData.foto && typeof updateData.image_url === 'string' && updateData.image_url.trim()) {
    updateData.foto = updateData.image_url.trim();
  }

  // Cleanup non-existent DB fields from the payload
  delete updateData.site_id; // No permitir cambio de site_id
  delete updateData.full_name;
  delete updateData.phone;
  delete updateData.document_id;
  delete updateData.is_active;
  delete updateData.photo_url;
  delete updateData.image_url;

  console.log('PATCH /api/guards', idEmpleado, updateData);

  // 1. Intentar actualizar con site_id del admin (idEmpleado)
  try {
    const { data: r1, error: e1 } = await supabase.from('guards').update(updateData).eq('idEmpleado', idEmpleado).in('site_id', req.siteIds).select();
    if (e1) console.error('Supabase update (idEmpleado+site) failed:', e1.message);
    if (r1 && r1.length > 0) return res.json(r1[0]);
  } catch (err) { console.error('Error 1:', err); }

  // 2. Intentar actualizar con site_id del admin (document_id)
  try {
    const { data: r2, error: e2 } = await supabase.from('guards').update(updateData).eq('document_id', idEmpleado).in('site_id', req.siteIds).select();
    if (e2) console.error('Supabase update (document_id+site) failed:', e2.message);
    if (r2 && r2.length > 0) return res.json(r2[0]);
  } catch (err) { console.error('Error 2:', err); }

  // 3. Fallback: actualizar sin filtro de site_id (guardias de app móvil sin site_id)
  try {
    const { data: r3, error: e3 } = await supabase.from('guards').update(updateData).eq('idEmpleado', idEmpleado).select();
    if (e3) console.error('Supabase update (idEmpleado sin site) failed:', e3.message);
    if (r3 && r3.length > 0) return res.json(r3[0]);
  } catch (err) { console.error('Error 3:', err); }

  try {
    const { data: r4, error: e4 } = await supabase.from('guards').update(updateData).eq('document_id', idEmpleado).select();
    if (e4) console.error('Supabase update (document_id sin site) failed:', e4.message);
    if (r4 && r4.length > 0) return res.json(r4[0]);
  } catch (err) { console.error('Error 4:', err); }

  // 4. Fallback local JSON (sin filtro de site_id)
  try {
    const guards = readJsonFile('guards.json');
    const index = guards.findIndex(g => g.document_id === idEmpleado || g.idEmpleado === idEmpleado);
    if (index !== -1) {
      guards[index] = { ...guards[index], ...updateData };
      if (updateData.nombre) guards[index].full_name = updateData.nombre;
      if (updateData.full_name) guards[index].nombre = updateData.full_name;
      writeJsonFile('guards.json', guards);
      return res.json(guards[index]);
    }
  } catch (e) {
    console.error('Local update failed:', e);
  }

  return res.status(404).json({ message: 'Guardia no encontrado' });
});

app.delete('/api/guards/:idEmpleado', authMiddleware, async (req, res) => {
  const idToMatch = String(req.params.idEmpleado || '').trim();
  console.log(`[BE] Baja guardia ID: "${idToMatch}" sites: [${req.siteIds}]`);

  // 1. Borrado en JSON Local (solo de sites del admin)
  try {
    let guards = readJsonFile('guards.json');
    const initialCount = guards.length;

    guards = guards.filter(g => {
      const docId = String(g.document_id || '').trim();
      const empId = String(g.idEmpleado || '').trim();
      const isMatch = docId === idToMatch || empId === idToMatch;
      const isOwned = req.siteIds.includes(g.site_id);
      return !(isMatch && isOwned);
    });

    if (guards.length < initialCount) {
      writeJsonFile('guards.json', guards);
      return res.json({ message: 'Guardia eliminado correctamente.' });
    }
  } catch (e) {
    console.error('[BE] ERROR en borrado local:', e);
  }

  // 2. Fallback a Supabase
  try {
    const { error } = await supabase.from('guards').delete().eq('document_id', idToMatch).in('site_id', req.siteIds);
    if (!error) {
      return res.json({ message: 'Guardia eliminado correctamente (Nube)' });
    }
    return res.status(500).json({ message: 'Error al eliminar', error: error.message });
  } catch (err) {
    return res.status(500).json({ message: 'Excepción al eliminar', error: err.message });
  }
});

// --- Admins ---
app.get('/api/admins/:email', async (req, res) => {
  let adminUser = null;

  try {
    const { data, error } = await supabase.from('admins').select('*').eq('email', req.params.email).single();
    if (!error && data) {
      adminUser = data;
    }
  } catch (err) {
    console.warn('Supabase admin fetch failed, trying local:', err);
  }

  if (!adminUser) {
    const admins = readJsonFile('admins.json');
    adminUser = admins.find(a => a.email === req.params.email);
  }

  if (!adminUser) return res.status(404).json({ message: 'Admin no encontrado' });
  res.json(adminUser);
});

app.post('/api/register-admin', async (req, res) => {
  console.log('[BE] Registering admin (LOCAL JSON MODE):', req.body.email);

  const newUser = {
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    companyName: req.body.companyName,
    location: req.body.location || req.body.street,
    lat: req.body.lat,
    lng: req.body.lng,
    zone: req.body.zone
  };

  // 1. Auto-generate password if not provided
  let generatedPassword = null;
  if (!newUser.password) {
    generatedPassword = Math.random().toString(36).slice(-8);
    newUser.password = generatedPassword;
  }

  try {
    // 2. LOCAL JSON STORAGE ONLY (Bypassing Supabase)
    const userId = 'ADMIN-LOCAL-' + Date.now();

    // Construct profile object
    const newProfile = {
      id: userId,
      full_name: newUser.fullName,
      email: newUser.email,
      password: newUser.password, // Storing plain text password locally as requested
      companyName: newUser.companyName,
      location: newUser.location,
      lat: newUser.lat,
      lng: newUser.lng,
      zone: newUser.zone,
      document_id: 'ADMIN-' + Date.now(),
      role: 'admin',
      plan: req.body.plan || 'Básico',
      is_active: true,
      created_at: new Date().toISOString()
    };

    // Save to admins.json
    const admins = readJsonFile('admins.json');

    // Check if exists
    if (admins.find(a => a.email === newUser.email)) {
      return res.status(400).json({ message: 'El usuario ya existe (Local).' });
    }

    admins.push(newProfile);
    writeJsonFile('admins.json', admins);

    console.log('[BE] Admin saved locally:', userId);

    // Auto-crear membership en el site por defecto
    const DEFAULT_SITE_ID = '00000000-0000-0000-0000-000000000001';
    try {
      await supabase.from('site_memberships').upsert({
        user_id: userId,
        site_id: DEFAULT_SITE_ID,
        role: 'admin',
        is_active: true
      }, { onConflict: 'user_id,site_id' });
      console.log('[BE] Membership creada para admin:', userId);
    } catch (memErr) {
      console.warn('[BE] Error creando membership:', memErr.message);
    }

    // (Optional) Send simulated email logic
    try {
      const emails = readJsonFile('emails.json');
      emails.push({
        to: newUser.email,
        subject: 'Bienvenido a TIRESIS - Credenciales de Acceso',
        body: `Hola ${newUser.fullName}, tu contraseña es: ${newUser.password}`,
        password: newUser.password,
        date: new Date().toISOString()
      });
      writeJsonFile('emails.json', emails);
    } catch (e) { console.error("Error logging email:", e); }

    return res.status(201).json({
      message: 'Admin registrado exitosamente (Modo Local)',
      user: { ...newProfile, email: newUser.email },
      password: generatedPassword || newUser.password
    });

  } catch (err) {
    console.error('Registration Exception:', err);
    return res.status(500).json({ message: 'Error interno del servidor.', error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '').trim();

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contrase�a son requeridos' });
  }

  const DEFAULT_SITE_ID = '00000000-0000-0000-0000-000000000001';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  let adminUser = null;
  let authSession = null;
  let authUser = null;

  // 1) Login local
  try {
    const admins = readJsonFile('admins.json');
    adminUser = admins.find(a =>
      String(a?.email || '').trim().toLowerCase() === email
      && String(a?.password || '').trim() === password
    ) || null;
  } catch (e) {
    console.error('[Login] Error reading local admins:', e.message);
  }

  // 2) Login por tabla admins en Supabase
  if (!adminUser) {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .ilike('email', email)
        .limit(20);

      if (!error && Array.isArray(data)) {
        adminUser = data.find(a => String(a?.password || '').trim() === password) || null;
      }
    } catch (err) {
      console.warn('[Login] Supabase admins check failed:', err.message);
    }
  }

  // 3) Fallback por Supabase Auth
  if (!adminUser) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.user) {
        authSession = data.session || null;
        authUser = data.user;

        const { data: dbAdmins, error: dbAdminsError } = await supabase
          .from('admins')
          .select('*')
          .ilike('email', email)
          .limit(1);

        if (!dbAdminsError && Array.isArray(dbAdmins) && dbAdmins[0]) {
          adminUser = dbAdmins[0];
        }
      }
    } catch (err) {
      console.warn('[Login] Supabase Auth check failed:', err.message);
    }
  }

  // 4) Si Auth pas� pero no existe perfil admin, bootstrap local para no romper el flujo
  if (!adminUser && authUser) {
    const inferredName =
      authUser.user_metadata?.full_name
      || authUser.user_metadata?.name
      || authUser.email?.split('@')[0]
      || 'Administrador';

    adminUser = {
      id: authUser.id,
      full_name: inferredName,
      email: authUser.email || email,
      role: 'admin',
      plan: 'B�sico',
      created_at: new Date().toISOString()
    };

    try {
      const admins = readJsonFile('admins.json');
      const alreadyExists = admins.some(a => String(a?.email || '').trim().toLowerCase() === email);
      if (!alreadyExists) {
        admins.push({ ...adminUser, password });
        writeJsonFile('admins.json', admins);
      }
    } catch (e) {
      console.warn('[Login] Could not persist local bootstrap admin:', e.message);
    }
  }

  if (!adminUser) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }

  // 5) Obtener sites del admin. Si falla, usar sitio por defecto.
  let sites = [{ id: DEFAULT_SITE_ID, name: 'Sitio principal' }];
  try {
    if (uuidRegex.test(adminUser.id)) {
      const { data: memberships, error: membershipsError } = await supabase
        .from('site_memberships')
        .select('site_id, sites(id, name)')
        .eq('user_id', adminUser.id)
        .eq('is_active', true);

      if (!membershipsError && Array.isArray(memberships) && memberships.length > 0) {
        sites = memberships.map(m => m.sites || { id: m.site_id });
      } else {
        try {
          await supabase
            .from('site_memberships')
            .upsert(
              [{ user_id: adminUser.id, site_id: DEFAULT_SITE_ID, is_active: true }],
              { onConflict: 'user_id,site_id' }
            );
        } catch (upsertErr) {
          console.warn('[Login] Membership bootstrap failed:', upsertErr.message);
        }
      }
    }
  } catch (e) {
    console.warn('[Login] Could not fetch sites, using default:', e.message);
  }

  res.json({
    message: 'Login exitoso',
    session: authSession || undefined,
    admin: {
      id: adminUser.id,
      name: adminUser.fullName || adminUser.full_name || adminUser.name || '',
      email: adminUser.email,
      location: adminUser.location || adminUser.street,
      companyName: adminUser.companyName,
      lat: adminUser.lat,
      lng: adminUser.lng,
      zone: adminUser.zone,
      role: adminUser.role || 'admin',
      plan: adminUser.plan || 'B�sico',
      sites
    }
  });
});

app.patch('/api/admins/update', async (req, res) => {
  const { email, ...updates } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requerido' });

  const { data, error } = await supabase.from('admins').update(updates).eq('email', email).select();
  if (error) return res.status(500).json({ message: 'Error actualizando admin', error: error.message });
  res.json({ message: 'Administrador actualizado', admin: data[0] });
});

/**
 * Activa el modo Premium para un administrador tras un pago exitoso.
 */
app.post('/api/upgrade-admin-plan', async (req, res) => {
  const { email, plan } = req.body;
  if (!email || !plan) return res.status(400).json({ message: 'Email y Plan son requeridos.' });

  try {
    const admins = readJsonFile('admins.json');
    const adminIndex = admins.findIndex(a => a.email === email);

    if (adminIndex !== -1) {
      admins[adminIndex].plan = plan;
      writeJsonFile('admins.json', admins);
      console.log(`[BE] Plan actualizado a ${plan} para:`, email);
      
      // Sincronizar con Supabase si existe allí
      try {
        await supabase.from('admins').update({ plan }).eq('email', email);
      } catch (e) { /* silent sync error */ }

      return res.json({ ok: true, message: `Plan actualizado exitosamente a ${plan}` });
    }

    return res.status(404).json({ ok: false, message: 'Administrador no encontrado.' });
  } catch (err) {
    return res.status(500).json({ ok: false, message: 'Error al actualizar el plan.', error: err.message });
  }
});

// --- Cameras (filtrado por site_id) ---
app.get('/api/cameras', authMiddleware, async (req, res) => {
  try {
    const cameras = readCameras(req.siteIds);
    res.json(cameras);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cameras', authMiddleware, async (req, res) => {
  try {
    const cameras = readCameras();
    const camera = buildCameraFromPayload(req.body, null, req.activeSiteId);
    cameras.push(camera);
    writeCameras(cameras);
    res.status(201).json({ message: 'Cámara registrada', camera });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/cameras/:id', authMiddleware, async (req, res) => {
  try {
    const cameras = readCameras();
    const index = cameras.findIndex((camera) => camera.id === req.params.id && req.siteIds.includes(camera.site_id));

    if (index === -1) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }

    const updatedCamera = buildCameraFromPayload(req.body, cameras[index], cameras[index].site_id);
    cameras[index] = updatedCamera;
    writeCameras(cameras);

    res.json(updatedCamera);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cameras/:id', authMiddleware, async (req, res) => {
  try {
    const cameras = readCameras();
    const camera = cameras.find((item) => item.id === req.params.id && req.siteIds.includes(item.site_id));

    if (!camera) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }

    const filtered = cameras.filter((item) => item.id !== req.params.id);
    writeCameras(filtered);
    cameraStreamManager.stopStream(req.params.id, 'primary');
    cameraStreamManager.stopStream(req.params.id, 'left');
    cameraStreamManager.stopStream(req.params.id, 'right');

    res.json({ message: 'Cámara eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/public/cameras', async (req, res) => {
  try {
    const siteId = req.query.site_id || DEFAULT_SITE_ID;
    const cameras = readCameras([siteId]).filter((camera) => camera.activa);
    res.json(cameras);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/public/camera-streams/:cameraId/:profile/:file', async (req, res) => {
  try {
    const siteId = req.query.site_id || DEFAULT_SITE_ID;
    const camera = readCameras([siteId]).find((item) => item.id === req.params.cameraId);

    if (!camera) {
      return res.status(404).json({ error: 'Cámara no encontrada' });
    }

    const profile = getStreamProfile(camera, req.params.profile);
    if (!profile || !profile.sourceUrl) {
      return res.status(404).json({ error: 'Perfil de stream no configurado' });
    }

    if (profile.sourceType === 'hls') {
      return res.redirect(profile.sourceUrl);
    }

    cameraStreamManager.ensureStream(camera.id, req.params.profile, profile.sourceUrl);

    const targetFile = await cameraStreamManager.waitForFile(
      camera.id,
      req.params.profile,
      req.params.file,
      req.params.file === 'index.m3u8' ? 12000 : 5000
    );

    if (!targetFile) {
      return res.status(504).json({
        error: 'No fue posible iniciar el stream.',
        details: cameraStreamManager.getLastError(camera.id, req.params.profile)
      });
    }

    return sendMediaFile(res, targetFile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function attachReportEvidenceUrls(reports) {
  if (!Array.isArray(reports) || reports.length === 0) {
    return [];
  }

  const reportIds = reports
    .map(report => report?.id)
    .filter(Boolean);

  if (reportIds.length === 0) {
    return reports.map(report => ({ ...report, evidence_urls: [] }));
  }

  try {
    const { data: reportEvidenceLinks, error: linksError } = await supabase
      .from('report_evidences')
      .select('report_id, evidence_id')
      .in('report_id', reportIds);

    if (linksError) {
      throw linksError;
    }

    const evidenceIds = [...new Set((reportEvidenceLinks || []).map(link => link.evidence_id).filter(Boolean))];

    if (evidenceIds.length === 0) {
      return reports.map(report => ({ ...report, evidence_urls: [] }));
    }

    const { data: evidences, error: evidencesError } = await supabase
      .from('evidences')
      .select('id, storage_path')
      .in('id', evidenceIds);

    if (evidencesError) {
      throw evidencesError;
    }

    const evidencePathMap = new Map(
      (evidences || []).map(evidence => [evidence.id, evidence.storage_path])
    );

    const reportEvidenceMap = new Map();
    (reportEvidenceLinks || []).forEach(link => {
      if (!link?.report_id || !link?.evidence_id) return;
      const storagePath = evidencePathMap.get(link.evidence_id);
      if (!storagePath) return;

      const publicUrl = supabase.storage.from('evidence').getPublicUrl(storagePath).data?.publicUrl;
      if (!publicUrl) return;

      const currentUrls = reportEvidenceMap.get(link.report_id) || [];
      currentUrls.push(publicUrl);
      reportEvidenceMap.set(link.report_id, currentUrls);
    });

    return reports.map(report => ({
      ...report,
      evidence_urls: reportEvidenceMap.get(report.id) || []
    }));
  } catch (error) {
    console.error('Error attaching report evidence URLs:', error.message || error);
    return reports.map(report => ({ ...report, evidence_urls: [] }));
  }
}

// --- Reports (filtrado por site_id) ---
app.get('/api/reports', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('reports').select('*').in('site_id', req.siteIds).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const reportsWithEvidence = await attachReportEvidenceUrls(data || []);
  res.json(reportsWithEvidence);
});

app.post('/api/reports', authMiddleware, async (req, res) => {
  const report = { ...req.body, site_id: req.activeSiteId };
  if (!report.id) report.id = Date.now().toString();

  const { error } = await supabase.from('reports').insert([report]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Reporte registrado', report });
});

app.patch('/api/reports/:id', authMiddleware, async (req, res) => {
  const updateData = { ...req.body };
  delete updateData.site_id;
  const { error } = await supabase.from('reports').update(updateData).eq('id', req.params.id).in('site_id', req.siteIds);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ...updateData });
});

app.delete('/api/reports/:id', authMiddleware, async (req, res) => {
  const { error } = await supabase.from('reports').delete().eq('id', req.params.id).in('site_id', req.siteIds);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Reporte eliminado' });
});

// --- Weekly Reports Feature ---

const WEEKLY_REPORTS_FILE = 'weekly_reports.json';

function readWeeklyReports() {
  const reports = readJsonFile(WEEKLY_REPORTS_FILE);
  return Array.isArray(reports) ? reports : [];
}

function writeWeeklyReports(reports) {
  writeJsonFile(WEEKLY_REPORTS_FILE, reports);
}

function shouldUseWeeklyReportsFallback(error) {
  const message = error?.message || '';
  return (
    message.includes('weekly_reports') ||
    message.includes('row-level security') ||
    message.includes('permission denied') ||
    message.includes('relation "weekly_reports" does not exist')
  );
}

function mergeWeeklyReports(dbReports, localReports) {
  const merged = new Map();
  [...(dbReports || []), ...(localReports || [])].forEach(report => {
    if (!report?.id) return;
    merged.set(report.id, report);
  });
  return Array.from(merged.values());
}

function normalizeWeeklyReportStatus(report) {
  if (typeof report?.status === 'string' && report.status.trim()) {
    return report.status;
  }

  switch (report?.status_id) {
    case 3:
      return 'completed';
    case 2:
      return 'in_process';
    default:
      return 'pending';
  }
}

function normalizeWeeklyReportArea(report) {
  return report?.area_id || report?.location_id || report?.site_id || 'unknown';
}

function buildLocalWeeklyReport({ startDate, endDate, summary, adminNotes, siteId, status = 'draft' }) {
  const timestamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    start_date: startDate,
    end_date: endDate,
    summary_json: summary,
    status,
    admin_notes: adminNotes || null,
    site_id: siteId || null,
    created_at: timestamp,
    updated_at: timestamp
  };
}

function filterLocalWeeklyReportsBySite(reports, siteIds) {
  return (reports || []).filter(report => !report.site_id || siteIds.includes(report.site_id));
}

function isWeeklyReportAccessible(report, siteIds) {
  return !!report && (!report.site_id || siteIds.includes(report.site_id));
}

function getWeeklyReportSiteScope(report, siteIds) {
  return report?.site_id ? [report.site_id] : siteIds;
}

function extractWeeklyReportAreaName(description) {
  if (typeof description !== 'string' || !description.trim()) {
    return null;
  }

  const match = description.match(/Area:\s*([^|]+)/i);
  return match ? match[1].trim() : null;
}

function mapWeeklyReportTypeLabel(reportTypeId) {
  const typeMap = {
    1: 'Incidente',
    2: 'Novedad',
    3: 'Rondin',
    4: 'Alerta IA',
    5: 'Mantenimiento',
    6: 'Sospechoso',
    7: 'Emergencia'
  };

  return typeMap[reportTypeId] || 'Otro';
}

function mapWeeklyReportStatusLabel(report) {
  const status = normalizeWeeklyReportStatus(report);
  const labelMap = {
    completed: 'Completado',
    in_process: 'En proceso',
    pending: 'Pendiente'
  };

  return labelMap[status] || 'Pendiente';
}

function buildWeeklyReportIncident(report) {
  return {
    id: report.id,
    created_at: report.created_at,
    status: normalizeWeeklyReportStatus(report),
    status_label: mapWeeklyReportStatusLabel(report),
    type_label: mapWeeklyReportTypeLabel(report.report_type_id),
    area: extractWeeklyReportAreaName(report.short_description) || 'Area general',
    description: report.short_description || 'Sin descripcion',
    guard_id: report.created_by_guard_id || null,
    evidence_urls: Array.isArray(report.evidence_urls) ? report.evidence_urls : []
  };
}

async function getWeeklyReportSourceReports(startDate, endDate, siteIds) {
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .in('site_id', siteIds)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports for weekly report:', error.message);
    throw error;
  }

  return attachReportEvidenceUrls(reports || []);
}

/**
 * Helper to generate aggregated weekly report data.
 * Returns an object with total reports, counts by status, area hotspots, and busiest day/shift.
 */
async function generateWeeklyReport(startDate, endDate, siteIds, excludedReportIds = []) {
  const sourceReports = await getWeeklyReportSourceReports(startDate, endDate, siteIds);
  const normalizedExcludedIds = [...new Set((excludedReportIds || []).filter(Boolean))];
  const excludedReportIdSet = new Set(normalizedExcludedIds);
  const includedSourceReports = sourceReports.filter(report => !excludedReportIdSet.has(report.id));

  const total = includedSourceReports.length;
  const statusCounts = { completed: 0, in_process: 0, pending: 0 };
  const areaCounts = {};
  const dayShiftCounts = {};

  includedSourceReports.forEach(r => {
    const status = normalizeWeeklyReportStatus(r);
    if (statusCounts[status] !== undefined) statusCounts[status]++;
    else statusCounts['pending']++;

    const area = normalizeWeeklyReportArea(r);
    areaCounts[area] = (areaCounts[area] || 0) + 1;

    const date = new Date(r.created_at);
    const day = date.toLocaleString('en-US', { weekday: 'long' });
    const hour = date.getHours();
    const shift = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'night';
    const key = `${day}-${shift}`;
    dayShiftCounts[key] = (dayShiftCounts[key] || 0) + 1;
  });

  const hottestArea = Object.entries(areaCounts).reduce((a, b) => (b[1] > a[1] ? b : a), ['', 0])[0];
  const busiestSlot = Object.entries(dayShiftCounts).reduce((a, b) => (b[1] > a[1] ? b : a), ['', 0])[0];

  return {
    total_reports: total,
    status_counts: statusCounts,
    hottest_area: hottestArea,
    busiest_slot: busiestSlot,
    generated_at: new Date().toISOString(),
    excluded_report_ids: normalizedExcludedIds,
    included_reports: includedSourceReports.map(buildWeeklyReportIncident),
    source_reports: sourceReports.map(buildWeeklyReportIncident)
  };
}

async function getStoredWeeklyReport(reportId) {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('id', reportId)
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

async function getWeeklyReportByIdWithFallback(reportId, siteIds) {
  let dbReport = null;

  try {
    dbReport = await getStoredWeeklyReport(reportId);
  } catch (error) {
    if (!shouldUseWeeklyReportsFallback(error)) {
      throw error;
    }
    console.warn('Weekly reports DB read failed, trying local fallback:', error.message);
  }

  if (isWeeklyReportAccessible(dbReport, siteIds)) {
    return { report: dbReport, source: 'db' };
  }

  const localReport = filterLocalWeeklyReportsBySite(readWeeklyReports(), siteIds)
    .find(report => report.id === reportId);

  if (!localReport) {
    return { report: null, source: dbReport ? 'db' : 'local' };
  }

  return { report: localReport, source: 'local' };
}

async function hydrateWeeklyReportDetails(report, siteIds) {
  if (!report) {
    return null;
  }

  const existingSummary = report.summary_json || {};
  const hasSourceReports = Array.isArray(existingSummary.source_reports);
  const hasIncludedReports = Array.isArray(existingSummary.included_reports);

  if (hasSourceReports && hasIncludedReports) {
    return report;
  }

  const excludedReportIds = Array.isArray(existingSummary.excluded_report_ids)
    ? existingSummary.excluded_report_ids
    : [];
  const regeneratedSummary = await generateWeeklyReport(
    report.start_date,
    report.end_date,
    getWeeklyReportSiteScope(report, siteIds),
    excludedReportIds
  );

  return {
    ...report,
    summary_json: {
      ...existingSummary,
      ...regeneratedSummary
    }
  };
}

// POST /api/weekly-reports/generate - admin only (PREMIUM)
app.post('/api/weekly-reports/generate', authMiddleware, async (req, res) => {
  // Verificar si el usuario es PREMIUM
  if (req.userPlan !== 'Premium') {
    return res.status(403).json({ 
      ok: false, 
      message: 'Función no disponible. La generación de reportes semanales es una característica exclusiva del Plan Premium. Por favor, realiza un Upgrade para continuar.' 
    });
  }

  // Determine period: last Monday 08:00 to upcoming Sunday 22:00
  const now = new Date();
  const day = now.getDay(); // 0=Sun,1=Mon,...
  const diffToMonday = (day + 6) % 7; // days since Monday
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - diffToMonday);
  lastMonday.setHours(8, 0, 0, 0);
  const nextSunday = new Date(lastMonday);
  nextSunday.setDate(lastMonday.getDate() + 6);
  nextSunday.setHours(22, 0, 0, 0);

  try {
    const summary = await generateWeeklyReport(lastMonday.toISOString(), nextSunday.toISOString(), req.siteIds);
    const payload = {
      site_id: req.activeSiteId,
      start_date: lastMonday.toISOString(),
      end_date: nextSunday.toISOString(),
      summary_json: summary,
      status: 'draft',
      admin_notes: req.body.admin_notes || null
    };

    const { data, error } = await supabase.from('weekly_reports').insert([
      payload
    ]).select();

    if (error) {
      if (shouldUseWeeklyReportsFallback(error)) {
        const localReports = readWeeklyReports();
        const fallbackReport = buildLocalWeeklyReport({
          startDate: payload.start_date,
          endDate: payload.end_date,
          summary,
          adminNotes: payload.admin_notes,
          siteId: req.activeSiteId
        });
        localReports.push(fallbackReport);
        writeWeeklyReports(localReports);
        console.warn('Weekly reports DB insert failed, using local fallback:', error.message);
        return res.status(201).json({
          message: 'Weekly report draft created locally',
          report: fallbackReport,
          source: 'local'
        });
      }

      throw error;
    }

    res.status(201).json({ message: 'Weekly report draft created', report: data[0] });
  } catch (e) {
    console.error('Weekly report generation error:', e);
    res.status(500).json({ message: 'Error generating weekly report', error: e.message });
  }
});

// PATCH /api/weekly-reports/:id/publish - admin only
app.patch('/api/weekly-reports/:id/publish', authMiddleware, async (req, res) => {
  const reportId = req.params.id;
  const { admin_notes } = req.body;
  try {
    const { report, source } = await getWeeklyReportByIdWithFallback(reportId, req.siteIds);

    if (!report) {
      return res.status(404).json({ message: 'Weekly report not found' });
    }

    if (source === 'local') {
      const localReports = readWeeklyReports();
      const reportIndex = localReports.findIndex(localReport => localReport.id === reportId);

      if (reportIndex === -1) {
        return res.status(404).json({ message: 'Weekly report not found' });
      }

      localReports[reportIndex] = {
        ...localReports[reportIndex],
        status: 'published',
        admin_notes,
        updated_at: new Date().toISOString()
      };
      writeWeeklyReports(localReports);

      return res.json({
        message: 'Weekly report published locally',
        report: localReports[reportIndex],
        source: 'local'
      });
    }

    const { data, error } = await supabase
      .from('weekly_reports')
      .update({ status: 'published', admin_notes })
      .eq('id', reportId)
      .select();

    if (error) {
      if (!shouldUseWeeklyReportsFallback(error)) {
        throw error;
      }
      console.warn('Weekly reports DB publish failed, trying local fallback:', error.message);
    } else if (data?.[0]) {
      return res.json({ message: 'Weekly report published', report: data[0] });
    }

    const localReports = readWeeklyReports();
    const reportIndex = localReports.findIndex(report => report.id === reportId);

    if (reportIndex === -1) {
      throw error || new Error('Weekly report not found');
    }

    localReports[reportIndex] = {
      ...localReports[reportIndex],
      status: 'published',
      admin_notes,
      updated_at: new Date().toISOString()
    };
    writeWeeklyReports(localReports);

    res.json({
      message: 'Weekly report published locally',
      report: localReports[reportIndex],
      source: 'local'
    });
  } catch (e) {
    console.error('Publish weekly report error:', e);
    res.status(500).json({ message: 'Error publishing report', error: e.message });
  }
});

// GET /api/weekly-reports/:id - detail for admins/guards with access to the site
app.get('/api/weekly-reports/:id', authMiddleware, async (req, res) => {
  const reportId = req.params.id;

  try {
    const { report } = await getWeeklyReportByIdWithFallback(reportId, req.siteIds);

    if (!report) {
      return res.status(404).json({ message: 'Weekly report not found' });
    }

    const hydratedReport = await hydrateWeeklyReportDetails(report, req.siteIds);
    res.json(hydratedReport);
  } catch (e) {
    console.error('Fetch weekly report detail error:', e);
    res.status(500).json({ message: 'Error fetching weekly report detail', error: e.message });
  }
});

// PATCH /api/weekly-reports/:id - edit notes and excluded incidents
app.patch('/api/weekly-reports/:id', authMiddleware, async (req, res) => {
  const reportId = req.params.id;
  const adminNotes = typeof req.body.admin_notes === 'string' ? req.body.admin_notes : undefined;
  const excludedReportIds = Array.isArray(req.body.excluded_report_ids)
    ? [...new Set(req.body.excluded_report_ids.filter(id => typeof id === 'string' && id.trim()))]
    : undefined;

  try {
    const { report, source } = await getWeeklyReportByIdWithFallback(reportId, req.siteIds);

    if (!report) {
      return res.status(404).json({ message: 'Weekly report not found' });
    }

    const nextExcludedIds = excludedReportIds
      || (Array.isArray(report.summary_json?.excluded_report_ids) ? report.summary_json.excluded_report_ids : []);
    const nextSummary = await generateWeeklyReport(
      report.start_date,
      report.end_date,
      getWeeklyReportSiteScope(report, req.siteIds),
      nextExcludedIds
    );
    const updatePayload = {
      admin_notes: adminNotes !== undefined ? adminNotes : (report.admin_notes || null),
      summary_json: nextSummary
    };

    if (source === 'local') {
      const localReports = readWeeklyReports();
      const reportIndex = localReports.findIndex(localReport => localReport.id === reportId);

      if (reportIndex === -1) {
        return res.status(404).json({ message: 'Weekly report not found' });
      }

      localReports[reportIndex] = {
        ...localReports[reportIndex],
        ...updatePayload,
        updated_at: new Date().toISOString()
      };
      writeWeeklyReports(localReports);

      return res.json({
        message: 'Weekly report updated locally',
        report: localReports[reportIndex],
        source: 'local'
      });
    }

    const { data, error } = await supabase
      .from('weekly_reports')
      .update(updatePayload)
      .eq('id', reportId)
      .select();

    if (error) {
      if (!shouldUseWeeklyReportsFallback(error)) {
        throw error;
      }

      const localReports = readWeeklyReports();
      const reportIndex = localReports.findIndex(localReport => localReport.id === reportId);

      if (reportIndex === -1) {
        throw error;
      }

      localReports[reportIndex] = {
        ...localReports[reportIndex],
        ...updatePayload,
        updated_at: new Date().toISOString()
      };
      writeWeeklyReports(localReports);

      return res.json({
        message: 'Weekly report updated locally',
        report: localReports[reportIndex],
        source: 'local'
      });
    }

    res.json({ message: 'Weekly report updated', report: data?.[0] || { ...report, ...updatePayload } });
  } catch (e) {
    console.error('Update weekly report error:', e);
    res.status(500).json({ message: 'Error updating weekly report', error: e.message });
  }
});

// DELETE /api/weekly-reports/:id - remove weekly report
app.delete('/api/weekly-reports/:id', authMiddleware, async (req, res) => {
  const reportId = req.params.id;

  try {
    const { report, source } = await getWeeklyReportByIdWithFallback(reportId, req.siteIds);

    if (!report) {
      return res.status(404).json({ message: 'Weekly report not found' });
    }

    if (source === 'local') {
      const localReports = readWeeklyReports().filter(localReport => localReport.id !== reportId);
      writeWeeklyReports(localReports);
      return res.json({ message: 'Weekly report deleted locally', source: 'local' });
    }

    const { error } = await supabase
      .from('weekly_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      if (!shouldUseWeeklyReportsFallback(error)) {
        throw error;
      }

      const localReports = readWeeklyReports().filter(localReport => localReport.id !== reportId);
      writeWeeklyReports(localReports);
      return res.json({ message: 'Weekly report deleted locally', source: 'local' });
    }

    res.json({ message: 'Weekly report deleted' });
  } catch (e) {
    console.error('Delete weekly report error:', e);
    res.status(500).json({ message: 'Error deleting weekly report', error: e.message });
  }
});

// GET /api/weekly-reports - admins see all, guards see only published
app.get('/api/weekly-reports', authMiddleware, async (req, res) => {
  const isAdmin = !!req.adminEmail; // simplistic check; authMiddleware should set adminEmail for admins
  const filter = isAdmin ? {} : { status: 'published' };
  try {
    let dbReports = [];
    const { data, error } = await supabase.from('weekly_reports').select('*').match(filter);

    if (error) {
      if (!shouldUseWeeklyReportsFallback(error)) {
        throw error;
      }
      console.warn('Weekly reports DB fetch failed, using local fallback:', error.message);
    } else {
      dbReports = (data || []).filter(report => isWeeklyReportAccessible(report, req.siteIds));
    }

    let localReports = filterLocalWeeklyReportsBySite(readWeeklyReports(), req.siteIds);
    if (!isAdmin) {
      localReports = localReports.filter(report => report.status === 'published');
    }

    const mergedReports = mergeWeeklyReports(dbReports, localReports)
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());

    res.json(mergedReports);
  } catch (e) {
    console.error('Fetch weekly reports error:', e);
    res.status(500).json({ message: 'Error fetching reports', error: e.message });
  }
});

// --- Buildings (filtrado por site_id) ---
app.get('/api/buildings', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('buildings').select('*').in('site_id', req.siteIds);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/buildings', authMiddleware, async (req, res) => {
  const { id, name, geometry } = req.body;

  // 1. Limitar a 5 edificios por sitio para plan Básico
  if (req.userPlan !== 'Premium') {
    const { count, error: countError } = await supabase
      .from('buildings')
      .select('*', { count: 'exact', head: true })
      .in('site_id', req.siteIds);
    
    if (!countError && count != null && count >= 5) {
      return res.status(403).json({ error: 'Límite alcanzado: El plan Básico permite máximo 5 edificios.' });
    }
  }

  // 2. Validar duplicados por nombre en el mismo sitio
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'El nombre del edificio es requerido.' });
  }

  const { data: existing, error: checkError } = await supabase
    .from('buildings')
    .select('id')
    .eq('name', name)
    .in('site_id', req.siteIds)
    .maybeSingle();

  if (existing) {
    return res.status(400).json({ error: `Ya existe un edificio con el nombre "${name}" en este sitio.` });
  }
  const building = {
    id: id || Date.now().toString(),
    name,
    geometry,
    site_id: req.activeSiteId
  };

  console.log('[BE] Admin:', req.adminEmail, '| Saving building into site:', req.activeSiteId);

  const { error } = await supabase.from('buildings').insert([building]);
  if (error) {
    console.error('[BE] Error inserting building into Supabase:', error);
    return res.status(500).json({ error: error.message, detail: error.details });
  }
  res.status(201).json({ message: 'Edificio guardado', building });
});

app.delete('/api/buildings/:id', authMiddleware, async (req, res) => {
  const { error } = await supabase.from('buildings').delete().eq('id', req.params.id).in('site_id', req.siteIds);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Edificio eliminado' });
});

// --- Notifications (sin auth — accedido por guardias y app movil sin token admin) ---

/**
 * GET /api/notifications/latest_all
 * Latest notification per guard, usado por el mapa para colorear los marcadores.
 */
app.get('/api/notifications/latest_all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('user_id, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[BE] Error leyendo notificaciones (latest_all):', error.message);
      return res.status(500).json({ error: error.message });
    }

    // De-duplicate server-side: keep the newest entry per user
    const latestMap = new Map();
    (data || []).forEach(n => {
      if (!latestMap.has(n.user_id)) latestMap.set(n.user_id, n);
    });

    res.json(Array.from(latestMap.values()));
  } catch (err) {
    console.error('[BE] Excepcion en GET /api/notifications/latest_all:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/notifications/:userId
 * Todas las notificaciones del guardia, más recientes primero.
 */
app.get('/api/notifications/:userId', async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ message: 'userId requerido.' });

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[BE] Error leyendo notificaciones para', userId, ':', error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error('[BE] Excepcion en GET /api/notifications/:userId:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/notifications
 * Inserta una notificacion en Supabase (dispara Realtime para la app Kotlin).
 */
app.post('/api/notifications', async (req, res) => {
  const { user_id, message, type = 'assignment', site_id = null } = req.body;
  if (!user_id || !message) {
    return res.status(400).json({ message: 'user_id y message son requeridos.' });
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ user_id, message, type, site_id, status: 'pending' }])
      .select()
      .single();

    if (error) {
      console.error('[BE] Error insertando notificacion:', error.message);
      return res.status(500).json({ message: 'Error al crear notificacion.', error: error.message });
    }

    console.log('[BE] Notificacion creada para guardia:', user_id, '->', message);
    res.status(201).json(data);
  } catch (err) {
    console.error('[BE] Excepcion en POST /api/notifications:', err.message);
    res.status(500).json({ message: 'Error interno.', error: err.message });
  }
});

/**
 * PATCH /api/notifications/:id/acknowledge
 * Marca la notificacion como reconocida.
 */
app.patch('/api/notifications/:id/acknowledge', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'id requerido.' });

  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[BE] Error actualizando notificacion', id, ':', error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('[BE] Excepcion en PATCH /api/notifications/:id/acknowledge:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Entries/Exits (filtrado por site_id) ---
app.get('/api/entries-exits', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('entries_exits').select('*').in('site_id', req.siteIds).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/entries-exits', authMiddleware, async (req, res) => {
  const entry = { ...req.body, site_id: req.activeSiteId };
  if (!entry.id) entry.id = 'EE' + Date.now().toString();

  const { error } = await supabase.from('entries_exits').insert([entry]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Registro guardado', entry });
});

app.patch('/api/entries-exits/:id', authMiddleware, async (req, res) => {
  const updateData = { ...req.body };
  delete updateData.site_id;
  const { error } = await supabase.from('entries_exits').update(updateData).eq('id', req.params.id).in('site_id', req.siteIds);
  if (error) return res.status(500).json({ error: error.message });
  res.json(updateData);
});

app.delete('/api/entries-exits/:id', authMiddleware, async (req, res) => {
  const { error } = await supabase.from('entries_exits').delete().eq('id', req.params.id).in('site_id', req.siteIds);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Registro eliminado' });
});

// --- STRIPE ENDPOINTS ---

/**
 * Retorna la clave pública de Stripe al frontend para inicializar Stripe.js.
 */
app.get("/api/stripe/config", (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

/**
 * Crea un PaymentIntent para pago con TARJETA (inline con Stripe Elements).
 */
app.post("/api/stripe/create-payment-intent", async (req, res) => {
  try {
    const { amountMXN, email } = req.body;
    console.log(`[DEBU-STRIPE] Iniciando PaymentIntent para: ${email} | Monto: ${amountMXN} MXN`);

    if (!stripe) {
      console.error('[STRIPE-CONFIG-ERROR] Falta STRIPE_SECRET_KEY en el .env');
      return res.status(500).json({ 
        ok: false, 
        message: 'Stripe no configurado. Falta completar STRIPE_PUBLISHABLE_KEY y/o STRIPE_SECRET_KEY en el .env' 
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amountMXN) * 100),
      currency: "mxn",
      payment_method_types: ["card"],
      description: "TIRESIS - Activación Plan Premium Empresarial",
      receipt_email: email,
    });

    return res.json({ ok: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    console.error("Stripe PaymentIntent Error:", err.message);
    return res.status(400).json({ ok: false, message: err.message });
  }
});

/**
 * Crea y confirma un PaymentIntent para pago OXXO (server-side).
 * Devuelve los datos del voucher directamente al frontend.
 */
app.post("/api/stripe/create-oxxo-payment", async (req, res) => {
  if (!stripe) return res.status(500).json({ ok: false, message: 'Stripe no configurado. Agrega STRIPE_SECRET_KEY en .env' });
  try {
    const { amountMXN, email, name } = req.body;

    // Stripe OXXO requiere nombre y apellido con mínimo 2 caracteres cada uno
    const billingName = (name && name.trim().includes(' ') && name.trim().length >= 5)
      ? name.trim()
      : "Cliente Tiresis";
    const billingEmail = email && email.includes('@') ? email : "cliente@tiresis.com";

    // Crear Y confirmar el PaymentIntent en un solo paso (server-side)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amountMXN) * 100),
      currency: "mxn",
      payment_method_types: ["oxxo"],
      payment_method_data: {
        type: "oxxo",
        billing_details: {
          name: billingName,
          email: billingEmail,
        },
      },
      confirm: true,
      description: "TIRESIS - Activación Plan Premium Empresarial",
    });

    // Extraer datos del voucher OXXO del next_action
    const oxxoDetails = paymentIntent.next_action?.oxxo_display_details;
    const voucherData = {
      ok: true,
      paymentIntentId: paymentIntent.id,
      reference: oxxoDetails?.number || paymentIntent.id.slice(-14),
      expiresAt: oxxoDetails?.expires_after || Math.floor(Date.now() / 1000) + (5 * 24 * 3600),
      hostedVoucherUrl: oxxoDetails?.hosted_voucher_url || null,
    };

    console.log("OXXO Voucher generado:", voucherData.reference);
    return res.json(voucherData);
  } catch (err) {
    console.error("Stripe OXXO Error:", err.message);
    return res.status(400).json({ ok: false, message: err.message });
  }
});

/**
 * Verifica el estado de un PaymentIntent.
 */
app.get("/api/stripe/payment-status/:paymentIntentId", async (req, res) => {
  if (!stripe) return res.status(500).json({ ok: false, message: 'Stripe no configurado' });
  try {
    const pi = await stripe.paymentIntents.retrieve(req.params.paymentIntentId);
    return res.json({
      ok: true,
      status: pi.status,
      amount: pi.amount,
      currency: pi.currency
    });
  } catch (err) {
    return res.status(400).json({ ok: false, message: err.message });
  }
});

/**
 * Helper para actualizar el plan de un administrador.
 */
async function updateAdminPlanStatus(email, plan) {
  try {
    const admins = readJsonFile('admins.json');
    const adminIndex = admins.findIndex(a => a.email === email);
    if (adminIndex !== -1) {
      admins[adminIndex].plan = plan;
      writeJsonFile('admins.json', admins);
      console.log(`[PLAN-SYNC] Plan ${plan} activado para ${email}`);
      try {
        await supabase.from('admins').update({ plan }).eq('email', email);
      } catch (e) { /* silent supabase sync error */ }
      return true;
    }
    return false;
  } catch (err) {
    console.error('[PLAN-UPDATE-ERROR]', err.message);
    return false;
  }
}

/**
 * Webhook de Stripe
 */
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_PLACEHOLDER";

    let event;
    try {
      if (webhookSecret === "whsec_PLACEHOLDER") {
        event = JSON.parse(req.body); 
      } else {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      }
    } catch (err) {
      return res.status(400).send(`Webhook signature error: ${err.message}`);
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        const pi = event.data.object;
        const email = pi.receipt_email || pi.metadata?.customer_email || pi.billing_details?.email;
        console.log(`💰 Pago Exitoso detectado via Webhook para: ${email}`);
        if (email) {
          await updateAdminPlanStatus(email, 'Premium');
        }
        break;
      case "checkout.session.completed":
        const session = event.data.object;
        const customerEmail = session.customer_details?.email || session.metadata?.email;
        console.log(`✅ Checkout completado para: ${customerEmail}`);
        if (customerEmail) {
          await updateAdminPlanStatus(customerEmail, 'Premium');
        }
        break;
    }

    res.json({ received: true });
  }
);


// ────────────────────────────────────────────────────────────────────────────
// NOTE: /api/notifications routes are defined above at line 1507+
// ────────────────────────────────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  cameraStreamManager.stopAll();
  fs.writeFileSync(path.join(__dirname, 'server_crash.log'), `Uncaught Exception: ${err.message}\n${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  fs.writeFileSync(path.join(__dirname, 'server_crash.log'), `Unhandled Rejection: ${reason}`);
});

process.on('SIGINT', () => {
  cameraStreamManager.stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cameraStreamManager.stopAll();
  process.exit(0);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor de la API corriendo en http://localhost:${port}`);
});

