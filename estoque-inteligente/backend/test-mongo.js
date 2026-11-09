// Força o Node 24 a usar configurações de TLS mais flexíveis (OpenSSL 3 workaround)
process.env.NODE_OPTIONS = '--tls-cipher-list=DEFAULT@SECLEVEL=0';

require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

async function test() {
  try {
    console.log('🔄 Testando conexão com MongoDB Atlas no Node v' + process.version);
    
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: { 
        version: ServerApiVersion.v1, 
        strict: false, 
        deprecationErrors: false 
      },
      // APENAS tlsInsecure: true (já inclui as outras opções)
      tls: true,
      tlsInsecure: true,
      
      // Timeouts
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
      
      retryWrites: true,
      w: 'majority'
    });
    
    await client.connect();
    console.log('✅ Conexão bem-sucedida!');
    
    const dbs = await client.db().admin().listDatabases();
    console.log('📦 Bancos disponíveis:', dbs.databases.map(d => d.name).filter(n => !n.includes('local')).join(', '));
    
    await client.close();
    console.log('🔌 Conexão fechada com segurança.');
  } catch (err) {
    console.error('❌ Erro fatal:', err.message);
    console.log('\n💡 Se o erro persistir, verifique:');
    console.log('   1. Se sua internet está funcionando');
    console.log('   2. Se o IP está liberado no MongoDB Atlas (Network Access)');
    console.log('   3. Se a senha no .env está correta');
  }
}

test();