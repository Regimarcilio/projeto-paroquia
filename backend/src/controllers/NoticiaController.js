const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NoticiaController {
    // Listar todas as notícias
    async list(req, res) {
        try {
            const noticias = await prisma.noticia.findMany({
                orderBy: { data_publicacao: 'desc' },
                include: { autor: { select: { nome: true } } }
            });
            res.json(noticias);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar notícias' });
        }
    }

    // Buscar uma notícia
    async getById(req, res) {
        try {
            const { id } = req.params;
            const noticia = await prisma.noticia.findUnique({
                where: { id: parseInt(id) },
                include: { autor: { select: { nome: true } } }
            });
            if (!noticia) {
                return res.status(404).json({ error: 'Notícia não encontrada' });
            }
            res.json(noticia);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar notícia' });
        }
    }

    // Criar notícia
    async create(req, res) {
        try {
            const { titulo, conteudo, imagem } = req.body;
            const autorId = req.user?.id || 1; // ID do admin logado
            
            const noticia = await prisma.noticia.create({
                data: { titulo, conteudo, imagem, autorId }
            });
            res.status(201).json(noticia);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao criar notícia' });
        }
    }

    // Atualizar notícia
    async update(req, res) {
        try {
            const { id } = req.params;
            const { titulo, conteudo, imagem } = req.body;
            
            const noticia = await prisma.noticia.update({
                where: { id: parseInt(id) },
                data: { titulo, conteudo, imagem }
            });
            res.json(noticia);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar notícia' });
        }
    }

    // Deletar notícia
    async delete(req, res) {
        try {
            const { id } = req.params;
            await prisma.noticia.delete({
                where: { id: parseInt(id) }
            });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Erro ao deletar notícia' });
        }
    }
}

module.exports = new NoticiaController();

