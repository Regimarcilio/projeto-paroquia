const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8002;

app.use(cors());
app.use(express.json());  // <-- ESSA LINHA É ESSENCIAL

// MongoDB
const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'paroquia';
let db;

async function connectDB() {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    // Verificar se as coleções existem, se não, criar
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('noticias')) {
        await db.createCollection('noticias');
        console.log('✅ Coleção noticias criada');
    }
    if (!collectionNames.includes('eventos')) {
        await db.createCollection('eventos');
        console.log('✅ Coleção eventos criada');
    }
    if (!collectionNames.includes('pastorais')) {
        await db.createCollection('pastorais');
        console.log('✅ Coleção pastorais criada');
    }
    if (!collectionNames.includes('horarios')) {
        await db.createCollection('horarios');
        console.log('✅ Coleção horarios criada');
    }
    if (!collectionNames.includes('contatos')) {
        await db.createCollection('contatos');
        console.log('✅ Coleção contatos criada');
    }
    
    console.log('✅ Conectado ao MongoDB');
}

// ==================== NOTÍCIAS ====================
app.get('/api/noticias', async (req, res) => {
    try {
        const noticias = await db.collection('noticias')
            .find()
            .sort({ data_publicacao: -1 })
            .toArray();
        res.json(noticias);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/noticias/:id', async (req, res) => {
    try {
        const noticia = await db.collection('noticias')
            .findOne({ id: parseInt(req.params.id) });
        res.json(noticia);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/admin/noticias', async (req, res) => {
    try {
        const { titulo, conteudo, imagem } = req.body;
        const maxId = await db.collection('noticias').find().sort({ id: -1 }).limit(1).toArray();
        const newId = maxId.length > 0 ? maxId[0].id + 1 : 1;
        
        const noticia = {
            id: newId,
            titulo,
            conteudo,
            imagem: imagem || null,
            data_publicacao: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };
        
        await db.collection('noticias').insertOne(noticia);
        res.json(noticia);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/noticias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, conteudo, imagem } = req.body;
        
        await db.collection('noticias').updateOne(
            { id: parseInt(id) },
            { 
                $set: {
                    titulo,
                    conteudo,
                    imagem: imagem || null,
                    data_publicacao: new Date().toISOString().slice(0, 19).replace('T', ' ')
                }
            }
        );
        
        res.json({ id });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/noticias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('noticias').deleteOne({ id: parseInt(id) });
        res.status(204).send();
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== EVENTOS ====================
app.get('/api/eventos', async (req, res) => {
    try {
        const eventos = await db.collection('eventos')
            .find()
            .sort({ data: -1 })
            .toArray();
        res.json(eventos);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/eventos', async (req, res) => {
    try {
        const { nome, descricao, data, local, imagem } = req.body;
        const maxId = await db.collection('eventos').find().sort({ id: -1 }).limit(1).toArray();
        const newId = maxId.length > 0 ? maxId[0].id + 1 : 1;
        
        const evento = {
            id: newId,
            nome,
            descricao,
            data,
            local,
            imagem: imagem || null,
            createdAt: new Date()
        };
        
        await db.collection('eventos').insertOne(evento);
        res.json(evento);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== LOGIN ====================
app.post('/api/admin/login', (req, res) => {
  try {
    const { email, senha } = req.body;
    console.log('Login tentativa:', email);
    
    if (email === 'admin@paroquia.com' && senha === 'admin') {
      res.json({
        success: true,
        token: 'admin-token',
        user: { email: 'admin@paroquia.com', nome: 'Administrador' }
      });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/eventos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, data, local, imagem } = req.body;
        
        await db.collection('eventos').updateOne(
            { id: parseInt(id) },
            { $set: { nome, descricao, data, local, imagem: imagem || null } }
        );
        
        res.json({ id });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/eventos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('eventos').deleteOne({ id: parseInt(id) });
        res.status(204).send();
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== PASTORAIS ====================
app.get('/api/pastorais', async (req, res) => {
    try {
        const pastorais = await db.collection('pastorais')
            .find()
            .toArray();
        res.json(pastorais);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/pastorais', async (req, res) => {
    try {
        const { nome, descricao, responsavel, contato } = req.body;
        const maxId = await db.collection('pastorais').find().sort({ id: -1 }).limit(1).toArray();
        const newId = maxId.length > 0 ? maxId[0].id + 1 : 1;
        
        const pastoral = {
            id: newId,
            nome,
            descricao,
            responsavel,
            contato,
            createdAt: new Date()
        };
        
        await db.collection('pastorais').insertOne(pastoral);
        res.json(pastoral);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/pastorais/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, responsavel, contato } = req.body;
        
        await db.collection('pastorais').updateOne(
            { id: parseInt(id) },
            { $set: { nome, descricao, responsavel, contato } }
        );
        
        res.json({ id });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/pastorais/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('pastorais').deleteOne({ id: parseInt(id) });
        res.status(204).send();
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== CONTATOS ====================
app.get('/api/contatos', async (req, res) => {
    try {
        const contatos = await db.collection('contatos')
            .find()
            .sort({ createdAt: -1 })
            .toArray();
        res.json(contatos);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/contatos', async (req, res) => {
    try {
        const { nome, email, telefone, mensagem, tipo } = req.body;
        const contato = {
            nome,
            email,
            telefone,
            mensagem,
            tipo: tipo || 'contato',
            respondido: false,
            createdAt: new Date()
        };
        
        await db.collection('contatos').insertOne(contato);
        res.status(201).json(contato);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/contatos/:id/responder', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('contatos').updateOne(
            { _id: new ObjectId(id) },
            { $set: { respondido: true } }
        );
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/contatos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('contatos').deleteOne({ _id: new ObjectId(id) });
        res.status(204).send();
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== HORÁRIOS ====================
app.get('/api/horarios/agrupados', async (req, res) => {
    try {
        const horarios = await db.collection('horarios').find({ ativo: 1 }).toArray();
        const agrupados = {};
        
        horarios.forEach(h => {
            const dia = h.dia_semana;  // Usar dia_semana (com underline)
            if (!agrupados[dia]) {
                agrupados[dia] = [];
            }
            agrupados[dia].push({ horario: h.horario, tipo: h.tipo });
        });
        
        // Ordenar os dias
        const ordem = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const resultado = {};
        ordem.forEach(dia => {
            if (agrupados[dia]) {
                resultado[dia] = agrupados[dia];
            }
        });
        
        res.json(resultado);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Evento por ID
app.get('/api/eventos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const evento = await db.collection('eventos').findOne({ id: id });
        if (!evento) {
            return res.status(404).json({ error: 'Evento não encontrado' });
        }
        res.json(evento);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/horarios', async (req, res) => {
    try {
        const horarios = await db.collection('horarios').find().toArray();
        res.json(horarios);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/horarios', async (req, res) => {
    try {
        const { diaSemana, horario, tipo, ativo } = req.body;
        const maxId = await db.collection('horarios').find().sort({ id: -1 }).limit(1).toArray();
        const newId = maxId.length > 0 ? maxId[0].id + 1 : 1;
        
        const item = {
            id: newId,
            dia_semana: diaSemana,
            horario,
            tipo,
            ativo: ativo !== false
        };
        
        await db.collection('horarios').insertOne(item);
        res.json(item);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/horarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { diaSemana, horario, tipo, ativo } = req.body;
        
        await db.collection('horarios').updateOne(
            { id: parseInt(id) },
            { $set: { dia_semana: diaSemana, horario, tipo, ativo } }
        );
        
        res.json({ id });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/horarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('horarios').deleteOne({ id: parseInt(id) });
        res.status(204).send();
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== LOGIN (alias para compatibilidade) ====================
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, senha } = req.body;
    
    if (email === 'admin@paroquia.com' && senha === 'admin') {
      res.json({ 
        success: true, 
        token: 'admin-token',
        user: { email: 'admin@paroquia.com', nome: 'Administrador' }
      });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// ==================== GALERIA ====================
const multer = require('multer');

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

// ==================== SOBRE ====================
app.get('/api/sobre', async (req, res) => {
    try {
        let sobre = await db.collection('sobre').findOne({});
        if (!sobre) {
            sobre = {
                historia: '',
                missao: '',
                visao: '',
                valores: '',
                padroeiro: 'São Miguel Arcanjo',
                endereco: 'Rua Paulo Roberto Anastácio, 616 - Paranaguamirim, Joinville/SC',
                telefone: '(47) 3463-7590',
                email: 'psec78@diocesejoinville.com.br',
                whatsapp: ''
            };
        }
        res.json(sobre);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/sobre', async (req, res) => {
    try {
        const { historia, missao, visao, valores, padroeiro, endereco, telefone, email, whatsapp } = req.body;
        
        await db.collection('sobre').deleteMany({});
        await db.collection('sobre').insertOne({
            historia,
            missao,
            visao,
            valores,
            padroeiro,
            endereco,
            telefone,
            email,
            whatsapp,
            updatedAt: new Date()
        });
        
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});
// Rotas da galeria
app.get('/api/galeria', async (req, res) => {
    try {
        const midias = await db.collection('midias')
            .find()
            .sort({ createdAt: -1 })
            .toArray();
        res.json(midias);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

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
    } catch(err) {
        console.error('Erro:', err);
        res.status(500).json({ error: err.message });
    }
});

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
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

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
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== INICIAR SERVIDOR ====================
app.listen(PORT, async () => {
    await connectDB();
    console.log(`🚀 Servidor unificado rodando na porta ${PORT}`);
    console.log(`✅ API: http://localhost:${PORT}/api/noticias`);
});
