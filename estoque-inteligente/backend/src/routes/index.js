const express = require('express');
const router = express.Router();

// Importa todas as rotas
const produtosRoutes = require('./produtos.routes');
const estoqueRoutes = require('./estoque.routes');
const nosqlRoutes = require('./nosql.routes');

// Monta as rotas
router.use('/produtos', produtosRoutes);
router.use('/estoque', estoqueRoutes);
router.use('/nosql', nosqlRoutes);

// Rota raiz da API
router.get('/', (req, res) => {
  res.json({
    nome: 'API Estoque Inteligente',
    versao: '1.0.0',
    endpoints: {
      produtos: '/api/produtos',
      estoque: '/api/estoque',
      nosql: '/api/nosql',
      health: '/api/health'
    }
  });
});

module.exports = router;