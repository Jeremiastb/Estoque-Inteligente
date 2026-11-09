const { connect } = require('../../config/mysql');

module.exports = {
  async registrarMovimentacao(mov) {
    const pool = await connect();
    const [r] = await pool.execute(
      `INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, usuario, data_movimento)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [mov.produtoId, mov.tipo, mov.quantidade, mov.motivo, mov.usuario]
    );
    return { id: r.insertId, ...mov };
  },

  async listarMovimentacoes(filtros = {}) {
    const pool = await connect();
    let sql = 'SELECT * FROM movimentacoes';
    const params = [];
    const conditions = [];

    if (filtros.produtoId) {
      conditions.push('produto_id = ?');
      params.push(filtros.produtoId);
    }
    if (filtros.tipo) {
      conditions.push('tipo = ?');
      params.push(filtros.tipo);
    }
    if (filtros.dataInicio) {
      conditions.push('data_movimento >= ?');
      params.push(filtros.dataInicio);
    }
    if (filtros.dataFim) {
      conditions.push('data_movimento <= ?');
      params.push(filtros.dataFim);
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY data_movimento DESC';

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  async buscarPorId(id) {
    const pool = await connect();
    const [rows] = await pool.execute('SELECT * FROM movimentacoes WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async excluir(id) {
    const pool = await connect();
    await pool.execute('DELETE FROM movimentacoes WHERE id = ?', [id]);
    return true;
  }
};