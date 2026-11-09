/**
 * Repositório para movimentações de estoque (entradas e saídas)
 * Usa o mesmo padrão Strategy que produtos
 */
const sqlserverRepo = require('./impl/sqlserver.estoque');
const mysqlRepo = require('./impl/mysql.estoque');
const mongoRepo = require('./impl/mongodb.estoque');

const repos = { sqlserver: sqlserverRepo, mysql: mysqlRepo, mongodb: mongoRepo };

function getRepo(tipo = process.env.DEFAULT_DB || 'mongodb') {
  const r = repos[tipo];
  if (!r) throw new Error(`DB não suportado: ${tipo}`);
  return r;
}

module.exports = { getRepo };