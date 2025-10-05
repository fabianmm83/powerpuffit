// public/app.js - VERSIÓN CORREGIDA
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
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

        // Botón de registro rápido para testing
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
            
            // Redirigir inmediatamente
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            console.error('❌ Error en login:', error);
            
            // Mostrar error específico
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
            
            // Si el usuario no existe, ofrecer registro
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
            
            // Iniciar sesión automáticamente
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

    async testFirestore() {
        try {
            const testProduct = {
                nombre: "Producto de Prueba " + Date.now(),
                descripcion: "Este es un producto de prueba de PowerPuffFit",
                precio: 29.99,
                cantidad: 15,
                categoria: "deportes",
                activo: true,
                fecha_registro: new Date()
            };

            const docRef = await addDoc(collection(this.db, "productos"), testProduct);
            console.log("✅ Producto creado con ID: ", docRef.id);
            alert(`✅ Producto de prueba creado con ID: ${docRef.id}`);
            
        } catch (error) {
            console.error("❌ Error creando producto:", error);
            alert("❌ Error: " + error.message);
        }
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PowerPuffApp();
});