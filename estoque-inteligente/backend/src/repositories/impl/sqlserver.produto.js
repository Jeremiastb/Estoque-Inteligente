const { connect, sql } = require('../../config/sqlserver');

module.exports = {
  async criar(p) {
    const pool = await connect();
    const r = await pool.request()
      .input('codigo', sql.VarChar(50), p.codigo)
      .input('nome', sql.VarChar(200), p.nome)
      .input('categoria', sql.VarChar(100), p.categoria)
      .input('preco', sql.Decimal(10,2), p.preco)
      .input('quantidade', sql.Int, p.quantidade)
      .input('fornecedor', sql.VarChar(200), p.fornecedor)
      .query(`INSERT INTO Produtos (codigo,nome,categoria,preco,quantidade,fornecedor)
              OUTPUT INSERTED.id VALUES (@codigo,@nome,@categoria,@preco,@quantidade,@fornecedor)`);
    return { id: r.recordset[0].id, ...p };
  },
  async listar() {
    const pool = await connect();
    const r = await pool.request().query('SELECT * FROM Produtos ORDER BY nome');
    return r.recordset;
  },
  async buscarPorId(id) {
    const pool = await connect();
    const r = await pool.request().input('id', sql.Int, id)
      .query('SELECT * FROM Produtos WHERE id = @id');
    return r.recordset[0] || null;
  },
  async atualizar(id, p) {
    const pool = await connect();
    await pool.request()
      .input('id', sql.Int, id)
      .input('nome', sql.VarChar(200), p.nome)
      .input('categoria', sql.VarChar(100), p.categoria)
      .input('preco', sql.Decimal(10,2), p.preco)
      .input('quantidade', sql.Int, p.quantidade)
      .input('fornecedor', sql.VarChar(200), p.fornecedor)
      .query(`UPDATE Produtos SET nome=@nome, categoria=@categoria, preco=@preco,
              quantidade=@quantidade, fornecedor=@fornecedor WHERE id=@id`);
    return this.buscarPorId(id);
  },
  async excluir(id) {
    const pool = await connect();
    await pool.request().input('id', sql.Int, id)
      .query('DELETE FROM Produtos WHERE id = @id');
    return true;
  }
};