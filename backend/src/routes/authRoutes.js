const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'paroquia-secret-key-2024';

// Login
router.post('/login', (req, res) => {
    const { email, senha } = req.body;
    
    // Login padrão para teste
    if (email === 'admin@paroquia.com' && senha === 'admin123') {
        const token = jwt.sign(
            { id: 1, email: 'admin@paroquia.com', isAdmin: true },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token: token,
            user: {
                id: 1,
                nome: 'Administrador',
                email: 'admin@paroquia.com',
                isAdmin: true
            }
        });
    } else {
        res.status(401).json({ error: 'Email ou senha incorretos' });
    }
});

// Verificar token
router.get('/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ valid: true, user: decoded });
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

module.exports = router;
