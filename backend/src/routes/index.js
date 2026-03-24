const express = require('express');
const router = express.Router();

// Importar rotas
const publicRoutes = require('./publicRoutes');
const authRoutes = require('./authRoutes');

// Rotas públicas (sem autenticação)
router.use('/', publicRoutes);

// Rotas de autenticação
router.use('/auth', authRoutes);

// Rota de teste
router.get('/test', (req, res) => {
    res.json({ message: 'API funcionando!', rotas: ['/health', '/horarios/agrupados', '/noticias/', '/eventos/', '/auth/login'] });
});

module.exports = router;
