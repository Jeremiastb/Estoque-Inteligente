const sql = require('mssql');
require('dotenv').config();

const isNamedInstance = process.env.SQLSERVER_HOST.includes('\\');

const config = {
  server: process.env.SQLSERVER_HOST,
  database: process.env.SQLSERVER_DATABASE,
  options: {
    trustServerCertificate: process.env.SQLSERVER_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: process.env.SQLSERVER_ENABLE_ARITH_ABORT === 'true',
    port: isNamedInstance ? undefined : parseInt(process.env.SQLSERVER_PORT || '1433')
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

if (process.env.SQLSERVER_TRUSTED_CONNECTION === 'true') {
  config.options.trustedConnection = true;
} else {
  config.user = process.env.SQLSERVER_USER;
  config.password = process.env.SQLSERVER_PASSWORD;
}

let pool = null;

async function connect() {
  if (!pool) {
    try {
      console.log(`🔄 Tentando conectar ao SQL Server: ${process.env.SQLSERVER_HOST}...`);
      pool = await new sql.ConnectionPool(config).connect();
      console.log(`✅ SQL Server conectado ao banco: ${process.env.SQLSERVER_DATABASE}`);
    } catch (err) {
      console.error('❌ Erro ao conectar no SQL Server:', err.message);
      throw err;
    }
  }
  return pool;
}

module.exports = { sql, connect, pool: () => pool };