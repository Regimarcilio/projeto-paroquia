const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');

async function updateRoute() {
  const db = await open({ filename: '/app/data/paroquia.db', driver: sqlite3.Database });
  
  // Atualizar a tabela
  try {
    await db.exec(`ALTER TABLE contatos ADD COLUMN tipo TEXT DEFAULT 'contato'`);
  } catch(e) {}
  
  await db.close();
  
  // Atualizar o server.js
  const serverPath = '/app/src/server.js';
  let content = fs.readFileSync(serverPath, 'utf8');
  
  // Substituir a rota de contato
  const newRoute = `app.post('/api/contato/', async (req, res) => {
  const { tipo, nome, email, telefone, mensagem, dataMissa } = req.body;
  const tipoFinal = tipo || 'contato';
  await db.run('INSERT INTO contatos (tipo, nome, email, telefone, mensagem) VALUES (?, ?, ?, ?, ?)', 
    [tipoFinal, nome, email, telefone || '', mensagem]);
  res.status(201).json({ message: 'Mensagem enviada!' });
});`;
  
  // Procurar e substituir
  const oldRoute = /app\.post\('\/api\/contato\/'.*?\}\);/s;
  content = content.replace(oldRoute, newRoute);
  
  fs.writeFileSync(serverPath, content);
  console.log('✅ Rota de contato atualizada!');
}

updateRoute();
