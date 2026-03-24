const prisma = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = "sua-chave-secreta-super-segura-mude-em-producao";

module.exports = {
  async login(req, res) {
    const { username, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { username } });

    if (!admin) {
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }

    if (!await bcrypt.compare(password, admin.password)) {
      return res.status(400).json({ error: 'Senha inválida' });
    }

    const token = jwt.sign({ id: admin.id }, SECRET_KEY, {
      expiresIn: 86400 // 24 horas
    });

    return res.json({ admin: { id: admin.id, username: admin.username }, token });
  },

  // Inicialização simples para criar o primeiro admin
  async registerInitial(req, res) {
    const existing = await prisma.admin.count();
    if (existing > 0) return res.status(400).json({ error: 'Admin já existe' });

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.admin.create({
      data: {
        username: 'admin',
        email: 'admin@paroquia.com',
        password: hashedPassword,
        nomeCompleto: 'Administrador'
      }
    });
    return res.json(admin);
  }
};