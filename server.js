const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8001;

// Configurar MongoDB
const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'paroquia_galeria';
let db;

// Conectar ao MongoDB
async function connectDB() {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    await db.collection('midias').createIndex({ createdAt: -1 });
    console.log('✅ Conectado ao MongoDB');
}

// Configurar multer para upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'frontend/uploads/galeria');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'video/mp4'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato não suportado. Use JPG, PNG ou MP4'));
        }
    }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'frontend/uploads')));

// GET - listar todas as mídias
app.get('/api/galeria', async (req, res) => {
    try {
        const midias = await db.collection('midias')
            .find()
            .sort({ createdAt: -1 })
            .toArray();
        res.json(midias);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST - criar mídia
app.post('/api/galeria', upload.single('file'), async (req, res) => {
    try {
        if (req.file) {
            const { titulo, descricao } = req.body;
            const arquivoUrl = `/uploads/galeria/${req.file.filename}`;
            const tipo = req.file.mimetype.startsWith('image/') ? 'imagem' : 'video';
            
            const result = await db.collection('midias').insertOne({
                titulo,
                descricao: descricao || '',
                arquivo: arquivoUrl,
                tipo,
                createdAt: new Date()
            });
            
            const midia = await db.collection('midias').findOne({ _id: result.insertedId });
            return res.status(201).json(midia);
        }
        
        const { titulo, descricao, arquivo } = req.body;
        
        if (!arquivo) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado e nenhum link fornecido' });
        }
        
        const tipo = arquivo.includes('.mp4') || arquivo.includes('.mov') ? 'video' : 'imagem';
        
        const result = await db.collection('midias').insertOne({
            titulo,
            descricao: descricao || '',
            arquivo: arquivo,
            tipo,
            createdAt: new Date()
        });
        
        const midia = await db.collection('midias').findOne({ _id: result.insertedId });
        res.status(201).json(midia);
        
    } catch (err) {
        console.error('Erro:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT - editar mídia
app.put('/api/galeria/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descricao } = req.body;
        
        await db.collection('midias').updateOne(
            { _id: new ObjectId(id) },
            { $set: { titulo, descricao: descricao || '' } }
        );
        
        const midia = await db.collection('midias').findOne({ _id: new ObjectId(id) });
        res.json(midia);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE - excluir mídia
app.delete('/api/galeria/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const midia = await db.collection('midias').findOne({ _id: new ObjectId(id) });
        
        if (midia && midia.arquivo && !midia.arquivo.startsWith('http')) {
            const filePath = path.join(__dirname, 'frontend', midia.arquivo);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        await db.collection('midias').deleteOne({ _id: new ObjectId(id) });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Iniciar servidor
app.listen(PORT, async () => {
    await connectDB();
    console.log(`🚀 Servidor da Galeria rodando na porta ${PORT}`);
    console.log(`✅ API: http://localhost:${PORT}/api/galeria`);
});