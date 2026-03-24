const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class HorarioController {
    async list(req, res) {
        try {
            const horarios = await prisma.horarioMissa.findMany({
                orderBy: { id: 'asc' }
            });
            res.json(horarios);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar horários' });
        }
    }

    async listAgrupados(req, res) {
        try {
            const horarios = await prisma.horarioMissa.findMany({
                where: { ativo: true },
                orderBy: { id: 'asc' }
            });
            
            const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            const agrupados = {};
            dias.forEach(dia => { agrupados[dia] = []; });
            
            horarios.forEach(h => {
                if (agrupados[h.diaSemana]) {
                    agrupados[h.diaSemana].push({
                        horario: h.horario,
                        tipo: h.tipo,
                        id: h.id
                    });
                }
            });
            res.json(agrupados);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao agrupar horários' });
        }
    }

    async create(req, res) {
        try {
            const { diaSemana, horario, tipo } = req.body;
            const novo = await prisma.horarioMissa.create({
                data: { diaSemana, horario, tipo }
            });
            res.status(201).json(novo);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao criar horário' });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const { diaSemana, horario, tipo, ativo } = req.body;
            const horario = await prisma.horarioMissa.update({
                where: { id: parseInt(id) },
                data: { diaSemana, horario, tipo, ativo }
            });
            res.json(horario);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar horário' });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await prisma.horarioMissa.delete({
                where: { id: parseInt(id) }
            });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Erro ao deletar horário' });
        }
    }
}

module.exports = new HorarioController();
