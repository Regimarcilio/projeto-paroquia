const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');

// Aplicar autenticação em todas as rotas admin
router.use(authMiddleware);

// Horários
router.get('/horarios', AdminController.listarHorarios);
router.post('/horarios', AdminController.salvarHorarios);

// Galeria
router.get('/galeria', AdminController.listarFotos);
router.post('/galeria', uploadMiddleware, AdminController.uploadFoto);
router.delete('/galeria/:id', AdminController.deletarFoto);

// Notícias
router.post('/noticias', uploadMiddleware, AdminController.criarNoticia);

// Sistema
router.post('/backup', AdminController.executarBackup);

module.exports = router;
