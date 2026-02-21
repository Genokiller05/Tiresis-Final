const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const nodemailer = require('nodemailer');

// --- STRIPE CONFIGURATION ---
// IMPORTANT: Replace this with your actual Stripe Secret Key (sk_test_...)
// You can also use process.env.STRIPE_SECRET_KEY if using dotenv
const stripe = Stripe('sk_test_PLACEHOLDER_KEY_HERE');

console.log('\n\n');
console.log('=================================================');
console.log('!!! SERVER STARTING IN LOCAL JSON MODE !!!');
console.log('!!! SUPABASE DISCONNECTED - SAVING TO JSON !!!');
console.log('=================================================\n\n');

// Supabase Configuration
const supabaseUrl = 'https://vlxfhhmruwafetcxtqti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGZoaG1ydXdhZmV0Y3h0cXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNzY4MzgsImV4cCI6MjA4NTY1MjgzOH0.splkdHaqaoaeILuPvGDLZ-QkwytDQXGOBo1QJMLSf0w';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGZoaG1ydXdhZmV0Y3h0cXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA3NjgzOCwiZXhwIjoyMDg1NjUyODM4fQ.7vzVMIbQVCSVH8_3l5ejXHc55CR6Npf-O-f6tHk9b0Y';
const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

// --- Guards ---
app.get('/api/guards', async (req, res) => {
  // 1. Try Local JSON FIRST
  try {
    const guards = readJsonFile('guards.json');
    if (guards.length > 0) return res.json(guards);
  } catch (e) { console.error(e); }

  // 2. Fallback to Supabase
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'guard');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/guards/:idEmpleado', async (req, res) => {
  // 1. Try Local JSON FIRST
  try {
    const guards = readJsonFile('guards.json');
    const guard = guards.find(g => g.document_id === req.params.idEmpleado);
    if (guard) return res.json(guard);
  } catch (e) { console.error(e); }

  const { data, error } = await supabase.from('profiles').select('*').eq('document_id', req.params.idEmpleado).eq('role', 'guard').single();
  if (error) return res.status(404).json({ message: 'Guardia no encontrado' });
  res.json(data);
});

app.post('/api/guards', async (req, res) => {
  const { full_name, document_id, photo_url, email, telefono, direccion } = req.body;

  if (!document_id || !full_name) {
    return res.status(400).json({ message: 'Faltan datos obligatorios (Nombre, ID).' });
  }

  try {
    const tempPassword = Math.random().toString(36).slice(-8);
    const userId = 'GUARD-LOCAL-' + Date.now();

    // Construct response object & Local Record
    const newGuard = {
      id: userId,
      full_name: full_name,
      document_id: document_id,
      email: email || `guard_${document_id}@tiresis.local`,
      password: tempPassword,
      phone: telefono,
      role: 'guard',
      is_active: true,
      created_at: new Date().toISOString()
    };

    // Save to guards.json
    const guards = readJsonFile('guards.json');
    if (guards.find(g => g.document_id === document_id)) {
      return res.status(400).json({ message: 'El guardia ya existe (Local).' });
    }
    guards.push(newGuard);
    writeJsonFile('guards.json', guards);
    console.log('[BE] Guard saved locally:', userId);

    res.status(201).json({ message: 'Guardia registrado (Local)', guard: newGuard, password: tempPassword });

  } catch (err) {
    console.error("Guard Insert Error:", err);
    return res.status(500).json({ message: 'Error registrando guardia', error: err.message });
  }
});

app.patch('/api/guards/:idEmpleado', async (req, res) => {
  const { data, error } = await supabase.from('profiles').update(req.body).eq('document_id', req.params.idEmpleado).select();
  if (error) return res.status(500).json({ message: 'Error actualizando guardia', error: error.message });
  res.json(data[0]);
});

