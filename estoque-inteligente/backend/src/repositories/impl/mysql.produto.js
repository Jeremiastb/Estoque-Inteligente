const { connect } = require('../../config/mysql');

module.exports = {
  async criar(p) {
    const pool = await connect();
    const [r] = await pool.execute(
      `INSERT INTO produtos (codigo, nome, categoria, preco, quantidade, fornecedor)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [p.codigo, p.nome, p.categoria, p.preco, p.quantidade, p.fornecedor]
    );
    return { id: r.insertId, ...p };
  },
  async listar() {
    const pool = await connect();
    const [rows] = await pool.execute('SELECT * FROM produtos ORDER BY nome');
    return rows;
  },
  async buscarPorId(id) {
    const pool = await connect();
    const [rows] = await pool.execute('SELECT * FROM produtos WHERE id = ?', [id]);
    return rows[0] || null;
  },
  async atualizar(id, p) {
    const pool = await connect();
    await pool.execute(
      `UPDATE produtos SET nome=?, categoria=?, preco=?, quantidade=?, fornecedor=?
       WHERE id=?`,
      [p.nome, p.categoria, p.preco, p.quantidade, p.fornecedor, id]
    );
    return this.buscarPorId(id);
  },
  async excluir(id) {
    const pool = await connect();
    await pool.execute('DELETE FROM produtos WHERE id = ?', [id]);
    return true;
  }
};