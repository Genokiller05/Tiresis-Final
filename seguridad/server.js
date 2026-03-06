const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
require('dotenv').config();

const nodemailer = require('nodemailer');
const authMiddleware = require('./middleware/authMiddleware');

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

// POST: Upload photo (Keeps local storage for now, returns URL)
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ url: fileUrl, message: 'Archivo subido correctamente.' });
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
    const { data: data1 } = await supabase.from('guards').select('*').eq('idEmpleado', req.params.idEmpleado).in('site_id', req.siteIds).single();
    if (data1) return res.json(data1);

    const { data: data2 } = await supabase.from('guards').select('*').eq('document_id', req.params.idEmpleado).in('site_id', req.siteIds).single();
    if (data2) return res.json(data2);
  } catch (err) {
    console.error('Error querying supabase guards:', err);
  }

  // Fallback to Local JSON (filtrado por site_id)
  try {
    const guards = readJsonFile('guards.json');
    const guard = guards.find(g => (g.document_id === req.params.idEmpleado || g.idEmpleado === req.params.idEmpleado) && req.siteIds.includes(g.site_id));
    if (guard) return res.json(guard);
  } catch (e) { console.error(e); }

  return res.status(404).json({ message: 'Guardia no encontrado' });
});

app.post('/api/guards', authMiddleware, async (req, res) => {
  const { full_name, document_id, photo_url, email, telefono, direccion, area } = req.body;

  if (!document_id || !full_name) {
    return res.status(400).json({ message: 'Faltan datos obligatorios (Nombre, ID).' });
  }

  try {
    const tempPassword = Math.random().toString(36).slice(-8);
    const userId = 'GUARD-LOCAL-' + Date.now();

    // site_id se asigna desde el middleware, NUNCA del frontend
    const newGuard = {
      id: userId,
      full_name: full_name,
      nombre: full_name,
      document_id: document_id,
      idEmpleado: document_id,
      email: email || `guard_${document_id}@tiresis.local`,
      password: tempPassword,
      phone: telefono || '',
      direccion: direccion || '',
      area: area || '',
      foto: photo_url || '/assets/images/guards/default.png',
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
    console.log('[BE] Guard saved locally:', userId, 'site:', req.activeSiteId);

    // Save to Supabase
    try {
      const { error: sbError } = await supabase.from('guards').insert([newGuard]);
      if (sbError) {
        console.error('[BE] Error guardando guardia en Supabase:', sbError.message);
      } else {
        console.log('[BE] Guard saved to Supabase');
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
  delete updateData.site_id; // No permitir cambio de site_id

  try {
    const { data: updatedGuard, error: supabaseError } = await supabase
      .from('guards')
      .update(updateData)
      .eq('idEmpleado', idEmpleado)
      .in('site_id', req.siteIds)
      .select();

    console.log('PATCH /api/guards', idEmpleado, updateData);
    if (supabaseError) console.error('Supabase update (idEmpleado) failed:', supabaseError.message);

    if (updatedGuard && updatedGuard.length > 0) {
      return res.json(updatedGuard[0]);
    }

    const { data: updatedGuardDoc } = await supabase
      .from('guards')
      .update(updateData)
      .eq('document_id', idEmpleado)
      .in('site_id', req.siteIds)
      .select();

    if (updatedGuardDoc && updatedGuardDoc.length > 0) {
      return res.json(updatedGuardDoc[0]);
    }
  } catch (err) {
    console.error('Error updating supabase guards:', err);
  }

  // Fallback local JSON
  try {
    const guards = readJsonFile('guards.json');
    const index = guards.findIndex(g => (g.document_id === idEmpleado || g.idEmpleado === idEmpleado) && req.siteIds.includes(g.site_id));

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

  return res.status(404).json({ message: 'Guardia no encontrado en tus sitios' });
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
  const { email, password } = req.body;

  let adminUser = null;

  // 1. Try Local JSON FIRST
  try {
    const admins = readJsonFile('admins.json');
    console.log(`[DEBUG] Login Attempt: ${email} / ${password}`);
    // console.log('[DEBUG] Admins in DB:', admins.map(a => `${a.email}:${a.password}`)); 

    adminUser = admins.find(a => a.email === email && a.password === password);

    if (adminUser) console.log('[BE] Login: User found in local JSON');
    else console.log('[DEBUG] User NOT found in local JSON');

  } catch (e) { console.error(e); }

  // 2. Fallback to Supabase if not found locally
  if (!adminUser) {
    try {
      const { data, error } = await supabase.from('admins').select('*').eq('email', email).eq('password', password).single();
      if (!error && data) {
        adminUser = data;
        console.log('[BE] Login: User found in Supabase');
      }
    } catch (err) {
      console.warn('Supabase login check failed:', err.message);
    }
  }

  // 3. Try Supabase Auth (Legacy/Standard) if still not found
  if (!adminUser) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      return res.json({ message: 'Login exitoso (Auth)', session: data.session, user: data.user });
    }
  }

  if (!adminUser) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }

  // Obtener sites del admin via site_memberships
  let sites = [];
  try {
    const { data: memberships } = await supabase
      .from('site_memberships')
      .select('site_id, sites(id, name)')
      .eq('user_id', adminUser.id)
      .eq('is_active', true);
    sites = (memberships || []).map(m => m.sites || { id: m.site_id });
  } catch (e) {
    console.warn('[Login] No se pudieron obtener sites:', e.message);
  }

  res.json({
    message: 'Login exitoso',
    admin: {
      id: adminUser.id,
      name: adminUser.fullName || adminUser.full_name,
      email: adminUser.email,
      location: adminUser.location,
      companyName: adminUser.companyName,
      lat: adminUser.lat,
      lng: adminUser.lng,
      zone: adminUser.zone,
      role: adminUser.role,
      sites: sites
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

// --- Cameras (filtrado por site_id) ---
app.get('/api/cameras', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('cameras').select('*').in('site_id', req.siteIds);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/cameras', authMiddleware, async (req, res) => {
  const camera = { ...req.body, site_id: req.activeSiteId };
  const { error } = await supabase.from('cameras').insert([camera]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Cámara registrada', camera });
});

app.patch('/api/cameras/:id', authMiddleware, async (req, res) => {
  const updateData = { ...req.body };
  delete updateData.site_id;
  const { error } = await supabase.from('cameras').update(updateData).eq('id', req.params.id).in('site_id', req.siteIds);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ...updateData, id: req.params.id });
});

app.delete('/api/cameras/:id', authMiddleware, async (req, res) => {
  const { error } = await supabase.from('cameras').delete().eq('id', req.params.id).in('site_id', req.siteIds);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Cámara eliminada' });
});

// --- Reports (filtrado por site_id) ---
app.get('/api/reports', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('reports').select('*').in('site_id', req.siteIds).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
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

// --- Buildings (filtrado por site_id) ---
app.get('/api/buildings', authMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('buildings').select('*').in('site_id', req.siteIds);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/buildings', authMiddleware, async (req, res) => {
  const building = { ...req.body, site_id: req.activeSiteId };
  if (!building.id) building.id = Date.now().toString();

  const { error } = await supabase.from('buildings').insert([building]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Edificio guardado', building });
});

app.delete('/api/buildings/:id', authMiddleware, async (req, res) => {
  const { error } = await supabase.from('buildings').delete().eq('id', req.params.id).in('site_id', req.siteIds);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Edificio eliminado' });
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
  if (!stripe) return res.status(500).json({ ok: false, message: 'Stripe no configurado. Agrega STRIPE_SECRET_KEY en .env' });
  try {
    const { amountMXN, email } = req.body;

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
 * Webhook de Stripe
 */
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_PLACEHOLDER";

    let event;
    try {
      // In production, verify signature. In dev without valid secret, we might skip or warn.
      if (webhookSecret === "whsec_PLACEHOLDER") {
        event = req.body; // Bypass verification if secret is not set (INSECURE - DEV ONLY)
      } else {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      }
    } catch (err) {
      return res.status(400).send(`Webhook signature error: ${err.message}`);
    }

    switch (event.type) {
      case "checkout.session.async_payment_succeeded":
        console.log("💰 OXXO Payment Succeeded:", event.data.object);
        // Here you would find the user by email and setting them to active
        break;
      case "checkout.session.async_payment_failed":
        console.log("❌ OXXO Payment Failed", event.data.object);
        break;
    }

    res.json({ received: true });
  }
);


process.on('uncaughtException', (err) => {
  fs.writeFileSync(path.join(__dirname, 'server_crash.log'), `Uncaught Exception: ${err.message}\n${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  fs.writeFileSync(path.join(__dirname, 'server_crash.log'), `Unhandled Rejection: ${reason}`);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor de la API corriendo en http://localhost:${port}`);
});