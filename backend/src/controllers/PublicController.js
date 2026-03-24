const prisma = require('../database');
const slugify = require('slugify');

module.exports = {
  // Pastorais
  async listarPastorais(req, res) {
    const pastorais = await prisma.pastoral.findMany({ where: { ativo: true } });
    return res.json(pastorais);
  },

  async criarPastoral(req, res) {
    const { nome, descricao, responsavel, contato } = req.body;
    const slug = slugify(nome, { lower: true });
    const pastoral = await prisma.pastoral.create({
      data: { nome, slug, descricao, responsavel, contato }
    });
    return res.json(pastoral);
  },

  // Eventos
  async listarEventos(req, res) {
    const eventos = await prisma.evento.findMany({
      orderBy: { dataInicio: 'asc' },
      take: 10
    });
    return res.json(eventos);
  },

  async criarEvento(req, res) {
    const { titulo, descricao, dataInicio, horario, local } = req.body;
    const evento = await prisma.evento.create({
      data: { titulo, descricao, dataInicio: new Date(dataInicio), horario, local }
    });
    return res.json(evento);
  },

  // Pedidos de Oração
  async enviarPedido(req, res) {
    const { nome, pedido, anonimo } = req.body;
    const novoPedido = await prisma.pedidoOracao.create({
      data: { nome: anonimo ? null : nome, pedido, anonimo }
    });
    return res.json(novoPedido);
  },

  async listarPedidosAdmin(req, res) {
    // Futuramente adicionar verificação de admin aqui
    const pedidos = await prisma.pedidoOracao.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(pedidos);
  }
};
