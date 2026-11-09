const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

async function connect() {
  if (!pool) {
    try {
      pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });
      console.log('✅ MySQL conectado com sucesso');
    } catch (err) {
      console.error('❌ Erro ao conectar no MySQL:', err.message);
      throw err;
    }
  }
  return pool;
}

module.exports = { connect, pool: () => pool };