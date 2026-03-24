const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

let db;

async function connectDB() {
  try {
    db = await open({
      filename: process.env.DATABASE_URL?.replace('sqlite:', '') || './data/paroquia.db',
      driver: sqlite3.Database
    });
    console.log('✅ Conectado ao SQLite!');
    return db;
  } catch (error) {
    console.error('❌ Erro ao conectar SQLite:', error.message);
    return null;
  }
}

async function initializeDatabase() {
  try {
    console.log('📦 Inicializando banco de dados...');
    
    // Tabela usuarios
    await db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabela noticias
    await db.exec(`
      CREATE TABLE IF NOT EXISTS noticias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        imagem TEXT,
        video TEXT,
        data_publicacao DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabela eventos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS eventos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        data DATETIME,
        horario TEXT,
        local TEXT,
        imagem TEXT,
        video TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabela galeria (para fotos e vídeos)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS galeria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descricao TEXT,
        arquivo TEXT NOT NULL,
        tipo TEXT NOT NULL,
        evento_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (evento_id) REFERENCES eventos(id)
      )
    `);
    
    // Tabela horarios
    await db.exec(`
      CREATE TABLE IF NOT EXISTS horarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dia_semana TEXT NOT NULL,
        horario TEXT NOT NULL,
        tipo TEXT DEFAULT 'Missa',
        ativo INTEGER DEFAULT 1
      )
    `);
    
    // Tabela contatos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS contatos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT,
        mensagem TEXT NOT NULL,
        respondido INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabela intencoes
    await db.exec(`
      CREATE TABLE IF NOT EXISTS intencoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        intencao TEXT NOT NULL,
        data_missa TEXT,
        horario_preferido TEXT,
        celebrada INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabela oracoes
    await db.exec(`
      CREATE TABLE IF NOT EXISTS oracoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        pedido TEXT NOT NULL,
        anonimo INTEGER DEFAULT 0,
        respondido INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Criar admin
    const admin = await db.get('SELECT * FROM usuarios WHERE email = ?', ['admin@paroquia.com']);
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.run(
        'INSERT INTO usuarios (nome, email, senha_hash, is_admin) VALUES (?, ?, ?, ?)',
        ['Administrador', 'admin@paroquia.com', hashedPassword, 1]
      );
      console.log('✅ Admin criado!');
    }
    
    // Criar horários padrão
    const horariosCount = await db.get('SELECT COUNT(*) as count FROM horarios');
    if (horariosCount.count === 0) {
      const horarios = [
        ['Domingo', '08:00', 'Missa', 1],
        ['Domingo', '10:00', 'Missa', 1],
        ['Domingo', '19:00', 'Missa', 1],
        ['Segunda', '19:00', 'Missa', 1],
        ['Terça', '19:00', 'Missa', 1],
        ['Quarta', '19:00', 'Missa', 1],
        ['Quinta', '19:00', 'Missa', 1],
        ['Quinta', '18:00', 'Adoração', 1],
        ['Sexta', '15:00', 'Missa', 1],
        ['Sexta', '19:00', 'Terço', 1],
        ['Sábado', '16:00', 'Confissões', 1],
        ['Sábado', '17:00', 'Missa', 1],
        ['Sábado', '19:00', 'Missa', 1]
      ];
      
      for (const h of horarios) {
        await db.run(
          'INSERT INTO horarios (dia_semana, horario, tipo, ativo) VALUES (?, ?, ?, ?)',
          h
        );
      }
      console.log('✅ Horários criados!');
    }
    
    console.log('✅ Banco inicializado!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

module.exports = { connectDB, initializeDatabase, getDb: () => db };
