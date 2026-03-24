const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

let db;

async function initDB() {
  db = await open({ filename: './data/paroquia.db', driver: sqlite3.Database });
  
  await db.exec(`CREATE TABLE IF NOT EXISTS noticias (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, conteudo TEXT, data_publicacao DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS eventos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, descricao TEXT, data DATETIME, horario TEXT, local TEXT, imagem TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS horarios (id INTEGER PRIMARY KEY AUTOINCREMENT, dia_semana TEXT, horario TEXT, tipo TEXT DEFAULT 'Missa', ativo INTEGER DEFAULT 1)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS pastorais (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, descricao TEXT, responsavel TEXT, contato TEXT, ativo INTEGER DEFAULT 1)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, senha_hash TEXT)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS contatos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, email TEXT, telefone TEXT, mensagem TEXT, tipo TEXT DEFAULT 'contato', respondido INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS sobre (id INTEGER PRIMARY KEY AUTOINCREMENT, historia TEXT, missao TEXT, visao TEXT, valores TEXT, padroeiro TEXT, endereco TEXT, telefone TEXT, email TEXT, whatsapp TEXT)`);
  
  // Admin
  const admin = await db.get('SELECT * FROM usuarios WHERE email = ?', ['admin@paroquia.com']);
  if (!admin) {
    const hash = await bcrypt.hash('admin123', 10);
    await db.run('INSERT INTO usuarios (email, senha_hash) VALUES (?, ?)', ['admin@paroquia.com', hash]);
  }
  
  // Horários padrão
  const horariosCount = await db.get('SELECT COUNT(*) as c FROM horarios');
  if (horariosCount.c === 0) {
    const horarios = [
      ['Domingo', '08:00', 'Missa'], ['Domingo', '10:00', 'Missa'], ['Domingo', '19:00', 'Missa'],
      ['Segunda', '19:00', 'Missa'], ['Terça', '19:00', 'Missa'], ['Quarta', '19:00', 'Missa'],
      ['Quinta', '19:00', 'Missa'], ['Quinta', '18:00', 'Adoração'],
      ['Sexta', '15:00', 'Missa'], ['Sexta', '19:00', 'Terço'],
      ['Sábado', '16:00', 'Confissões'], ['Sábado', '17:00', 'Missa'], ['Sábado', '19:00', 'Missa']
    ];
    for (const h of horarios) await db.run('INSERT INTO horarios (dia_semana, horario, tipo) VALUES (?, ?, ?)', h);
  }
  
  // Pastorais padrão
  const pastoraisCount = await db.get('SELECT COUNT(*) as c FROM pastorais');
  if (pastoraisCount.c === 0) {
    const pastorais = [
      ['Catequese', 'Formação cristã', 'Ir. Maria', '(11) 99999-1111'],
      ['Grupo de Jovens', 'Encontros semanais', 'João Silva', '(11) 99999-2222'],
      ['Pastoral da Família', 'Apoio às famílias', 'Antônio e Maria', '(11) 99999-3333'],
      ['Pastoral Social', 'Ações de caridade', 'Francisco Lima', '(11) 99999-4444']
    ];
    for (const p of pastorais) await db.run('INSERT INTO pastorais (nome, descricao, responsavel, contato) VALUES (?, ?, ?, ?)', p);
  }
  
  console.log('✅ Banco inicializado!');
}

initDB();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token === 'admin-token') return next();
  res.status(401).json({ error: 'Não autorizado' });
};

// ============= ROTAS PÚBLICAS =============
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/noticias/', async (req, res) => {
  const n = await db.all('SELECT * FROM noticias ORDER BY data_publicacao DESC');
  res.json(n);
});

app.get('/api/eventos/', async (req, res) => {
  const e = await db.all('SELECT * FROM eventos ORDER BY data DESC');
  res.json(e);
});

app.get('/api/pastorais/', async (req, res) => {
  const p = await db.all('SELECT * FROM pastorais WHERE ativo = 1');
  res.json(p);
});

app.get('/api/contatos/', async (req, res) => {
  const c = await db.all('SELECT * FROM contatos ORDER BY created_at DESC');
  res.json(c);
});

app.get('/api/sobre/', async (req, res) => {
  const s = await db.get('SELECT * FROM sobre WHERE id = 1');
  res.json(s || {});
});

app.get('/api/horarios/agrupados', async (req, res) => {
  const horarios = await db.all('SELECT * FROM horarios WHERE ativo = 1');
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const agrupados = {};
  dias.forEach(d => agrupados[d] = []);
  horarios.forEach(h => {
    if (agrupados[h.dia_semana]) agrupados[h.dia_semana].push({ horario: h.horario, tipo: h.tipo });
  });
  res.json(agrupados);
});

app.get('/api/horarios/:id', async (req, res) => {
  const h = await db.get('SELECT * FROM horarios WHERE id = ?', [req.params.id]);
  res.json(h || {});
});

