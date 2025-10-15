// public/app.js - VERSIÓN MEJORADA CON ACTUALIZACIONES PWA
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

class PowerPuffApp {
    constructor() {
        this.initFirebase();
        this.initEventListeners();
        this.initPWAUpdateHandler(); // 🔥 NUEVO: Inicializar manejo de actualizaciones
    }

    // 🔥 NUEVO: Manejo de actualizaciones PWA
    initPWAUpdateHandler() {
        this.initServiceWorker();
        this.setupUpdateListeners();
    }

    // Registrar Service Worker
    async initServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registrado:', registration);
                
                this.setupUpdateTracking(registration);
            } catch (error) {
                console.error('❌ Error registrando Service Worker:', error);
            }
        }
    }

    // Configurar seguimiento de actualizaciones
    setupUpdateTracking(registration) {
        let refreshing = false;
        
        // Detectar cuando el controlador cambia (nueva versión activa)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                console.log('🔄 Nueva versión activa, recargando...');
                this.showUpdateNotification();
            }
        });

        // Escuchar cuando se encuentra una actualización
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 Nueva versión del Service Worker encontrada');
            
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('🔄 Nueva versión lista para activar');
                    // Forzar actualización inmediata
                    newWorker.postMessage('skipWaiting');
                }
            });
        });
    }

    // Configurar listeners de actualización
    setupUpdateListeners() {
        // Escuchar mensajes del Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                    this.showUpdateNotification();
                }
            });
        }
    }

    // 🔥 NUEVO: Mostrar notificación de actualización
    showUpdateNotification() {
        // Crear notificación elegante
        const updateNotification = document.createElement('div');
        updateNotification.className = 'update-notification alert alert-warning alert-dismissible fade show';
        updateNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        updateNotification.innerHTML = `
            <strong>🔄 Nueva versión disponible</strong>
            <p class="mb-2">Hay una actualización de la aplicación.</p>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-primary" onclick="app.forceUpdate()">
                    Actualizar ahora
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="this.closest('.alert').remove()">
                    Más tarde
                </button>
            </div>
        `;
        
        // Remover notificación existente si hay una
        const existingNotification = document.querySelector('.update-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        document.body.appendChild(updateNotification);
        
        // Auto-remover después de 30 segundos
        setTimeout(() => {
            if (updateNotification.parentNode) {
                updateNotification.remove();
            }
        }, 30000);
    }

    // 🔥 NUEVO: Forzar actualización inmediata
    async forceUpdate() {
        console.log('🔄 Forzando actualización...');
        
        if ('serviceWorker' in navigator) {
            try {
                // Obtener todos los registros de Service Worker
                const registrations = await navigator.serviceWorker.getRegistrations();
                
                // Desregistrar todos los Service Workers
                for (let registration of registrations) {
                    await registration.unregister();
                    console.log('🗑️ Service Worker desregistrado');
                }
                
                // Limpiar toda la cache
                if (caches && caches.keys) {
                    const cacheNames = await caches.keys();
                    await Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                    );
                    console.log('🗑️ Cache limpiada');
                }
                
                // Recargar la página forzadamente
                console.log('🔄 Recargando aplicación...');
                window.location.reload(true);
                
            } catch (error) {
                console.error('❌ Error forzando actualización:', error);
                // Fallback: recarga simple
                window.location.reload();
            }
        } else {
            // Fallback para navegadores sin Service Worker
            window.location.reload();
        }
    }

    // 🔥 NUEVO: Verificar actualizaciones manualmente
    async checkForUpdates() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                
                // Forzar actualización del Service Worker
                await registration.update();
                console.log('🔍 Buscando actualizaciones...');
                
                // Mostrar mensaje al usuario
                this.showToast('Buscando actualizaciones...', 'info');
                
            } catch (error) {
                console.error('❌ Error verificando actualizaciones:', error);
            }
        }
    }

    // 🔥 NUEVO: Mostrar toast notifications
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
        `;
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Inicializar toast de Bootstrap
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remover del DOM después de cerrar
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Tu código existente continúa aquí...
    initFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyDJIhyjLP2EEcg7RKgLHREmMosKA5cL6Qw",
            authDomain: "powerpuffit.firebaseapp.com",
            projectId: "powerpuffit",
            storageBucket: "powerpuffit.appspot.com",
            messagingSenderId: "450568163513",
            appId: "1:450568163513:web:ee8ccfa9fbfe1075d34b68"
        };
        
        try {
            this.app = initializeApp(firebaseConfig);
            this.db = getFirestore(this.app);
            this.auth = getAuth(this.app);
            console.log('✅ Firebase inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
        }
    }

    initEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.registerTestUser());
        }

        // 🔥 NUEVO: Agregar botón de actualización manual en el dashboard
        if (window.location.pathname.includes('dashboard.html')) {
            this.addUpdateButtonToDashboard();
        }
    }

    // 🔥 NUEVO: Agregar botón de actualización al dashboard
    addUpdateButtonToDashboard() {
        // Esperar a que el DOM esté listo
        setTimeout(() => {
            const header = document.querySelector('.navbar-nav.ms-auto');
            if (header) {
                const updateButton = document.createElement('button');
                updateButton.className = 'btn btn-outline-info btn-sm ms-2';
                updateButton.innerHTML = '<i class="fas fa-sync-alt"></i> Buscar Actualizaciones';
                updateButton.onclick = () => this.checkForUpdates();
                header.appendChild(updateButton);
            }
        }, 1000);
    }

    // El resto de tus métodos existentes se mantienen igual...
    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            alert('❌ Por favor ingresa email y contraseña');
            return;
        }
        
        try {
            console.log('🔐 Intentando login con:', email);
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            console.log('✅ Usuario autenticado:', user);
            alert('✅ Inicio de sesión exitoso! Redirigiendo al dashboard...');
            
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            console.error('❌ Error en login:', error);
            
            let errorMessage = 'Error desconocido';
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = '❌ Email inválido';
                    break;
                case 'auth/user-disabled':
                    errorMessage = '❌ Usuario deshabilitado';
                    break;
                case 'auth/user-not-found':
                    errorMessage = '❌ Usuario no encontrado. ¿Quieres registrarte?';
                    break;
                case 'auth/wrong-password':
                    errorMessage = '❌ Contraseña incorrecta';
                    break;
                case 'auth/configuration-not-found':
                    errorMessage = '❌ Firebase Auth no configurado. Ve a la consola y habilita Authentication.';
                    break;
                default:
                    errorMessage = `❌ Error: ${error.message}`;
            }
            
            alert(errorMessage);
            
            if (error.code === 'auth/user-not-found') {
                if (confirm('¿Quieres crear una cuenta con este email?')) {
                    await this.registerTestUser(email, password);
                }
            }
        }
    }

    async registerTestUser(email = null, password = null) {
        try {
            const userEmail = email || 'admin@powerpufffit.com';
            const userPassword = password || 'admin123';
            
            console.log('👤 Registrando usuario:', userEmail);
            const userCredential = await createUserWithEmailAndPassword(this.auth, userEmail, userPassword);
            const user = userCredential.user;
            
            console.log('✅ Usuario registrado:', user);
            alert(`✅ Usuario creado exitosamente!\nEmail: ${userEmail}\nContraseña: ${userPassword}`);
            
            await this.handleLoginAfterRegister(userEmail, userPassword);
            
        } catch (error) {
            console.error('❌ Error registrando usuario:', error);
            
            if (error.code === 'auth/email-already-in-use') {
                alert('❌ Este email ya está registrado. Intenta iniciar sesión.');
            } else {
                alert('❌ Error creando usuario: ' + error.message);
            }
        }
    }

    async handleLoginAfterRegister(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            console.log('✅ Sesión iniciada después del registro');
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('❌ Error después del registro:', error);
        }
    }

    // Métodos para gestión de productos
    async getProducts() {
        try {
            const querySnapshot = await getDocs(collection(this.db, "productos"));
            const products = [];
            querySnapshot.forEach((doc) => {
                products.push({ id: doc.id, ...doc.data() });
            });
            return products;
        } catch (error) {
            console.error("Error obteniendo productos:", error);
            throw error;
        }
    }

    async addProduct(productData) {
        try {
            const docRef = await addDoc(collection(this.db, "productos"), {
                ...productData,
                fecha_creacion: new Date(),
                activo: true
            });
            return docRef.id;
        } catch (error) {
            console.error("Error agregando producto:", error);
            throw error;
        }
    }

    async updateProduct(productId, productData) {
        try {
            const productRef = doc(this.db, "productos", productId);
            await updateDoc(productRef, productData);
        } catch (error) {
            console.error("Error actualizando producto:", error);
            throw error;
        }
    }

    async deleteProduct(productId) {
        try {
            await deleteDoc(doc(this.db, "productos", productId));
        } catch (error) {
            console.error("Error eliminando producto:", error);
            throw error;
        }
    }

    // Métodos para gestión de ventas
    async getVentas() {
        try {
            const querySnapshot = await getDocs(collection(this.db, "ventas"));
            const ventas = [];
            querySnapshot.forEach((doc) => {
                ventas.push({ id: doc.id, ...doc.data() });
            });
            return ventas;
        } catch (error) {
            console.error("Error obteniendo ventas:", error);
            throw error;
        }
    }

    async addVenta(ventaData) {
        try {
            const docRef = await addDoc(collection(this.db, "ventas"), {
                ...ventaData,
                fecha_venta: new Date(),
                estado: 'completada'
            });
            return docRef.id;
        } catch (error) {
            console.error("Error agregando venta:", error);
            throw error;
        }
    }

    async updateVenta(ventaId, ventaData) {
        try {
            const ventaRef = doc(this.db, "ventas", ventaId);
            await updateDoc(ventaRef, ventaData);
        } catch (error) {
            console.error("Error actualizando venta:", error);
            throw error;
        }
    }

    async deleteVenta(ventaId) {
        try {
            await deleteDoc(doc(this.db, "ventas", ventaId));
        } catch (error) {
            console.error("Error eliminando venta:", error);
            throw error;
        }
    }

    // Métodos para gestión de clientes
    async getClientes() {
        try {
            const querySnapshot = await getDocs(collection(this.db, "clientes"));
            const clientes = [];
            querySnapshot.forEach((doc) => {
                clientes.push({ id: doc.id, ...doc.data() });
            });
            return clientes;
        } catch (error) {
            console.error("Error obteniendo clientes:", error);
            throw error;
        }
    }

    async addCliente(clienteData) {
        try {
            const docRef = await addDoc(collection(this.db, "clientes"), {
                ...clienteData,
                fecha_registro: new Date(),
                total_compras: 0,
                monto_total: 0,
                activo: true
            });
            return docRef.id;
        } catch (error) {
            console.error("Error agregando cliente:", error);
            throw error;
        }
    }

    async updateCliente(clienteId, clienteData) {
        try {
            const clienteRef = doc(this.db, "clientes", clienteId);
            await updateDoc(clienteRef, clienteData);
        } catch (error) {
            console.error("Error actualizando cliente:", error);
            throw error;
        }
    }

    // Métodos para reportes avanzados
    async getReporteClientesFrecuentes() {
        try {
            const clientesSnapshot = await getDocs(
                query(collection(this.db, "clientes"), 
                orderBy("total_compras", "desc"),
                limit(10))
            );
            
            const clientes = [];
            clientesSnapshot.forEach((doc) => {
                clientes.push({ id: doc.id, ...doc.data() });
            });
            
            return clientes;
        } catch (error) {
            console.error("Error obteniendo clientes frecuentes:", error);
            throw error;
        }
    }

    async getProductosStockBajo(limite = 5) {
        try {
            const productosSnapshot = await getDocs(
                query(collection(this.db, "productos"), 
                where("cantidad", "<=", limite),
                where("activo", "==", true))
            );
            
            const productos = [];
            productosSnapshot.forEach((doc) => {
                productos.push({ id: doc.id, ...doc.data() });
            });
            
            return productos;
        } catch (error) {
            console.error("Error obteniendo productos con stock bajo:", error);
            throw error;
        }
    }

    // Método para generar reportes
    async generarReporte(tipo, fechaInicio, fechaFin) {
        try {
            let data = [];
            
            if (tipo === 'ventas') {
                const ventasQuery = query(
                    collection(this.db, "ventas"),
                    where("fecha_venta", ">=", fechaInicio),
                    where("fecha_venta", "<=", fechaFin),
                    orderBy("fecha_venta", "desc")
                );
                
                const querySnapshot = await getDocs(ventasQuery);
                querySnapshot.forEach((doc) => {
                    data.push({ id: doc.id, ...doc.data() });
                });
            } else if (tipo === 'productos') {
                const productosQuery = query(
                    collection(this.db, "productos"),
                    orderBy("fecha_creacion", "desc")
                );
                
                const querySnapshot = await getDocs(productosQuery);
                querySnapshot.forEach((doc) => {
                    data.push({ id: doc.id, ...doc.data() });
                });
            }
            
            return data;
        } catch (error) {
            console.error("Error generando reporte:", error);
            throw error;
        }
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PowerPuffApp();
});