const express = require('express');
const router = express.Router();
const estoqueService = require('../services/estoque.service');
const estoqueRepo = require('../repositories/estoque.repository');

/**
 * POST /api/estoque/entrada
 * Registra entrada de produtos
 */
router.post('/entrada', async (req, res) => {
  try {
    const { produtoId, quantidade, motivo, usuario } = req.body;
    const resultado = await estoqueService.registrarEntrada(produtoId, quantidade, motivo, usuario);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

/**
 * POST /api/estoque/saida
 * Registra saída de produtos
 */
router.post('/saida', async (req, res) => {
  try {
    const { produtoId, quantidade, motivo, usuario } = req.body;
    const resultado = await estoqueService.registrarSaida(produtoId, quantidade, motivo, usuario);
    res.json(resultado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

/**
 * GET /api/estoque/movimentacoes
 * Lista movimentações com filtros
 */
router.get('/movimentacoes', async (req, res) => {
  try {
    const repo = estoqueRepo.getRepo(req.query.db);
    const movimentacoes = await repo.listarMovimentacoes(req.query);
    res.json(movimentacoes);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

/**
 * GET /api/estoque/alertas
 * Lista alertas de estoque baixo
 */
router.get('/alertas', async (req, res) => {
  try {
    const resolvidos = req.query.resolvidos === 'true';
    const alertas = await estoqueService.listarAlertas(resolvidos);
    res.json(alertas);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

/**
 * PUT /api/estoque/alertas/:id/resolver
 * Marca alerta como resolvido
 */
router.put('/alertas/:id/resolver', async (req, res) => {
  try {
    await estoqueService.resolverAlerta(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

/**
 * GET /api/estoque/relatorio
 * Gera relatório de movimentações
 */
router.get('/relatorio', async (req, res) => {
  try {
    const relatorio = await estoqueService.gerarRelatorio(req.query);
    res.json(relatorio);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;