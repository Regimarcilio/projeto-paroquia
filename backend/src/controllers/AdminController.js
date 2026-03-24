const prisma = require('../database');
const fs = require('fs');
const path = require('path');

module.exports = {
  // --- HORÁRIOS ---
  async listarHorarios(req, res) {
    try {
      const horarios = await prisma.horario.findMany({ orderBy: { id: 'asc' } });
      return res.json(horarios);
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  },

  async salvarHorarios(req, res) {
    try {
      const { horarios } = req.body;
      // Validação básica
      if (!Array.isArray(horarios)) {
        return res.status(400).json({ error: 'Formato inválido. Esperado um array.' });
      }
      
      await prisma.horario.deleteMany({});
      if (horarios.length > 0) {
        await prisma.horario.createMany({ data: horarios });
      }
      return res.json({ message: 'Horários atualizados com sucesso!' });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  },

  // --- GALERIA ---
  async listarFotos(req, res) {
    try {
      const fotos = await prisma.foto.findMany({ orderBy: { createdAt: 'desc' } });
      return res.json(fotos);
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  },

  async uploadFoto(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
      
      const foto = await prisma.foto.create({
        data: {
          url: `/uploads/${req.file.filename}`,
          titulo: req.body.titulo || 'Sem título'
        }
      });
      return res.json(foto);
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  },

  async deletarFoto(req, res) {
    try {
      const { id } = req.params;
      const foto = await prisma.foto.findUnique({ where: { id: parseInt(id) } });
      
      if (foto) {
        const filePath = path.join(__dirname, '..', '..', 'uploads', path.basename(foto.url));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await prisma.foto.delete({ where: { id: parseInt(id) } });
      }
      return res.json({ message: 'Foto removida' });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  },

  // --- NOTÍCIAS ---
  async criarNoticia(req, res) {
    try {
      const { titulo, resumo, conteudo, categoria } = req.body;
      const imagem = req.file ? `/uploads/${req.file.filename}` : null;
      const slugify = require('slugify');
      const slug = slugify(titulo, { lower: true, strict: true });

      const noticia = await prisma.noticia.create({
        data: { 
          titulo, 
          slug, 
          resumo, 
          conteudo, 
          categoria: categoria || 'Geral', 
          imagem, 
          autorId: req.adminId 
        }
      });
      return res.json(noticia);
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  },

  // --- BACKUP ---
  async executarBackup(req, res) {
    try {
      const seisMesesAtras = new Date();
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
      
      const noticiasAntigas = await prisma.noticia.findMany({
        where: { createdAt: { lt: seisMesesAtras } }
      });
      
      for (const noticia of noticiasAntigas) {
        await prisma.arquivoMorto.create({
          data: { tipo: 'Noticia', dados: JSON.stringify(noticia) }
        });
        await prisma.noticia.delete({ where: { id: noticia.id } });
      }
      
      return res.json({ message: `Backup concluído. ${noticiasAntigas.length} itens arquivados.` });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }
};
