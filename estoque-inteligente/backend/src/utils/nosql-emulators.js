const { db } = require('../config/mongodb');

const KeyValueStore = {
  set: async (chave, valor) => {
    await db().collection('kv_store').updateOne({ _id: chave }, { $set: { valor, updatedAt: new Date() } }, { upsert: true });
    return true;
  },
  get: async (chave) => {
    const r = await db().collection('kv_store').findOne({ _id: chave });
    return r ? r.valor : null;
  }
};

const WideColumnStore = {
  put: async (rowKey, family, column, value) => {
    await db().collection('wide_column').updateOne({ _id: rowKey }, { $set: { [`${family}.${column}`]: value, updatedAt: new Date() } }, { upsert: true });
    return true;
  },
  get: async (rowKey, family, column) => {
    const r = await db().collection('wide_column').findOne({ _id: rowKey });
    if (!r) return null;
    return column ? r[family]?.[column] : r[family];
  }
};

const GraphStore = {
  addVertex: async (v) => {
    await db().collection('graph_vertices').updateOne({ _id: v.id }, { $set: v }, { upsert: true });
  },
  addEdge: async (origem, destino, rotulo, peso = 1) => {
    await db().collection('graph_edges').insertOne({ origem, destino, rotulo, peso, createdAt: new Date() });
  },
  neighbors: async (verticeId) => {
    return db().collection('graph_edges').find({ $or: [{ origem: verticeId }, { destino: verticeId }] }).toArray();
  }
};

const ContentStore = {
  saveMetadata: async (content) => {
    const r = await db().collection('content').insertOne({ ...content, createdAt: new Date() });
    return r.insertedId;
  },
  findByTag: async (tag) => {
    return db().collection('content').find({ tags: tag }).toArray();
  }
};

module.exports = { KeyValueStore, WideColumnStore, GraphStore, ContentStore };