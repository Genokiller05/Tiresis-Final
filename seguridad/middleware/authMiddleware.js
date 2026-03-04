/**
 * TIRESIS - Auth Middleware (Multi-Tenant por site_id)
 * 
 * 1. Lee el header 'x-admin-id' de cada petición
 * 2. Valida que el admin exista
 * 3. Consulta site_memberships para obtener sus site_ids activos
 * 4. Inyecta req.adminId y req.siteIds en el request
 * 5. Rechaza con 401 si no hay admin o no tiene sites asignados
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const dataDir = path.join(__dirname, '..', 'data');

// Supabase client para consultar site_memberships (usa service role key)
const supabaseUrl = process.env.SUPABASE_URL || 'https://uwhlbpaabyfoomnlkktt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
    console.error('[Auth Middleware] FATAL: SUPABASE_SERVICE_KEY no configurada en .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

const authMiddleware = async (req, res, next) => {
    const adminId = req.headers['x-admin-id'];

    if (!adminId) {
        console.warn('[Auth] Petición sin x-admin-id:', req.method, req.path);
        return res.status(401).json({
            message: 'No autorizado. Se requiere autenticación.',
            code: 'MISSING_ADMIN_ID'
        });
    }

    // 1. Validar que el admin existe (JSON local + Supabase)
    let adminExists = null;

    // 1a. Buscar en admins.json (local)
    const admins = readJsonFile('admins.json');
    adminExists = admins.find(a => a.id === adminId);

    // 1b. Si no está en local, buscar en Supabase
    if (!adminExists) {
        try {
            const { data, error } = await supabase
                .from('admins')
                .select('id, email, fullName')
                .eq('id', adminId)
                .single();
            if (!error && data) {
                adminExists = data;
            }
        } catch (err) {
            console.warn('[Auth] Error buscando admin en Supabase:', err.message);
        }
    }

    if (!adminExists) {
        console.warn('[Auth] Admin no encontrado en JSON ni Supabase:', adminId);
        return res.status(401).json({
            message: 'No autorizado. Admin no encontrado.',
            code: 'INVALID_ADMIN_ID'
        });
    }

    // 2. Consultar site_memberships para obtener los sites del admin
    try {
        const { data: memberships, error } = await supabase
            .from('site_memberships')
            .select('site_id')
            .eq('user_id', adminId)
            .eq('is_active', true);

        if (error) {
            console.error('[Auth] Error consultando site_memberships:', error);
            return res.status(500).json({
                message: 'Error interno de autenticación.',
                code: 'MEMBERSHIP_QUERY_ERROR'
            });
        }

        if (!memberships || memberships.length === 0) {
            console.warn('[Auth] Admin sin sites asignados:', adminId);
            return res.status(403).json({
                message: 'No tienes sitios asignados. Contacta al administrador.',
                code: 'NO_SITES'
            });
        }

        // 3. Inyectar datos en el request
        req.adminId = adminId;
        req.adminEmail = adminExists.email;
        req.siteIds = memberships.map(m => m.site_id);

        // Si el frontend envía un site_id específico, validar que el admin tenga acceso
        const requestedSiteId = req.headers['x-site-id'] || req.body?.site_id || req.query?.site_id;
        if (requestedSiteId && !req.siteIds.includes(requestedSiteId)) {
            return res.status(403).json({
                message: 'No tienes acceso a este sitio.',
                code: 'SITE_ACCESS_DENIED'
            });
        }

        // Site activo: el solicitado o el primero de la lista
        req.activeSiteId = requestedSiteId || req.siteIds[0];

        console.log(`[Auth] ✅ ${adminExists.email} → sites: [${req.siteIds.join(', ')}]`);
        next();
    } catch (err) {
        console.error('[Auth] Error en middleware:', err);
        return res.status(500).json({
            message: 'Error interno de autenticación.',
            code: 'AUTH_ERROR'
        });
    }
};

module.exports = authMiddleware;
