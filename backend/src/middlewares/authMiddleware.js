const jwt = require('jsonwebtoken');
const prisma = require('../database');

const SECRET_KEY = "sua-chave-secreta-super-segura-mude-em-producao";

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Token mal formatado' });

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ error: 'Token mal formatado' });

  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });

    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin) return res.status(401).json({ error: 'Admin não encontrado' });

    req.adminId = admin.id;
    return next();
  });
};