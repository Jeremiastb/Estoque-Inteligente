const express = require('express');
const router = express.Router();
const { getRepo } = require('../repositories/produto.repository');

// GET /api/produtos
router.get('/', async (req, res) => {
  try {
    const repo = getRepo(req.query.db);
    const produtos = await repo.listar();
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/produtos
router.post('/', async (req, res) => {
  try {
    const repo = getRepo(req.query.db);
    const novoProduto = await repo.criar(req.body);
    res.status(201).json(novoProduto);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// GET /api/produtos/:id
router.get('/:id', async (req, res) => {
  try {
    const repo = getRepo(req.query.db);
    const produto = await repo.buscarPorId(req.params.id);
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(produto);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// PUT /api/produtos/:id
router.put('/:id', async (req, res) => {
  try {
    const repo = getRepo(req.query.db);
    const produtoAtualizado = await repo.atualizar(req.params.id, req.body);
    res.json(produtoAtualizado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// DELETE /api/produtos/:id
router.delete('/:id', async (req, res) => {
  try {
    const repo = getRepo(req.query.db);
    await repo.excluir(req.params.id);
    res.json({ ok: true, mensagem: 'Produto excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;