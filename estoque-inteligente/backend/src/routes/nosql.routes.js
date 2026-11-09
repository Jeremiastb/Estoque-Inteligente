const express = require('express');
const router = express.Router();
const { KeyValueStore, WideColumnStore, GraphStore, ContentStore } = require('../utils/nosql-emulators');
const backup = require('../services/backup.service');
const migracao = require('../services/migracao.service');

// ===== AULA 12 - Key-Value =====
router.get('/kv/:chave', async (req, res) => {
  res.json({ chave: req.params.chave, valor: await KeyValueStore.get(req.params.chave) });
});
router.post('/kv', async (req, res) => {
  await KeyValueStore.set(req.body.chave, req.body.valor);
  res.json({ ok: true });
});

// ===== AULA 12 - Wide Column =====
router.post('/widecolumn', async (req, res) => {
  const { rowKey, family, column, value } = req.body;
  await WideColumnStore.put(rowKey, family, column, value);
  res.json({ ok: true });
});
router.get('/widecolumn/:rowKey/:family/:column?', async (req, res) => {
  const v = await WideColumnStore.get(req.params.rowKey, req.params.family, req.params.column);
  res.json({ valor: v });
});

// ===== AULA 11 - Graph =====
router.post('/graph/vertex', async (req, res) => {
  await GraphStore.addVertex(req.body); res.json({ ok: true });
});
router.post('/graph/edge', async (req, res) => {
  await GraphStore.addEdge(req.body.origem, req.body.destino, req.body.rotulo, req.body.peso);
  res.json({ ok: true });
});
router.get('/graph/neighbors/:id', async (req, res) => {
  res.json(await GraphStore.neighbors(req.params.id));
});
router.get('/graph/path/:origem/:destino', async (req, res) => {
  res.json({ path: await GraphStore.shortestPath(req.params.origem, req.params.destino) });
});

// ===== AULA 13 - Content Store =====
router.post('/content', async (req, res) => {
  const id = await ContentStore.saveMetadata(req.body);
  res.json({ id });
});
router.get('/content/tag/:tag', async (req, res) => {
  res.json(await ContentStore.findByTag(req.params.tag));
});

// ===== AULA 14 - Backup / Restore =====
router.post('/backup/mongo', async (req, res) => {
  const f = await backup.backupMongo(); res.json({ arquivo: f });
});
router.post('/restore/mongo', async (req, res) => {
  await backup.restoreMongo(req.body.arquivo); res.json({ ok: true });
});
router.post('/backup/sqlserver', async (req, res) => {
  try { const f = await backup.backupSQLServer(); res.json({ arquivo: f }); }
  catch (e) { res.status(500).json({ erro: e.message }); }
});
router.get('/backup/views', async (req, res) => {
  const f = await backup.snapshotViews(); res.json({ arquivo: f });
});

// ===== AULA 16 - Migração =====
router.post('/migrar/mysql-para-mongo',  async (req, res) => res.json(await migracao.mysqlParaMongo()));
router.post('/migrar/sqlserver-para-mongo', async (req, res) => res.json(await migracao.sqlserverParaMongo()));
router.post('/migrar/mongo-para-mysql',  async (req, res) => res.json(await migracao.mongoParaMysql()));

module.exports = router;