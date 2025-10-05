// public/app.js - Configuración REAL
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

class PowerPuffApp {
    constructor() {
        this.initFirebase();
        this.initEventListeners();
    }

    initFirebase() {
        // CONFIGURACIÓN REAL DE TU PROYECTO
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

    // ... el resto del código se mantiene igual
    initEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // Intento de login con Firebase Auth
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            console.log('✅ Usuario logueado:', user);
            alert('✅ Inicio de sesión exitoso! Redirigiendo al dashboard...');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error en login:', error);
            
            // Modo demo si el auth no está configurado
            if (error.code === 'auth/configuration-not-found') {
                alert('⚠️ Auth no configurado. Usando modo demo...');
                if (email && password) {
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                }
            } else {
                alert('❌ Error: ' + error.message);
            }
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