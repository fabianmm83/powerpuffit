// instance/routes/auth.js
const express = require('express');
const router = express.Router();
const { auth } = require('../config/firebase');

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre, rol } = req.body;
    
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: nombre
    });

    // Guardar información adicional en Firestore
    await db.collection('usuarios').doc(userRecord.uid).set({
      nombre,
      email,
      rol: rol || 'cliente',
      fecha_registro: new Date(),
      activo: true
    });

    res.status(201).json({ message: 'Usuario creado exitosamente', uid: userRecord.uid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  // Implementar lógica de login
});

module.exports = router;