app.get('/api/noticias/:id', async (req, res) => {
  const n = await db.get('SELECT * FROM noticias WHERE id = ?', [req.params.id]);
  res.json(n || {});
});

app.get('/api/eventos/:id', async (req, res) => {
  const e = await db.get('SELECT * FROM eventos WHERE id = ?', [req.params.id]);
  res.json(e || {});
});

app.get('/api/pastorais/:id', async (req, res) => {
  const p = await db.get('SELECT * FROM pastorais WHERE id = ?', [req.params.id]);
  res.json(p || {});
});

app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  const user = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
  const valid = await bcrypt.compare(senha, user.senha_hash);
  if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
  res.json({ token: 'admin-token', user: { email: user.email } });
});

app.post('/api/contato/', async (req, res) => {
  const { tipo, nome, email, telefone, mensagem } = req.body;
  const tipoFinal = tipo || 'contato';
  await db.run('INSERT INTO contatos (tipo, nome, email, telefone, mensagem) VALUES (?, ?, ?, ?, ?)', 
    [tipoFinal, nome, email, telefone || '', mensagem]);
  res.status(201).json({ message: 'Mensagem enviada!' });
});

// ============= ROTAS ADMIN =============
app.get('/api/admin/horarios', authMiddleware, async (req, res) => {
  const h = await db.all('SELECT * FROM horarios');
  res.json(h);
});

app.post('/api/admin/horarios', authMiddleware, async (req, res) => {
  const { diaSemana, horario, tipo, ativo } = req.body;
  const r = await db.run('INSERT INTO horarios (dia_semana, horario, tipo, ativo) VALUES (?, ?, ?, ?)', 
    [diaSemana, horario, tipo, ativo ? 1 : 0]);
  res.json({ id: r.lastID });
});

app.put('/api/admin/horarios/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { diaSemana, horario, tipo, ativo } = req.body;
  await db.run('UPDATE horarios SET dia_semana = ?, horario = ?, tipo = ?, ativo = ? WHERE id = ?', 
    [diaSemana, horario, tipo, ativo ? 1 : 0, id]);
  res.json({ id });
});

