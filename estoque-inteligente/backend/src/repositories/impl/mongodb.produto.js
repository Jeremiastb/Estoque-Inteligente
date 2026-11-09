const { db } = require('../../config/mongodb');

module.exports = {
  async criar(produto) {
    produto.createdAt = new Date();
    const r = await db().collection('produtos').insertOne(produto);
    return { ...produto, _id: r.insertedId };
  },
  async listar() {
    return db().collection('produtos').find({}).toArray();
  },
  async buscarPorId(id) {
    const { ObjectId } = require('mongodb');
    return db().collection('produtos').findOne({ _id: new ObjectId(id) });
  },
  async atualizar(id, dados) {
    const { ObjectId } = require('mongodb');
    dados.updatedAt = new Date();
    await db().collection('produtos').updateOne(
      { _id: new ObjectId(id) },
      { $set: dados }
    );
    return this.buscarPorId(id);
  },
  async excluir(id) {
    const { ObjectId } = require('mongodb');
    await db().collection('produtos').deleteOne({ _id: new ObjectId(id) });
    return true;
  }
};