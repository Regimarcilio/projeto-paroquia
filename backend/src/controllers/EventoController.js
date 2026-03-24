const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class EventoController {
    async list(req, res) {
        try {
            const eventos = await prisma.evento.findMany({
                orderBy: { data: 'desc' }
            });
            res.json(eventos);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar eventos' });
        }
    }

    async create(req, res) {
        try {
            const { nome, descricao, data, horario, local, imagem } = req.body;
            const evento = await prisma.evento.create({
                data: { nome, descricao, data: data ? new Date(data) : null, horario, local, imagem }
            });
            res.status(201).json(evento);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao criar evento' });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const { nome, descricao, data, horario, local, imagem } = req.body;
            const evento = await prisma.evento.update({
                where: { id: parseInt(id) },
                data: { nome, descricao, data: data ? new Date(data) : null, horario, local, imagem }
            });
            res.json(evento);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar evento' });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await prisma.evento.delete({
                where: { id: parseInt(id) }
            });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Erro ao deletar evento' });
        }
    }
}

module.exports = new EventoController();
