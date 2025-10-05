import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'PowerPuffFit API funcionando' });
});

// Servir archivos estáticos del frontend
app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});