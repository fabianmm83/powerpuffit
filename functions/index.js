const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Inicializar Firebase Admin
admin.initializeApp();

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Ruta de salud para probar
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'PowerPuffFit API funcionando',
        timestamp: new Date().toISOString()
    });
});

// Ruta de productos básica
app.get('/products', async (req, res) => {
    try {
        const db = admin.firestore();
        const productsSnapshot = await db.collection('productos').get();
        const products = [];
        
        productsSnapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json(products);
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para crear producto (solo para testing)
app.post('/products', async (req, res) => {
    try {
        const { nombre, descripcion, precio, cantidad, categoria } = req.body;
        
        if (!nombre || !precio) {
            return res.status(400).json({ error: 'Nombre y precio son requeridos' });
        }

        const db = admin.firestore();
        const productRef = await db.collection('productos').add({
            nombre,
            descripcion: descripcion || '',
            precio: parseFloat(precio),
            cantidad: parseInt(cantidad) || 0,
            categoria: categoria || 'general',
            activo: true,
            fecha_registro: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ 
            message: 'Producto creado exitosamente',
            id: productRef.id 
        });
    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Exportar la app como Firebase Function
exports.api = functions.https.onRequest(app);