app.delete('/api/admin/horarios/:id', authMiddleware, async (req, res) => {
  await db.run('DELETE FROM horarios WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

app.get('/api/admin/noticias', authMiddleware, async (req, res) => {
  const n = await db.all('SELECT * FROM noticias ORDER BY data_publicacao DESC');
  res.json(n);
});

app.post('/api/admin/noticias', authMiddleware, async (req, res) => {
  const { titulo, conteudo } = req.body;
  const r = await db.run('INSERT INTO noticias (titulo, conteudo) VALUES (?, ?)', [titulo, conteudo]);
  res.json({ id: r.lastID });
});

app.put('/api/admin/noticias/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { titulo, conteudo } = req.body;
  await db.run('UPDATE noticias SET titulo = ?, conteudo = ? WHERE id = ?', [titulo, conteudo, id]);
  res.json({ id });
});

app.delete('/api/admin/noticias/:id', authMiddleware, async (req, res) => {
  await db.run('DELETE FROM noticias WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

app.get('/api/admin/eventos', authMiddleware, async (req, res) => {
  const e = await db.all('SELECT * FROM eventos ORDER BY data DESC');
  res.json(e);
});

app.post('/api/admin/eventos', authMiddleware, async (req, res) => {
  const { nome, descricao, data, horario, local } = req.body;
  const r = await db.run('INSERT INTO eventos (nome, descricao, data, horario, local) VALUES (?, ?, ?, ?, ?)', 
    [nome, descricao, data, horario, local]);
  res.json({ id: r.lastID });
});

app.put('/api/admin/eventos/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, data, horario, local } = req.body;
  await db.run('UPDATE eventos SET nome = ?, descricao = ?, data = ?, horario = ?, local = ? WHERE id = ?', 
    [nome, descricao, data, horario, local, id]);
  res.json({ id });
});

app.delete('/api/admin/eventos/:id', authMiddleware, async (req, res) => {
  await db.run('DELETE FROM eventos WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

app.get('/api/admin/pastorais', authMiddleware, async (req, res) => {
  const p = await db.all('SELECT * FROM pastorais');
  res.json(p);
});

app.post('/api/admin/pastorais', authMiddleware, async (req, res) => {
  const { nome, descricao, responsavel, contato } = req.body;
  const r = await db.run('INSERT INTO pastorais (nome, descricao, responsavel, contato) VALUES (?, ?, ?, ?)', 
    [nome, descricao, responsavel, contato]);
  res.json({ id: r.lastID });
});

app.put('/api/admin/pastorais/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, responsavel, contato, ativo } = req.body;
  await db.run('UPDATE pastorais SET nome = ?, descricao = ?, responsavel = ?, contato = ?, ativo = ? WHERE id = ?', 
    [nome, descricao, responsavel, contato, ativo ? 1 : 0, id]);
  res.json({ id });
});

app.delete('/api/admin/pastorais/:id', authMiddleware, async (req, res) => {
  await db.run('DELETE FROM pastorais WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

app.put('/api/admin/sobre', authMiddleware, async (req, res) => {
  const { historia, missao, visao, valores, padroeiro, endereco, telefone, email, whatsapp } = req.body;
  await db.run(`UPDATE sobre SET historia = ?, missao = ?, visao = ?, valores = ?, padroeiro = ?, endereco = ?, telefone = ?, email = ?, whatsapp = ? WHERE id = 1`, 
    [historia, missao, visao, valores, padroeiro, endereco, telefone, email, whatsapp]);
  const s = await db.get('SELECT * FROM sobre WHERE id = 1');
  res.json(s);
});

app.put('/api/admin/contatos/:id/responder', authMiddleware, async (req, res) => {
  await db.run('UPDATE contatos SET respondido = 1 WHERE id = ?', [req.params.id]);
  res.json({ message: 'Marcado como respondido' });
});

app.delete('/api/admin/contatos/:id', authMiddleware, async (req, res) => {
  await db.run('DELETE FROM contatos WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

app.listen(8000, () => console.log('🚀 Servidor na porta 8000'));

// ==================== GALERIA ====================
app.get('/api/galeria/', async (req, res) => {
    try {
        const galeria = await db.all('SELECT * FROM galeria ORDER BY created_at DESC');
        res.json(galeria || []);
    } catch (error) {
        res.json([]);
    }
});

app.post('/api/admin/galeria', authMiddleware, async (req, res) => {
    try {
        const { titulo, descricao, arquivo, tipo } = req.body;
        const result = await db.run(
            'INSERT INTO galeria (titulo, descricao, arquivo, tipo) VALUES (?, ?, ?, ?)',
            [titulo, descricao || '', arquivo, tipo]
        );
        const item = await db.get('SELECT * FROM galeria WHERE id = ?', [result.lastID]);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/galeria/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descricao } = req.body;
        await db.run('UPDATE galeria SET titulo = ?, descricao = ? WHERE id = ?', [titulo, descricao || '', id]);
        const item = await db.get('SELECT * FROM galeria WHERE id = ?', [id]);
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/galeria/:id', authMiddleware, async (req, res) => {
    try {
        await db.run('DELETE FROM galeria WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== GALERIA ====================
app.get('/api/galeria/', async (req, res) => {
    try {
        const galeria = await db.all('SELECT * FROM galeria ORDER BY created_at DESC');
        res.json(galeria || []);
    } catch (error) {
        res.json([]);
    }
});

app.post('/api/admin/galeria', authMiddleware, async (req, res) => {
    try {
        const { titulo, descricao, arquivo, tipo } = req.body;
        const result = await db.run(
            'INSERT INTO galeria (titulo, descricao, arquivo, tipo) VALUES (?, ?, ?, ?)',
            [titulo, descricao || '', arquivo, tipo]
        );
        const item = await db.get('SELECT * FROM galeria WHERE id = ?', [result.lastID]);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/galeria/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descricao } = req.body;
        await db.run('UPDATE galeria SET titulo = ?, descricao = ? WHERE id = ?', [titulo, descricao || '', id]);
        const item = await db.get('SELECT * FROM galeria WHERE id = ?', [id]);
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/galeria/:id', authMiddleware, async (req, res) => {
    try {
        await db.run('DELETE FROM galeria WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/noticias', authMiddleware, async (req, res) => {
    const { titulo, conteudo, imagem } = req.body;
    const r = await db.run('INSERT INTO noticias (titulo, conteudo, imagem) VALUES (?, ?, ?)', [titulo, conteudo, imagem || '']);
    res.json({ id: r.lastID });
});

app.put('/api/admin/noticias/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { titulo, conteudo, imagem } = req.body;
    await db.run('UPDATE noticias SET titulo = ?, conteudo = ?, imagem = ? WHERE id = ?', [titulo, conteudo, imagem || '', id]);
    res.json({ id });
});

app.post('/api/admin/eventos', authMiddleware, async (req, res) => {
    const { nome, descricao, data, horario, local, imagem } = req.body;
    const r = await db.run('INSERT INTO eventos (nome, descricao, data, horario, local, imagem) VALUES (?, ?, ?, ?, ?, ?)', [nome, descricao, data, horario, local, imagem || '']);
    res.json({ id: r.lastID });
});

app.put('/api/admin/eventos/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, data, horario, local, imagem } = req.body;
    await db.run('UPDATE eventos SET nome = ?, descricao = ?, data = ?, horario = ?, local = ?, imagem = ? WHERE id = ?', [nome, descricao, data, horario, local, imagem || '', id]);
    res.json({ id });
});