app.delete('/api/guards/:idEmpleado', async (req, res) => {
  const { error } = await supabase.from('profiles').delete().eq('document_id', req.params.idEmpleado);
  if (error) return res.status(500).json({ message: 'Error eliminando guardia', error: error.message });
  res.json({ message: 'Guardia eliminado correctamente' });
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

  res.json({
    message: 'Login exitoso',
    admin: {
      name: adminUser.fullName || adminUser.full_name,
      email: adminUser.email,
      location: adminUser.location,
      companyName: adminUser.companyName,
      lat: adminUser.lat,
      lng: adminUser.lng,
      zone: adminUser.zone,
      role: adminUser.role
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

// --- Cameras ---
app.get('/api/cameras', async (req, res) => {
  const { data, error } = await supabase.from('cameras').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/cameras', async (req, res) => {
  const { error } = await supabase.from('cameras').insert([req.body]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Cámara registrada', camera: req.body });
});

app.patch('/api/cameras/:id', async (req, res) => {
  const { error } = await supabase.from('cameras').update(req.body).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ...req.body, id: req.params.id });
});

app.delete('/api/cameras/:id', async (req, res) => {
  const { error } = await supabase.from('cameras').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Cámara eliminada' });
});

// --- Reports ---
app.get('/api/reports', async (req, res) => {
  const { data, error } = await supabase.from('reports').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/reports', async (req, res) => {
  const report = { ...req.body };
  if (!report.id) report.id = Date.now().toString(); // Fallback ID if not provided

  const { error } = await supabase.from('reports').insert([report]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Reporte registrado', report });
});

app.patch('/api/reports/:id', async (req, res) => {
  const { error } = await supabase.from('reports').update(req.body).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ...req.body });
});

app.delete('/api/reports/:id', async (req, res) => {
  const { error } = await supabase.from('reports').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Reporte eliminado' });
});

// --- Buildings ---
app.get('/api/buildings', async (req, res) => {
  const { data, error } = await supabase.from('buildings').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/buildings', async (req, res) => {
  const building = { ...req.body };
  if (!building.id) building.id = Date.now().toString();

  const { error } = await supabase.from('buildings').insert([building]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Edificio guardado', building });
});

app.delete('/api/buildings/:id', async (req, res) => {
  const { error } = await supabase.from('buildings').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Edificio eliminado' });
});

// --- Entries/Exits ---
app.get('/api/entries-exits', async (req, res) => {
  const { data, error } = await supabase.from('entries_exits').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/entries-exits', async (req, res) => {
  const entry = { ...req.body };
  if (!entry.id) entry.id = 'EE' + Date.now().toString();

  const { error } = await supabase.from('entries_exits').insert([entry]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Registro guardado', entry });
});

app.patch('/api/entries-exits/:id', async (req, res) => {
  const { error } = await supabase.from('entries_exits').update(req.body).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(req.body);
});

app.delete('/api/entries-exits/:id', async (req, res) => {
  const { error } = await supabase.from('entries_exits').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Registro eliminado' });
});

// --- STRIPE ENDPOINTS ---

/**
 * Endpoint para crear una sesión de Checkout con OXXO.
 */
app.post("/api/stripe/checkout/oxxo", async (req, res) => {
  try {
    const { amountMXN, email } = req.body;

    // Crear sesión de Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["oxxo"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: { name: "Pago OXXO (prueba)" },
            unit_amount: Math.round(Number(amountMXN) * 100), // Stripe in cents
          },
          quantity: 1,
        },
      ],
      // URLs de retorno
      success_url: "http://localhost:4200/#/register?payment=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:4200/#/register?payment=cancelled",
    });

    return res.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe Error:", err.message);
    // Return mock URL if key is invalid/missing (Test Mode Fallback)
    if (err.message.includes("api_key") || err.message.includes("Invalid API Key")) {
      return res.json({
        ok: true,
        url: "http://localhost:4200/#/register?payment=mock_success", // Mock redirect for testing UI without key
        sessionId: "mock_session_id"
      });
    }
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
    const webhookSecret = "whsec_PLACEHOLDER"; // Replace with actual webhook secret

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