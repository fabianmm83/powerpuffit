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
      throw error;
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
      
      // Aquí puedes agregar notificaciones push, emails, etc.
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

// Función para calcular métricas automáticamente
exports.calcularMetricasDiarias = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      const hoy = new Date();
      const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      
      const ventasSnapshot = await admin.firestore()
        .collection('ventas')
        .where('fecha_venta', '>=', inicioDia)
        .get();
      
      let totalVentas = 0;
      let cantidadVentas = 0;
      let productosVendidos = 0;
      
      ventasSnapshot.forEach(doc => {
        const venta = doc.data();
        totalVentas += venta.total || 0;
        cantidadVentas++;
        productosVendidos += venta.productos?.reduce((sum, p) => sum + p.cantidad, 0) || 0;
      });
      
      const metricas = {
        fecha: inicioDia,
        totalVentas: totalVentas,
        cantidadVentas: cantidadVentas,
        productosVendidos: productosVendidos,
        ticketPromedio: cantidadVentas > 0 ? totalVentas / cantidadVentas : 0,
        fecha_calculo: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await admin.firestore().collection('metricas_diarias').add(metricas);
      console.log('Métricas diarias calculadas:', metricas);
      
    } catch (error) {
      console.error('Error calculando métricas:', error);
    }
  });

// Función para limpiar datos temporales
exports.limpiarDatosTemporales = functions.pubsub
  .schedule('every 7 days')
  .onRun(async (context) => {
    try {
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      
      const carritosSnapshot = await admin.firestore()
        .collection('carritos_temporales')
        .where('fecha_creacion', '<', hace30Dias)
        .get();
      
      const batch = admin.firestore().batch();
      carritosSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log('Carritos temporales limpiados');
      
    } catch (error) {
      console.error('Error limpiando datos temporales:', error);
    }
  });

// Función para backup automático
exports.backupAutomatico = functions.pubsub
  .schedule('0 2 * * *') // Todos los días a las 2 AM
  .onRun(async (context) => {
    // Aquí puedes implementar backup a Google Cloud Storage
    console.log('Backup automático ejecutado');
  });

// Exportar la app como Firebase Function
exports.api = functions.https.onRequest(app);