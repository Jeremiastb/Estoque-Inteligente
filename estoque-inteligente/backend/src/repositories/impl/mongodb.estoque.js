const { db } = require('../../config/mongodb');

module.exports = {
  async registrarMovimentacao(mov) {
    mov.dataMovimento = new Date();
    const r = await db().collection('movimentacoes').insertOne(mov);
    return { ...mov, _id: r.insertedId };
  },

  async listarMovimentacoes(filtros = {}) {
    const query = {};
    if (filtros.produtoId) query.produtoId = filtros.produtoId;
    if (filtros.tipo) query.tipo = filtros.tipo; // 'entrada' ou 'saida'
    if (filtros.dataInicio || filtros.dataFim) {
      query.dataMovimento = {};
      if (filtros.dataInicio) query.dataMovimento.$gte = new Date(filtros.dataInicio);
      if (filtros.dataFim) query.dataMovimento.$lte = new Date(filtros.dataFim);
    }
    return db().collection('movimentacoes').find(query).sort({ dataMovimento: -1 }).toArray();
  },

  async buscarPorId(id) {
    const { ObjectId } = require('mongodb');
    return db().collection('movimentacoes').findOne({ _id: new ObjectId(id) });
  },

  async excluir(id) {
    const { ObjectId } = require('mongodb');
    await db().collection('movimentacoes').deleteOne({ _id: new ObjectId(id) });
    return true;
  }
};