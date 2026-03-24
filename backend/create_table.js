const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function createTable() {
  const db = await open({
    filename: '/app/data/paroquia.db',
    driver: sqlite3.Database
  });
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS galeria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT,
      arquivo TEXT NOT NULL,
      tipo TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('✅ Tabela galeria pronta!');
  await db.close();
}

createTable();
