// public/app.js - VERSIÓN MEJORADA
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

class PowerPuffApp {
    constructor() {
        this.initFirebase();
        this.initEventListeners();
    }

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
    }

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