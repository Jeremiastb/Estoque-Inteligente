const sqlserverConfig = require('./sqlserver');
const mysqlConfig = require('./mysql');
const mongodbConfig = require('./mongodb');

class DatabaseManager {
  constructor() {
    this.connections = {
      sqlserver: sqlserverConfig,
      mysql: mysqlConfig,
      mongodb: mongodbConfig
    };
  }

  async connect(tipo) {
    const conn = this.connections[tipo];
    if (!conn) throw new Error(`Banco não suportado: ${tipo}`);
    return await conn.connect();
  }

  async connectAll() {
    const results = {};
    for (const tipo of Object.keys(this.connections)) {
      try {
        await this.connect(tipo);
        results[tipo] = 'ok';
      } catch (err) {
        results[tipo] = `erro: ${err.message}`;
      }
    }
    return results;
  }

  async disconnectAll() {
    if (this.connections.mongodb.client()) {
      await this.connections.mongodb.client().close();
    }
    console.log('✅ Conexões com bancos de dados fechadas');
  }
}

module.exports = new DatabaseManager();