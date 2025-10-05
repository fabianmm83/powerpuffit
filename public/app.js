// public/app.js
class PowerPuffApp {
  constructor() {
    this.initFirebase();
    this.initEventListeners();
    this.loadProducts();
  }

  initFirebase() {
    // Configuración de Firebase para el frontend
    const firebaseConfig = {
      apiKey: "tu-api-key",
      authDomain: "powerpuffit.firebaseapp.com",
      projectId: "powerpuffit",
      storageBucket: "powerpuffit.appspot.com",
      messagingSenderId: "123456789",
      appId: "tu-app-id"
    };
    
    firebase.initializeApp(firebaseConfig);
    this.db = firebase.firestore();
    this.auth = firebase.auth();
  }

  initEventListeners() {
    // Event listeners para la interfaz
    document.getElementById('filtroForm').addEventListener('submit', this.filterProducts.bind(this));
    // Más event listeners...
  }

  async loadProducts(categoria = 'todas') {
    try {
      let query = this.db.collection('productos').where('activo', '==', true);
      
      if (categoria !== 'todas') {
        query = query.where('categoria', '==', categoria);
      }

      const snapshot = await query.get();
      this.displayProducts(snapshot.docs);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }

  displayProducts(products) {
    const tbody = document.getElementById('productosLista');
    tbody.innerHTML = '';

    products.forEach(doc => {
      const producto = doc.data();
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td>${doc.id}</td>
        <td>${producto.nombre}</td>
        <td>${producto.descripcion}</td>
        <td>$${producto.precio}</td>
        <td>${producto.cantidad}</td>
        <td>${producto.categoria}</td>
        <td>${producto.fecha_registro?.toDate().toLocaleString() || 'No tiene fecha'}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="app.editProduct('${doc.id}')">Editar</button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
  }

  filterProducts(event) {
    event.preventDefault();
    const categoria = document.getElementById('categoria').value;
    this.loadProducts(categoria);
  }

  async editProduct(productId) {
    // Lógica para editar producto
    console.log('Editando producto:', productId);
  }
}

// Inicializar la aplicación
const app = new PowerPuffApp();