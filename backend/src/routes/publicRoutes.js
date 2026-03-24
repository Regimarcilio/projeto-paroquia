const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'backend', 
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// Horários agrupados
router.get('/horarios/agrupados', (req, res) => {
    res.json({
        "Domingo": [
            {"horario": "08:00", "tipo": "Missa"},
            {"horario": "10:00", "tipo": "Missa"},
            {"horario": "19:00", "tipo": "Missa"}
        ],
        "Segunda": [{"horario": "19:00", "tipo": "Missa"}],
        "Terça": [{"horario": "19:00", "tipo": "Missa"}],
        "Quarta": [{"horario": "19:00", "tipo": "Missa"}],
        "Quinta": [
            {"horario": "19:00", "tipo": "Missa"},
            {"horario": "18:00", "tipo": "Adoração"}
        ],
        "Sexta": [
            {"horario": "15:00", "tipo": "Missa"},
            {"horario": "19:00", "tipo": "Terço"}
        ],
        "Sábado": [
            {"horario": "16:00", "tipo": "Confissões"},
            {"horario": "17:00", "tipo": "Missa"},
            {"horario": "19:00", "tipo": "Missa"}
        ]
    });
});

// Notícias
router.get('/noticias/', (req, res) => {
    res.json([
        {
            id: 1,
            titulo: 'Bem-vindos à Paróquia São Miguel',
            conteudo: 'Sejam todos muito bem-vindos à nossa comunidade paroquial! Estamos felizes em tê-los conosco.',
            data_publicacao: new Date().toISOString(),
            imagem: ''
        },
        {
            id: 2,
            titulo: 'Missa de Ação de Graças',
            conteudo: 'Neste domingo teremos missa especial de ação de graças às 10h.',
            data_publicacao: new Date(Date.now() - 86400000).toISOString(),
            imagem: ''
        }
    ]);
});

// Eventos próximos
router.get('/eventos/proximos', (req, res) => {
    res.json([
        {
            id: 1,
            nome: 'Festa do Padroeiro',
            descricao: 'Celebração em honra a São Miguel Arcanjo',
            data: '2024-12-08T10:00:00',
            horario: '10:00',
            local: 'Igreja Matriz'
        }
    ]);
});

// Eventos
router.get('/eventos/', (req, res) => {
    res.json([]);
});

// Criar pedido de oração
router.post('/oracoes/', (req, res) => {
    res.status(201).json({ 
        message: 'Pedido de oração enviado com sucesso!', 
        id: Date.now() 
    });
});

module.exports = router;
