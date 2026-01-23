const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const os = require('os');

const app = express();
const port = 3000;

// Path to the local guards JSON file
const guardsFilePath = path.join(__dirname, 'data', 'guards.json');
const adminsFilePath = path.join(__dirname, 'data', 'admins.json');
const buildingsFilePath = path.join(__dirname, 'data', 'buildings.json');

// Create a dedicated uploads directory in 'data' folder for persistence
const uploadsDir = path.join(__dirname, 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
// Serve the uploads directory statically
app.use('/uploads', express.static(uploadsDir));

// ... (rest of code)

// Multer Configuration is already defined above.
// Reusing 'upload' middleware.


// ... (rest of code)

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadsDir); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });



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



// --- API Endpoints ---

// POST: Upload a guard's photo
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se subió ningún archivo.' });

  // Use exact same format as the frontend expects
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ url: fileUrl, message: 'Archivo subido correctamente.' });
});

// GET: Obtener todos los guardias
app.get('/api/guards', (req, res) => {
  res.json(getGuards());
});

// GET: Obtener admin por email
app.get('/api/admins/:email', (req, res) => {
  const admins = getAdmins();
  const admin = admins.find(a => a.email === req.params.email);
  if (admin) {
    res.json(admin);
  } else {
    res.status(404).json({ message: 'Admin no encontrado.' });
  }
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

// PATCH: Actualizar ubicación/datos del administrador (por email)
app.patch('/api/admins/update', (req, res) => {
  const { email, location, lat, lng, zone } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email es requerido para actualizar.' });
  }

  const admins = getAdmins();
  const index = admins.findIndex(a => a.email === email);

  if (index !== -1) {
    // Update fields if provided
    if (location !== undefined) admins[index].location = location;
    if (lat !== undefined) admins[index].lat = lat;
    if (lng !== undefined) admins[index].lng = lng;
    if (zone !== undefined) admins[index].zone = zone;

    if (saveAdmins(admins)) {
      res.status(200).json({ message: 'Administrador actualizado correctamente', admin: admins[index] });
    } else {
      res.status(500).json({ message: 'Error al actualizar el archivo JSON.' });
    }
  } else {
    res.status(404).json({ message: 'Administrador no encontrado.' });
  }
});

// POST: Login de administrador
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Credenciales incompletas.' });
  }

  // 1. Verificar credenciales por defecto (para testing)
  // if (email === 'admin123@tiresis.com' && password === 'tiresis12345') {
  //   return res.status(200).json({
  //     message: 'Login exitoso (Default Admin)',
  //     admin: {
  //       fullName: 'Administrador Default',
  //       email: email,
  //       location: 'Oficina Central', // Ubicación dummy
  //       companyName: 'Tiresis Security',
  //       lat: 19.4326,
  //       lng: -99.1332 // CDMX default
  //     }
  //   });
  // }

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
        lng: admin.lng,
        zone: admin.zone
      }
    });
  } else {
    res.status(401).json({ message: 'Credenciales incorrectas.' });
  }
});



// --- Buildings Management ---
const getBuildings = () => {
  try {
    if (!fs.existsSync(buildingsFilePath)) return [];
    const data = fs.readFileSync(buildingsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading buildings file:', err);
    return [];
  }
};

const saveBuildings = (buildings) => {
  try {
    fs.writeFileSync(buildingsFilePath, JSON.stringify(buildings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing buildings file:', err);
    return false;
  }
};

app.get('/api/buildings', (req, res) => {
  res.json(getBuildings());
});

app.post('/api/buildings', (req, res) => {
  const rawBuilding = req.body;
  if (!rawBuilding || !rawBuilding.name || !rawBuilding.geometry) {
    return res.status(400).json({ message: 'Missing building data' });
  }

  // Auto-generate ID if missing
  const newBuilding = {
    id: Date.now().toString(),
    ...rawBuilding
  };

  const buildings = getBuildings();
  buildings.push(newBuilding);

  if (saveBuildings(buildings)) {
    res.status(201).json({ message: 'Building saved', building: newBuilding });
  } else {
    res.status(500).json({ message: 'Error saving building' });
  }
});

app.delete('/api/buildings/:id', (req, res) => {
  const buildings = getBuildings();
  const filtered = buildings.filter(b => b.id !== req.params.id);
  if (saveBuildings(filtered)) {
    res.status(200).json({ message: 'Building deleted' });
  } else {
    res.status(500).json({ message: 'Error deleting building' });
  }
});


app.listen(port, () => {
  console.log(`Servidor de la API corriendo en http://localhost:${port}`);
});