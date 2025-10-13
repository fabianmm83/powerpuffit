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
        const { nombre, descripcion, costo, precio, cantidad, categoria, proveedor, imagen_url } = req.body;
        
        if (!nombre || !costo || !precio) {
            return res.status(400).json({ error: 'Nombre, costo y precio son requeridos' });
        }

        const db = admin.firestore();
        const productRef = await db.collection('productos').add({
            nombre,
            descripcion: descripcion || '',
            costo: parseFloat(costo),
            precio: parseFloat(precio),
            cantidad: parseInt(cantidad) || 0,
            categoria: categoria || 'general',
            proveedor: proveedor || '',
            imagen_url: imagen_url || '',
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

// Función para actualizar stock automáticamente
exports.actualizarStockVenta = functions.firestore
  .document('ventas/{ventaId}')
  .onCreate(async (snapshot, context) => {
    try {
      const venta = snapshot.data();
      const productos = venta.productos;
      
      const batch = admin.firestore().batch();
      
      for (const productoVenta of productos) {
        const productoRef = admin.firestore().collection('productos').doc(productoVenta.id);
        const productoDoc = await productoRef.get();
        
        if (productoDoc.exists) {
          const producto = productoDoc.data();
          const nuevoStock = producto.cantidad - productoVenta.cantidad;
          
          batch.update(productoRef, {
            cantidad: Math.max(0, nuevoStock),
            fecha_actualizacion: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      
      await batch.commit();
      console.log('Stock actualizado para venta:', context.params.ventaId);
      
    } catch (error) {
      console.error('Error actualizando stock:', error);
    }
  });

// Función para enviar alertas de stock bajo
exports.enviarAlertaStockBajo = functions.firestore
  .document('productos/{productoId}')
  .onUpdate(async (change, context) => {
    const antes = change.before.data();
    const despues = change.after.data();
    
    // Verificar si el stock bajó del umbral mínimo
    if (antes.cantidad > 5 && despues.cantidad <= 5) {
      console.log(`⚠️ Alerta: Stock bajo para ${despues.nombre} - ${despues.cantidad} unidades`);
      
      // Crear alerta en la base de datos
      return admin.firestore().collection('alertas_stock').add({
        productoId: context.params.productoId,
        productoNombre: despues.nombre,
        stockActual: despues.cantidad,
        fecha: admin.firestore.FieldValue.serverTimestamp(),
        tipo: 'stock_bajo',
        leido: false
      });
    }
    
    return null;
  });

// Exportar la app como Firebase Function
exports.api = functions.https.onRequest(app);