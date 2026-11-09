const { db } = require('../config/mongodb');
const { connect: connectMy } = require('../config/mysql');
const { connect: connectSs } = require('../config/sqlserver');

module.exports = {
  /** Migra produtos do MySQL para MongoDB preservando estrutura */
  async mysqlParaMongo() {
    const pool = await connectMy();
    const [rows] = await pool.execute('SELECT * FROM produtos');
    if (rows.length) {
      await db().collection('produtos').insertMany(
        rows.map(r => ({ ...r, _migratedFrom: 'mysql', migratedAt: new Date() }))
      );
    }
    return { migrados: rows.length };
  },

  /** Migra produtos do SQL Server para MongoDB */
  async sqlserverParaMongo() {
    const pool = await connectSs();
    const r = await pool.request().query('SELECT * FROM Produtos');
    if (r.recordset.length) {
      await db().collection('produtos').insertMany(
        r.recordset.map(x => ({ ...x, _migratedFrom: 'sqlserver', migratedAt: new Date() }))
      );
    }
    return { migrados: r.recordset.length };
  },

  /** Migra MongoDB → MySQL */
  async mongoParaMysql() {
    const docs = await db().collection('produtos').find({}).toArray();
    const pool = await connectMy();
    for (const d of docs) {
      await pool.execute(
        `INSERT IGNORE INTO produtos (codigo,nome,categoria,preco,quantidade,fornecedor)
         VALUES (?,?,?,?,?,?)`,
        [d.codigo, d.nome, d.categoria, d.preco, d.quantidade, d.fornecedor]
      );
    }
    return { migrados: docs.length };
  }
};