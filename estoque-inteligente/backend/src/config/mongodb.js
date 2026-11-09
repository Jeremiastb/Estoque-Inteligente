const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// Workaround crítico para Node 24 / OpenSSL 3
process.env.NODE_OPTIONS = '--tls-cipher-list=DEFAULT@SECLEVEL=0';

let client = null;
let dbInstance = null;

async function connect() {
  if (!client) {
    try {
      console.log('🔄 Iniciando conexão com MongoDB Atlas (Node v' + process.version + ')...');
      
      client = new MongoClient(process.env.MONGODB_URI, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: false,
          deprecationErrors: false,
        },
        // Configurações para contornar o bug de SSL do Node 24
        tls: true,
        tlsInsecure: true,
        
        // Timeouts mais longos para lidar com a lentidão do DNS +srv no Node 24
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
        
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        maxPoolSize: 10,
        minPoolSize: 2,
      });
      
      await client.connect();
      await client.db().admin().ping();
      
      dbInstance = client.db();
      console.log(`✅ MongoDB Atlas conectado com sucesso e estável!`);
      console.log(`📦 Banco de dados ativo: ${dbInstance.databaseName}`);
      
    } catch (err) {
      console.error('❌ ERRO FATAL AO CONECTAR NO MONGODB:');
      console.error('📋 Detalhes:', err.message);
      throw err;
    }
  }
  
  if (!dbInstance) {
    throw new Error('MongoDB não foi inicializado corretamente');
  }
  
  return dbInstance;
}

module.exports = { 
  connect, 
  client: () => client, 
  db: () => {
    if (!dbInstance) {
      throw new Error('Banco de dados MongoDB não está conectado.');
    }
    return dbInstance;
  }
};