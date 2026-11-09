require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

const database = require('./config/database');
const logger = require('./utils/logger');
const backup = require('./services/backup.service');

const app = express();

// Cria diretórios necessários
['logs', 'backups'].forEach(dir => {
  const full = path.join(__dirname, '..', dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// Middlewares
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => logger.info(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - inicio}ms)`));
  next();
});

app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// Rotas
app.use('/api', require('./routes/index'));

// Health Check
app.get('/api/health', async (req, res) => {
  const status = await database.connectAll();
  const ok = Object.values(status).every(v => v === 'ok');
  res.status(ok ? 200 : 503).json({ status: ok ? 'healthy' : 'degraded', databases: status });
});

// Documentação da API
app.get('/api', (req, res) => {
  res.json({
    nome: 'API Estoque Inteligente - Multi-DB',
    versao: '1.0.0',
    endpoints: { produtos: '/api/produtos', estoque: '/api/estoque', nosql: '/api/nosql', health: '/api/health' }
  });
});

// Tratamento de Erros
app.use((err, req, res, next) => {
  logger.error(`❌ ${err.message}`);
  res.status(err.status || 500).json({ erro: err.message || 'Erro interno' });
});

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

// Backup Automático (Aula 14) - Diariamente às 02:00
cron.schedule('0 2 * * *', async () => {
  logger.info('⏰ [CRON] Backup automático iniciado');
  try { await backup.backupMongo(); logger.info('✅ [CRON] Backup concluído'); } 
  catch (e) { logger.error(`❌ [CRON] Erro no backup: ${e.message}`); }
}, { timezone: 'America/Sao_Paulo' });

// Inicialização
const PORT = process.env.PORT || 3000;
let server;

(async () => {
  try {
    logger.info('🔄 Conectando aos bancos de dados...');
    const status = await database.connectAll();
    logger.info('📊 Status das conexões:', status);
    
    server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error(`❌ Falha ao iniciar: ${err.message}`);
    process.exit(1);
  }
})();

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 Encerrando servidor...');
  if (server) server.close(() => { database.disconnectAll(); process.exit(0); });
});