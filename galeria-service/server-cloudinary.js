const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { MongoClient, ObjectId } = require('mongodb');
const cloudinary = require('./cloudinary-config');
require('dotenv').config();

const app = express();
const PORT = 8001;

// Configurar MongoDB
const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'paroquia_galeria';
let db;

// Configurar multer para receber arquivos (apenas em memória)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
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

// Conectar ao MongoDB
async function connectDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        await db.collection('midias').createIndex({ createdAt: -1 });
        console.log('✅ Conectado ao MongoDB');
        return true;
    } catch (err) {
        console.error('❌ Erro ao conectar MongoDB:', err.message);
        return false;
    }
}

// Rota para listar mídias
app.get('/api/galeria', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: 'Banco não conectado' });
        const midias = await db.collection('midias').find().sort({ createdAt: -1 }).toArray();
        res.json(midias);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rota para upload via Cloudinary
app.post('/api/galeria', upload.single('file'), async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: 'Banco não conectado' });
        if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        
        const { titulo, descricao } = req.body;
        
        // Upload para Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'paroquia_galeria',
                    resource_type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
                    public_id: `${Date.now()}_${titulo.replace(/\s/g, '_')}`,
                    transformation: req.file.mimetype.startsWith('image/') ? [
                        { width: 1200, height: 800, crop: 'limit' },
                        { quality: 'auto' },
                        { fetch_format: 'auto' }
                    ] : []
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });
        
        // Salvar no MongoDB
        const midia = {
            titulo: titulo || 'Sem título',
            descricao: descricao || '',
            arquivo: result.secure_url,
            public_id: result.public_id,
            tipo: req.file.mimetype.startsWith('image/') ? 'imagem' : 'video',
            createdAt: new Date(),
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height
        };
        
        const insertResult = await db.collection('midias').insertOne(midia);
        midia._id = insertResult.insertedId;
        
        res.status(201).json(midia);
    } catch (err) {
        console.error('Erro no upload:', err);
        res.status(500).json({ error: err.message });
    }
});

// Rota para editar mídia
app.put('/api/galeria/:id', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: 'Banco não conectado' });
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

// Rota para excluir mídia
app.delete('/api/galeria/:id', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ error: 'Banco não conectado' });
        const { id } = req.params;
        const midia = await db.collection('midias').findOne({ _id: new ObjectId(id) });
        
        // Deletar do Cloudinary
        if (midia && midia.public_id) {
            const resourceType = midia.tipo === 'video' ? 'video' : 'image';
            await cloudinary.uploader.destroy(midia.public_id, { resource_type: resourceType });
        }
        
        await db.collection('midias').deleteOne({ _id: new ObjectId(id) });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Iniciar servidor
async function start() {
    const connected = await connectDB();
    if (!connected) {
        console.log('⚠️  MongoDB não conectado. Tentando novamente em 5 segundos...');
        setTimeout(start, 5000);
        return;
    }
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor da Galeria rodando na porta ${PORT}`);
        console.log(`✅ API: http://localhost:${PORT}/api/galeria`);
        console.log(`☁️  Usando Cloudinary para armazenamento`);
    });
}

start();
