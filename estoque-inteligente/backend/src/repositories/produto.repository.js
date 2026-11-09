// Cada banco tem sua implementação — o service escolhe qual usar
const sqlserverRepo = require('./impl/sqlserver.produto');
const mysqlRepo     = require('./impl/mysql.produto');
const mongoRepo     = require('./impl/mongodb.produto');

const repos = { sqlserver: sqlserverRepo, mysql: mysqlRepo, mongodb: mongoRepo };

function getRepo(tipo = process.env.DEFAULT_DB || 'mongodb') {
  const r = repos[tipo];
  if (!r) throw new Error(`DB não suportado: ${tipo}`);
  return r;
}
module.exports = { getRepo };