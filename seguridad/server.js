const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const os = require('os');

const app = express();
const port = 3000;

// Path to the local guards JSON file
const guardsFilePath = path.join(__dirname, 'src', 'assets', 'guards.json');
const adminsFilePath = path.join(__dirname, 'src', 'assets', 'admins.json');

// Create a dedicated uploads directory in the system's temp folder
const uploadsDir = path.join(os.tmpdir(), 'seguridad_uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'src', 'assets')));
app.use('/uploads', express.static(uploadsDir));

// --- Helper functions for JSON file ---
const getGuards = () => {
  try {
    const data = fs.readFileSync(guardsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading guards file:', err);
    return [];
  }
};

const saveGuards = (guards) => {
  try {
    fs.writeFileSync(guardsFilePath, JSON.stringify(guards, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing guards file:', err);
    return false;
  }
};

const getAdmins = () => {
  try {
    const data = fs.readFileSync(adminsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading admins file:', err);
    return [];
  }
};

const saveAdmins = (admins) => {
  try {
    fs.writeFileSync(adminsFilePath, JSON.stringify(admins, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing admins file:', err);
    return false;
  }
};

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadsDir); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- API Endpoints ---

// POST: Upload a guard's photo
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });
  const filePath = `/uploads/${req.file.filename}`;
  res.status(200).json({ message: 'Archivo subido correctamente.', filePath: filePath });
});

// GET: Obtener todos los guardias
app.get('/api/guards', (req, res) => {
  res.json(getGuards());
});

// GET: Obtener un guardia por ID
app.get('/api/guards/:idEmpleado', (req, res) => {
  const guards = getGuards();
  const guard = guards.find(g => g.idEmpleado === req.params.idEmpleado);
  if (guard) {
    res.json(guard);
  } else {
    res.status(404).json({ message: 'Guardia no encontrado.' });
  }
});

// POST: Registrar un nuevo guardia
app.post('/api/guards', (req, res) => {
  const newGuard = req.body;
  if (!newGuard || !newGuard.nombre || !newGuard.idEmpleado) {
    return res.status(400).json({ message: 'Faltan datos del nuevo guardia.' });
  }
  const guards = getGuards();
  guards.push(newGuard);
  if (saveGuards(guards)) {
    res.status(201).json({ message: 'Guardia registrado correctamente.', guard: newGuard });
  } else {
    res.status(500).json({ message: 'Error al guardar en el archivo JSON.' });
  }
});

// PATCH: Actualizar un guardia
app.patch('/api/guards/:idEmpleado', (req, res) => {
  const guards = getGuards();
  const index = guards.findIndex(g => g.idEmpleado === req.params.idEmpleado);
  if (index !== -1) {
    guards[index] = { ...guards[index], ...req.body };
    if (saveGuards(guards)) {
      res.status(200).json(guards[index]);
    } else {
      res.status(500).json({ message: 'Error al actualizar el archivo JSON.' });
    }
  } else {
    res.status(404).json({ message: 'Guardia no encontrado.' });
  }
});

// DELETE: Eliminar un guardia por ID
app.delete('/api/guards/:idEmpleado', (req, res) => {
  const guards = getGuards();
  const filteredGuards = guards.filter(g => g.idEmpleado !== req.params.idEmpleado);
  if (guards.length !== filteredGuards.length) {
    if (saveGuards(filteredGuards)) {
      res.status(200).json({ message: 'Guardia eliminado correctamente.' });
    } else {
      res.status(500).json({ message: 'Error al eliminar del archivo JSON.' });
    }
  } else {
    res.status(404).json({ message: 'Guardia no encontrado.' });
  }
});

// POST: Registrar un nuevo administrador
app.post('/api/register-admin', (req, res) => {
  const newAdmin = req.body;
  // Added companyName to validation
  if (!newAdmin || !newAdmin.fullName || !newAdmin.email || !newAdmin.password || !newAdmin.location || !newAdmin.companyName) {
    return res.status(400).json({ message: 'Faltan datos obligatorios para el registro (incluyendo nombre de la compañía).' });
  }

  // Validación básica de contraseña en servidor (RELJADA - Opcional)
  if (!newAdmin.password) {
    return res.status(400).json({ message: 'La contraseña es obligatoria.' });
  }

  const admins = getAdmins();

  // Verificar si el email ya existe
  if (admins.find(a => a.email === newAdmin.email)) {
    return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
  }

  admins.push(newAdmin);

  if (saveAdmins(admins)) {
    res.status(201).json({
      message: 'Administrador registrado correctamente.',
      admin: {
        name: newAdmin.fullName,
        email: newAdmin.email,
        companyName: newAdmin.companyName,
        location: newAdmin.location
      }
    });
  } else {
    res.status(500).json({ message: 'Error al guardar el administrador.' });
  }
});

// POST: Login de administrador
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Credenciales incompletas.' });
  }

  // 1. Verificar credenciales por defecto (para testing)
  if (email === 'admin123@tiresis.com' && password === 'tiresis12345') {
    return res.status(200).json({
      message: 'Login exitoso (Default Admin)',
      admin: {
        fullName: 'Administrador Default',
        email: email,
        location: 'Oficina Central', // Ubicación dummy
        companyName: 'Tiresis Security',
        lat: 19.4326,
        lng: -99.1332 // CDMX default
      }
    });
  }

  const admins = getAdmins();
  const admin = admins.find(a => a.email === email && a.password === password);

  if (admin) {
    // En un sistema real usaríamos JWT, aquí simulamos éxito
    res.status(200).json({
      message: 'Login exitoso',
      admin: {
        name: admin.fullName,
        email: admin.email,
        location: admin.location,
        companyName: admin.companyName,
        lat: admin.lat,
        lng: admin.lng
      }
    });
  } else {
    res.status(401).json({ message: 'Credenciales incorrectas.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor de la API corriendo en http://localhost:${port}`);
});