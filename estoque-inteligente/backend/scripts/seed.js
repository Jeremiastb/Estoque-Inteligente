/**
 * ============================================================
 *  SCRIPT DE SEED - Dados de exemplo realistas
 *  Popula SQL Server, MySQL e MongoDB com dados didáticos
 * ============================================================
 *  Uso: npm run seed
 * ============================================================
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { connect: connectSS, sql } = require('../config/sqlserver');
const { connect: connectMy } = require('../config/mysql');
const { connect: connectMo } = require('../config/mongodb');
const logger = require('../utils/logger');

// ============================================================
//  DADOS DE EXEMPLO REALISTAS (cenário brasileiro)
// ============================================================

const USUARIOS = [
  { login: 'admin',    nome: 'Carlos Administrador', email: 'admin@estoque.com',    papel: 'admin',    senha: 'Admin@2026' },
  { login: 'gerente',  nome: 'Maria Gerente',        email: 'maria@estoque.com',    papel: 'gerente',  senha: 'Gerente@2026' },
  { login: 'operador', nome: 'João Operador',        email: 'joao@estoque.com',     papel: 'operador', senha: 'Operador@2026' },
  { login: 'estoquista', nome: 'Ana Estoquista',     email: 'ana@estoque.com',      papel: 'operador', senha: 'Estoque@2026' }
];

const CATEGORIAS = [
  { nome: 'Eletrônicos', descricao: 'Smartphones, tablets, acessórios e componentes' },
  { nome: 'Informática', descricao: 'Computadores, periféricos e suprimentos' },
  { nome: 'Alimentos',   descricao: 'Produtos alimentícios não perecíveis' },
  { nome: 'Bebidas',     descricao: 'Bebidas em geral' },
  { nome: 'Limpeza',     descricao: 'Produtos de limpeza doméstica e industrial' },
  { nome: 'Papelaria',   descricao: 'Material de escritório e escolar' },
  { nome: 'Vestuário',   descricao: 'Roupas, calçados e acessórios' },
  { nome: 'Ferramentas', descricao: 'Ferramentas manuais e elétricas' }
];

const FORNECEDORES = [
  { nome: 'TechBrasil Distribuidora LTDA',  cnpj: '12.345.678/0001-90', contato: 'Roberto Silva',  telefone: '(11) 3456-7890', email: 'vendas@techbrasil.com.br',  endereco: 'Av. Paulista, 1000 - São Paulo/SP' },
  { nome: 'Alimentos do Bem SA',            cnpj: '23.456.789/0001-01', contato: 'Fernanda Costa', telefone: '(21) 2345-6789', email: 'comercial@alimentosbem.com.br', endereco: 'Rua do Comércio, 500 - Rio de Janeiro/RJ' },
  { nome: 'Limpeza Total LTDA',             cnpj: '34.567.890/0001-12', contato: 'Paulo Mendes',   telefone: '(31) 3234-5678', email: 'contato@limpezatotal.com.br', endereco: 'Av. Afonso Pena, 2000 - Belo Horizonte/MG' },
  { nome: 'Papel & Cia EIRELI',             cnpj: '45.678.901/0001-23', contato: 'Juliana Ramos',  telefone: '(41) 3345-6789', email: 'vendas@papelcia.com.br',     endereco: 'Rua XV de Novembro, 100 - Curitiba/PR' },
  { nome: 'Moda Express LTDA',              cnpj: '56.789.012/0001-34', contato: 'Ricardo Alves',  telefone: '(51) 3456-7890', email: 'compras@modaexpress.com.br',  endereco: 'Av. Ipiranga, 800 - Porto Alegre/RS' },
  { nome: 'Ferramentas Premium SA',         cnpj: '67.890.123/0001-45', contato: 'Marcos Oliveira', telefone: '(61) 3567-8901', email: 'vendas@ferrpremium.com.br', endereco: 'SCS Quadra 1, Bloco A - Brasília/DF' }
];

const PRODUTOS = [
  // Eletrônicos
  { codigo: 'ELE-001', nome: 'Smartphone Samsung Galaxy A15',        categoria: 'Eletrônicos', preco: 1299.90, custo: 950.00,  quantidade: 45,  estoque_minimo: 10, unidade: 'UN', fornecedor: 'TechBrasil Distribuidora LTDA' },
  { codigo: 'ELE-002', nome: 'Fone de Ouvido Bluetooth JBL Tune',    categoria: 'Eletrônicos', preco: 249.90,  custo: 150.00,  quantidade: 8,   estoque_minimo: 15, unidade: 'UN', fornecedor: 'TechBrasil Distribuidora LTDA' },
  { codigo: 'ELE-003', nome: 'Carregador USB-C 25W Original',        categoria: 'Eletrônicos', preco: 89.90,   custo: 45.00,   quantidade: 120, estoque_minimo: 30, unidade: 'UN', fornecedor: 'TechBrasil Distribuidora LTDA' },
  { codigo: 'ELE-004', nome: 'Cabo HDMI 2.0 4K 2 metros',            categoria: 'Eletrônicos', preco: 39.90,   custo: 15.00,   quantidade: 3,   estoque_minimo: 20, unidade: 'UN', fornecedor: 'TechBrasil Distribuidora LTDA' },

  // Informática
  { codigo: 'INF-001', nome: 'Mouse Óptico Wireless Logitech',       categoria: 'Informática', preco: 79.90,   custo: 40.00,   quantidade: 65,  estoque_minimo: 20, unidade: 'UN', fornecedor: 'TechBrasil Distribuidora LTDA' },
  { codigo: 'INF-002', nome: 'Teclado Mecânico RGB Redragon',        categoria: 'Informática', preco: 289.90,  custo: 180.00,  quantidade: 22,  estoque_minimo: 10, unidade: 'UN', fornecedor: 'TechBrasil Distribuidora LTDA' },
  { codigo: 'INF-003', nome: 'Papel A4 Sulfite 500 folhas',          categoria: 'Informática', preco: 32.90,   custo: 20.00,   quantidade: 200, estoque_minimo: 50, unidade: 'PCT', fornecedor: 'Papel & Cia EIRELI' },
  { codigo: 'INF-004', nome: 'Toner HP 85A Compatível',              categoria: 'Informática', preco: 89.90,   custo: 50.00,   quantidade: 0,   estoque_minimo: 10, unidade: 'UN', fornecedor: 'Papel & Cia EIRELI' },

  // Alimentos
  { codigo: 'ALI-001', nome: 'Café Torrado e Moído 500g',            categoria: 'Alimentos',   preco: 24.90,   custo: 16.00,   quantidade: 150, estoque_minimo: 40, unidade: 'PCT', fornecedor: 'Alimentos do Bem SA' },
  { codigo: 'ALI-002', nome: 'Açúcar Cristal 1kg',                   categoria: 'Alimentos',   preco: 6.90,    custo: 4.00,    quantidade: 300, estoque_minimo: 80, unidade: 'PCT', fornecedor: 'Alimentos do Bem SA' },
  { codigo: 'ALI-003', nome: 'Óleo de Soja 900ml',                   categoria: 'Alimentos',   preco: 8.50,    custo: 5.50,    quantidade: 5,   estoque_minimo: 50, unidade: 'UN', fornecedor: 'Alimentos do Bem SA' },
  { codigo: 'ALI-004', nome: 'Arroz Tipo 1 5kg',                     categoria: 'Alimentos',   preco: 29.90,   custo: 22.00,   quantidade: 80,  estoque_minimo: 30, unidade: 'PCT', fornecedor: 'Alimentos do Bem SA' },

  // Bebidas
  { codigo: 'BEB-001', nome: 'Refrigerante Cola 2L',                 categoria: 'Bebidas',     preco: 9.90,    custo: 6.50,    quantidade: 120, estoque_minimo: 40, unidade: 'UN', fornecedor: 'Alimentos do Bem SA' },
  { codigo: 'BEB-002', nome: 'Água Mineral 500ml (fardo c/ 12)',     categoria: 'Bebidas',     preco: 15.90,   custo: 10.00,   quantidade: 45,  estoque_minimo: 20, unidade: 'FD', fornecedor: 'Alimentos do Bem SA' },

  // Limpeza
  { codigo: 'LIM-001', nome: 'Detergente Líquido 500ml',             categoria: 'Limpeza',     preco: 3.50,    custo: 2.00,    quantidade: 250, estoque_minimo: 60, unidade: 'UN', fornecedor: 'Limpeza Total LTDA' },
  { codigo: 'LIM-002', nome: 'Água Sanitária 1L',                    categoria: 'Limpeza',     preco: 5.90,    custo: 3.50,    quantidade: 180, estoque_minimo: 50, unidade: 'UN', fornecedor: 'Limpeza Total LTDA' },
  { codigo: 'LIM-003', nome: 'Desinfetante Floral 2L',               categoria: 'Limpeza',     preco: 12.90,   custo: 7.50,    quantidade: 2,   estoque_minimo: 25, unidade: 'UN', fornecedor: 'Limpeza Total LTDA' },
  { codigo: 'LIM-004', nome: 'Papel Higiênico 12 rolos',             categoria: 'Limpeza',     preco: 19.90,   custo: 12.00,   quantidade: 90,  estoque_minimo: 30, unidade: 'PCT', fornecedor: 'Limpeza Total LTDA' },

  // Papelaria
  { codigo: 'PAP-001', nome: 'Caneta Esferográfica Azul (cx 50)',    categoria: 'Papelaria',   preco: 45.90,   custo: 28.00,   quantidade: 35,  estoque_minimo: 15, unidade: 'CX', fornecedor: 'Papel & Cia EIRELI' },
  { codigo: 'PAP-002', nome: 'Caderno Universitário 10 matérias',    categoria: 'Papelaria',   preco: 29.90,   custo: 18.00,   quantidade: 0,   estoque_minimo: 20, unidade: 'UN', fornecedor: 'Papel & Cia EIRELI' },
  { codigo: 'PAP-003', nome: 'Grampeador de Mesa 25 folhas',         categoria: 'Papelaria',   preco: 34.90,   custo: 20.00,   quantidade: 18,  estoque_minimo: 8,  unidade: 'UN', fornecedor: 'Papel & Cia EIRELI' },

  // Vestuário
  { codigo: 'VES-001', nome: 'Camiseta Básica Algodão M',            categoria: 'Vestuário',   preco: 39.90,   custo: 22.00,   quantidade: 75,  estoque_minimo: 25, unidade: 'UN', fornecedor: 'Moda Express LTDA' },
  { codigo: 'VES-002', nome: 'Calça Jeans Masculina 42',             categoria: 'Vestuário',   preco: 129.90,  custo: 75.00,   quantidade: 12,  estoque_minimo: 10, unidade: 'UN', fornecedor: 'Moda Express LTDA' },

  // Ferramentas
  { codigo: 'FER-001', nome: 'Chave de Fenda Phillips 6"',           categoria: 'Ferramentas', preco: 18.90,   custo: 10.00,   quantidade: 40,  estoque_minimo: 15, unidade: 'UN', fornecedor: 'Ferramentas Premium SA' },
  { codigo: 'FER-002', nome: 'Furadeira Impacto 750W',               categoria: 'Ferramentas', preco: 299.90,  custo: 200.00,  quantidade: 7,   estoque_minimo: 5,  unidade: 'UN', fornecedor: 'Ferramentas Premium SA' },
  { codigo: 'FER-003', nome: 'Jogo de Chaves Allen 9 peças',         categoria: 'Ferramentas', preco: 49.90,   custo: 28.00,   quantidade: 25,  estoque_minimo: 10, unidade: 'JG', fornecedor: 'Ferramentas Premium SA' }
];

// Movimentações históricas (últimos 30 dias)
function gerarMovimentacoes(produtos) {
  const movimentacoes = [];
  const tipos = ['entrada', 'saida'];
  const motivosEntrada = ['Compra de fornecedor', 'Devolução de cliente', 'Ajuste de inventário', 'Transferência entre filiais'];
  const motivosSaida = ['Venda', 'Perda/Avaria', 'Doação', 'Consumo interno'];
  const usuarios = ['admin', 'gerente', 'operador', 'estoquista'];

  const agora = new Date();
  for (const produto of produtos) {
    const qtdMov = Math.floor(Math.random() * 8) + 3; // 3 a 10 movimentações por produto
    for (let i = 0; i < qtdMov; i++) {
      const tipo = tipos[Math.floor(Math.random() * 2)];
      const diasAtras = Math.floor(Math.random() * 30);
      const data = new Date(agora);
      data.setDate(data.getDate() - diasAtras);
      data.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));

      movimentacoes.push({
        produtoCodigo: produto.codigo,
        produtoNome: produto.nome,
        tipo,
        quantidade: Math.floor(Math.random() * 20) + 1,
        motivo: tipo === 'entrada'
          ? motivosEntrada[Math.floor(Math.random() * motivosEntrada.length)]
          : motivosSaida[Math.floor(Math.random() * motivosSaida.length)],
        usuario: usuarios[Math.floor(Math.random() * usuarios.length)],
        dataMovimento: data
      });
    }
  }
  return movimentacoes.sort((a, b) => b.dataMovimento - a.dataMovimento);
}

// ============================================================
//  FUNÇÕES DE SEED POR BANCO
// ============================================================

async function seedSQLServer() {
  logger.info('🔄 Populando SQL Server...');
  const pool = await connectSS();

  // Limpa dados anteriores (mantém estrutura)
  await pool.request().query('DELETE FROM Movimentacoes');
  await pool.request().query('DELETE FROM AlertasEstoque');
  await pool.request().query('DELETE FROM Produtos');
  await pool.request().query('DELETE FROM Fornecedores');
  await pool.request().query('DELETE FROM Categorias');
  await pool.request().query('DELETE FROM Usuarios');

  // Usuários
  for (const u of USUARIOS) {
    const senhaHash = await bcrypt.hash(u.senha, 10);
    await pool.request()
      .input('login', sql.VarChar(50), u.login)
      .input('senha', sql.VarChar(255), senhaHash)
      .input('nome', sql.VarChar(150), u.nome)
      .input('email', sql.VarChar(150), u.email)
      .input('papel', sql.VarChar(20), u.papel)
      .query(`INSERT INTO Usuarios (login, senha_hash, nome, email, papel)
              VALUES (@login, @senha, @nome, @email, @papel)`);
  }
  logger.info(`   ✅ ${USUARIOS.length} usuários`);

  // Categorias
  for (const c of CATEGORIAS) {
    await pool.request()
      .input('nome', sql.VarChar(100), c.nome)
      .input('descricao', sql.VarChar(500), c.descricao)
      .query(`INSERT INTO Categorias (nome, descricao) VALUES (@nome, @descricao)`);
  }
  logger.info(`   ✅ ${CATEGORIAS.length} categorias`);

  // Fornecedores
  for (const f of FORNECEDORES) {
    await pool.request()
      .input('nome', sql.VarChar(200), f.nome)
      .input('cnpj', sql.VarChar(20), f.cnpj)
      .input('contato', sql.VarChar(100), f.contato)
      .input('telefone', sql.VarChar(20), f.telefone)
      .input('email', sql.VarChar(150), f.email)
      .input('endereco', sql.VarChar(300), f.endereco)
      .query(`INSERT INTO Fornecedores (nome, cnpj, contato, telefone, email, endereco)
              VALUES (@nome, @cnpj, @contato, @telefone, @email, @endereco)`);
  }
  logger.info(`   ✅ ${FORNECEDORES.length} fornecedores`);

  // Produtos
  for (const p of PRODUTOS) {
    await pool.request()
      .input('codigo', sql.VarChar(50), p.codigo)
      .input('nome', sql.VarChar(200), p.nome)
      .input('categoria', sql.VarChar(100), p.categoria)
      .input('preco', sql.Decimal(10,2), p.preco)
      .input('custo', sql.Decimal(10,2), p.custo)
      .input('quantidade', sql.Int, p.quantidade)
      .input('estoque_minimo', sql.Int, p.estoque_minimo)
      .input('unidade', sql.VarChar(20), p.unidade)
      .input('fornecedor', sql.VarChar(200), p.fornecedor)
      .query(`INSERT INTO Produtos (codigo, nome, categoria, preco, custo, quantidade, estoque_minimo, unidade, fornecedor)
              VALUES (@codigo, @nome, @categoria, @preco, @custo, @quantidade, @estoque_minimo, @unidade, @fornecedor)`);
  }
  logger.info(`   ✅ ${PRODUTOS.length} produtos`);

  // Busca IDs para movimentações
  const produtosResult = await pool.request().query('SELECT id, codigo FROM Produtos');
  const mapaProdutos = {};
  produtosResult.recordset.forEach(p => mapaProdutos[p.codigo] = p.id);

  // Movimentações
  const movimentacoes = gerarMovimentacoes(PRODUTOS);
  for (const m of movimentacoes) {
    const produtoId = mapaProdutos[m.produtoCodigo];
    if (!produtoId) continue;
    await pool.request()
      .input('produto_id', sql.Int, produtoId)
      .input('tipo', sql.VarChar(10), m.tipo)
      .input('quantidade', sql.Int, m.quantidade)
      .input('motivo', sql.VarChar(500), m.motivo)
      .input('usuario', sql.VarChar(100), m.usuario)
      .input('data', sql.DateTime, m.dataMovimento)
      .query(`INSERT INTO Movimentacoes (produto_id, tipo, quantidade, motivo, usuario, data_movimento)
              VALUES (@produto_id, @tipo, @quantidade, @motivo, @usuario, @data)`);
  }
  logger.info(`   ✅ ${movimentacoes.length} movimentações`);

  logger.info('✅ SQL Server populado com sucesso!');
}

async function seedMySQL() {
  logger.info('🔄 Populando MySQL...');
  const pool = await connectMy();

  // Limpa dados
  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
  await pool.execute('DELETE FROM movimentacoes');
  await pool.execute('DELETE FROM alertas_estoque');
  await pool.execute('DELETE FROM produtos');
  await pool.execute('DELETE FROM fornecedores');
  await pool.execute('DELETE FROM categorias');
  await pool.execute('DELETE FROM usuarios');
  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

  // Usuários
  for (const u of USUARIOS) {
    const senhaHash = await bcrypt.hash(u.senha, 10);
    await pool.execute(
      `INSERT INTO usuarios (login, senha_hash, nome, email, papel) VALUES (?, ?, ?, ?, ?)`,
      [u.login, senhaHash, u.nome, u.email, u.papel]
    );
  }
  logger.info(`   ✅ ${USUARIOS.length} usuários`);

  // Categorias
  for (const c of CATEGORIAS) {
    await pool.execute(
      `INSERT INTO categorias (nome, descricao) VALUES (?, ?)`,
      [c.nome, c.descricao]
    );
  }
  logger.info(`   ✅ ${CATEGORIAS.length} categorias`);

  // Fornecedores
  for (const f of FORNECEDORES) {
    await pool.execute(
      `INSERT INTO fornecedores (nome, cnpj, contato, telefone, email, endereco)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [f.nome, f.cnpj, f.contato, f.telefone, f.email, f.endereco]
    );
  }
  logger.info(`   ✅ ${FORNECEDORES.length} fornecedores`);

  // Produtos
  for (const p of PRODUTOS) {
    await pool.execute(
      `INSERT INTO produtos (codigo, nome, categoria, preco, custo, quantidade, estoque_minimo, unidade, fornecedor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.codigo, p.nome, p.categoria, p.preco, p.custo, p.quantidade, p.estoque_minimo, p.unidade, p.fornecedor]
    );
  }
  logger.info(`   ✅ ${PRODUTOS.length} produtos`);

  // Busca IDs
  const [rows] = await pool.execute('SELECT id, codigo FROM produtos');
  const mapaProdutos = {};
  rows.forEach(p => mapaProdutos[p.codigo] = p.id);

  // Movimentações
  const movimentacoes = gerarMovimentacoes(PRODUTOS);
  for (const m of movimentacoes) {
    const produtoId = mapaProdutos[m.produtoCodigo];
    if (!produtoId) continue;
    await pool.execute(
      `INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, usuario, data_movimento)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [produtoId, m.tipo, m.quantidade, m.motivo, m.usuario, m.dataMovimento]
    );
  }
  logger.info(`   ✅ ${movimentacoes.length} movimentações`);

  logger.info('✅ MySQL populado com sucesso!');
}

async function seedMongoDB() {
  logger.info('🔄 Populando MongoDB...');
  const db = await connectMo();

  // Limpa coleções
  await db.collection('usuarios').deleteMany({});
  await db.collection('categorias').deleteMany({});
  await db.collection('fornecedores').deleteMany({});
  await db.collection('produtos').deleteMany({});
  await db.collection('movimentacoes').deleteMany({});
  await db.collection('alertas_estoque').deleteMany({});

  // Usuários
  const usuariosComHash = await Promise.all(
    USUARIOS.map(async u => ({
      ...u,
      senha_hash: await bcrypt.hash(u.senha, 10),
      createdAt: new Date()
    }))
  );
  await db.collection('usuarios').insertMany(usuariosComHash);
  logger.info(`   ✅ ${USUARIOS.length} usuários`);

  // Categorias
  const categoriasComData = CATEGORIAS.map(c => ({ ...c, createdAt: new Date() }));
  await db.collection('categorias').insertMany(categoriasComData);
  logger.info(`   ✅ ${CATEGORIAS.length} categorias`);

  // Fornecedores
  const fornecedoresComData = FORNECEDORES.map(f => ({ ...f, createdAt: new Date() }));
  await db.collection('fornecedores').insertMany(fornecedoresComData);
  logger.info(`   ✅ ${FORNECEDORES.length} fornecedores`);

  // Produtos (documentos enriquecidos - aproveitando NoSQL)
  const produtosDocs = PRODUTOS.map(p => ({
    ...p,
    tags: [p.categoria.toLowerCase(), p.unidade.toLowerCase()],
    atributos: {
      ativo: true,
      destaque: Math.random() > 0.7,
      promocao: Math.random() > 0.8
    },
    historicoPreco: [
      { preco: p.preco * 0.9, data: new Date(Date.now() - 60*24*60*60*1000) },
      { preco: p.preco, data: new Date() }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  const result = await db.collection('produtos').insertMany(produtosDocs);
  logger.info(`   ✅ ${PRODUTOS.length} produtos`);

  // Mapa de IDs
  const mapaProdutos = {};
  produtosDocs.forEach((p, i) => {
    mapaProdutos[p.codigo] = result.insertedIds[i];
  });

  // Movimentações
  const movimentacoes = gerarMovimentacoes(PRODUTOS).map(m => ({
    ...m,
    produtoId: mapaProdutos[m.produtoCodigo],
    createdAt: new Date()
  }));
  await db.collection('movimentacoes').insertMany(movimentacoes);
  logger.info(`   ✅ ${movimentacoes.length} movimentações`);

  // Alertas automáticos para produtos com estoque baixo
  const alertas = produtosDocs
    .filter(p => p.quantidade <= p.estoque_minimo)
    .map(p => ({
      produtoId: mapaProdutos[p.codigo],
      produtoNome: p.nome,
      quantidadeAtual: p.quantidade,
      estoqueMinimo: p.estoque_minimo,
      nivel: p.quantidade === 0 ? 'zerado' : p.quantidade <= p.estoque_minimo / 2 ? 'critico' : 'baixo',
      resolvido: false,
      dataAlerta: new Date()
    }));
  if (alertas.length) {
    await db.collection('alertas_estoque').insertMany(alertas);
    logger.info(`   ✅ ${alertas.length} alertas de estoque baixo`);
  }

  logger.info('✅ MongoDB populado com sucesso!');
}

// ============================================================
//  EXECUÇÃO PRINCIPAL
// ============================================================

(async () => {
  logger.info('🌱 Iniciando seed de dados...');
  const inicio = Date.now();

  try {
    // Executa os 3 seeds em paralelo
    const resultados = await Promise.allSettled([
      seedSQLServer(),
      seedMySQL(),
      seedMongoDB()
    ]);

    resultados.forEach((r, i) => {
      const banco = ['SQL Server', 'MySQL', 'MongoDB'][i];
      if (r.status === 'fulfilled') {
        logger.info(`✅ ${banco}: OK`);
      } else {
        logger.error(`❌ ${banco}: ${r.reason.message}`);
      }
    });

    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
    logger.info(`🎉 Seed concluído em ${duracao}s`);
    logger.info('📊 Resumo:');
    logger.info(`   • ${USUARIOS.length} usuários`);
    logger.info(`   • ${CATEGORIAS.length} categorias`);
    logger.info(`   • ${FORNECEDORES.length} fornecedores`);
    logger.info(`   • ${PRODUTOS.length} produtos`);
    logger.info(`   • ~${PRODUTOS.length * 6} movimentações por banco`);

    process.exit(0);
  } catch (err) {
    logger.error(`💥 Erro no seed: ${err.message}`);
    process.exit(1);
  }
})();