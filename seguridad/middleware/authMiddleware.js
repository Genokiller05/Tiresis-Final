/**
 * TIRESIS - Auth Middleware (Multi-tenant by site_id)
 *
 * Legacy compatibility:
 * - If memberships cannot be queried (permissions/schema issues),
 *   we continue with a fallback site scope instead of blocking all admins.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const dataDir = path.join(__dirname, '..', 'data');
const DEFAULT_SITE_ID = '00000000-0000-0000-0000-000000000001';

const supabaseUrl = process.env.SUPABASE_URL || 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.warn('[Auth Middleware] WARNING: SUPABASE_SERVICE_KEY not found.');
}

let supabase;
try {
  if (supabaseUrl && supabaseUrl.startsWith('http')) {
    supabase = createClient(supabaseUrl, supabaseServiceKey || 'placeholder');
  } else {
    console.error('[Auth Middleware] Invalid SUPABASE_URL:', supabaseUrl);
  }
} catch (err) {
  console.error('[Auth Middleware] Supabase init error:', err.message);
}

const readJsonFile = (filename) => {
  try {
    const filePath = path.join(dataDir, filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`[Auth] Error reading ${filename}:`, err);
  }
  return [];
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const collectFallbackSiteIds = async () => {
  const siteIds = new Set([DEFAULT_SITE_ID]);

  ['guards.json', 'reports.json', 'buildings.json', 'entries_exits.json', 'weekly_reports.json']
    .forEach((filename) => {
      const rows = readJsonFile(filename);
      if (!Array.isArray(rows)) return;

      rows.forEach((row) => {
        if (typeof row?.site_id === 'string' && row.site_id.trim()) {
          siteIds.add(row.site_id.trim());
        }
      });
    });

  if (supabase) {
    try {
      const { data, error } = await supabase.from('sites').select('id').limit(300);
      if (!error && Array.isArray(data)) {
        data.forEach((site) => {
          if (typeof site?.id === 'string' && site.id.trim()) {
            siteIds.add(site.id.trim());
          }
        });
      }
    } catch (err) {
      console.warn('[Auth] DB fallback site discovery failed:', err.message);
    }
  }

  return Array.from(siteIds);
};

const setRequestScope = (req, adminId, adminExists, siteIds, requestedSiteId) => {
  const scopedSiteIds = Array.isArray(siteIds) && siteIds.length > 0
    ? [...new Set(siteIds.filter(Boolean))]
    : [DEFAULT_SITE_ID];

  if (requestedSiteId && !scopedSiteIds.includes(requestedSiteId)) {
    scopedSiteIds.push(requestedSiteId);
  }

  req.adminId = adminId;
  req.adminEmail = adminExists.email;
  req.userPlan = adminExists.plan || 'Basico';
  req.siteIds = scopedSiteIds;
  req.activeSiteId = requestedSiteId || scopedSiteIds[0] || DEFAULT_SITE_ID;
};

const authMiddleware = async (req, res, next) => {
  const adminId = req.headers['x-admin-id'];
  const requestedSiteId = req.headers['x-site-id'] || req.body?.site_id || req.query?.site_id;

  if (!adminId) {
    console.warn('[Auth] Request without x-admin-id:', req.method, req.path);
    return res.status(401).json({
      message: 'No autorizado. Se requiere autenticacion.',
      code: 'MISSING_ADMIN_ID'
    });
  }

  let adminExists = null;

  // 1) Local admin lookup
  const admins = readJsonFile('admins.json');
  adminExists = admins.find(a => a.id === adminId);

  // 2) Supabase admin lookup (UUID only)
  if (!adminExists) {
    if (uuidRegex.test(adminId)) {
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('id, email, fullName, plan')
          .eq('id', adminId)
          .single();

        if (!error && data) {
          adminExists = data;
        }
      } catch (err) {
        console.warn('[Auth] Supabase admin lookup failed:', err.message);
      }
    } else {
      console.warn('[Auth] Invalid non-UUID admin id (not found locally):', adminId);
    }
  }

  if (!adminExists) {
    console.warn('[Auth] Admin not found in local or Supabase:', adminId);
    return res.status(401).json({
      message: 'No autorizado. Admin no encontrado.',
      code: 'INVALID_ADMIN_ID'
    });
  }

  // Local IDs skip memberships and use default scope.
  if (!uuidRegex.test(adminId)) {
    setRequestScope(req, adminId, adminExists, [DEFAULT_SITE_ID], requestedSiteId);
    return next();
  }

  // UUID IDs try memberships first.
  try {
    const { data: memberships, error } = await supabase
      .from('site_memberships')
      .select('site_id')
      .eq('user_id', adminId)
      .eq('is_active', true);

    if (error) {
      console.warn('[Auth] Membership query failed, using fallback scope:', error.message);
      const fallbackSiteIds = await collectFallbackSiteIds();
      setRequestScope(req, adminId, adminExists, fallbackSiteIds, requestedSiteId);
      return next();
    }

    if (!memberships || memberships.length === 0) {
      console.warn('[Auth] Admin without memberships, using fallback scope:', adminId);
      const fallbackSiteIds = await collectFallbackSiteIds();
      setRequestScope(req, adminId, adminExists, fallbackSiteIds, requestedSiteId);
      return next();
    }

    const membershipSiteIds = memberships.map(m => m.site_id).filter(Boolean);

    if (requestedSiteId && !membershipSiteIds.includes(requestedSiteId)) {
      return res.status(403).json({
        message: 'No tienes acceso a este sitio.',
        code: 'SITE_ACCESS_DENIED'
      });
    }

    setRequestScope(req, adminId, adminExists, membershipSiteIds, requestedSiteId);
    return next();
  } catch (err) {
    console.warn('[Auth] Middleware membership exception, using fallback scope:', err.message);
    const fallbackSiteIds = await collectFallbackSiteIds();
    setRequestScope(req, adminId, adminExists, fallbackSiteIds, requestedSiteId);
    return next();
  }
};

module.exports = authMiddleware;
