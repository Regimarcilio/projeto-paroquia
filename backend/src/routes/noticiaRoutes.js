const express = require('express');
const NoticiaController = require('../controllers/NoticiaController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', NoticiaController.index);
router.post('/', authMiddleware, NoticiaController.store);

module.exports = router;