const { connect, sql } = require('../../config/sqlserver');

module.exports = {
  async registrarMovimentacao(mov) {
    const pool = await connect();
    const r = await pool.request()
      .input('produto_id', sql.Int, mov.produtoId)
      .input('tipo', sql.VarChar(10), mov.tipo)
      .input('quantidade', sql.Int, mov.quantidade)
      .input('motivo', sql.VarChar(500), mov.motivo)
      .input('usuario', sql.VarChar(100), mov.usuario)
      .query(`INSERT INTO Movimentacoes (produto_id, tipo, quantidade, motivo, usuario, data_movimento)
              OUTPUT INSERTED.id VALUES (@produto_id, @tipo, @quantidade, @motivo, @usuario, GETDATE())`);
    return { id: r.recordset[0].id, ...mov };
  },

  async listarMovimentacoes(filtros = {}) {
    const pool = await connect();
    let request = pool.request();
    let sql = 'SELECT * FROM Movimentacoes';
    const conditions = [];

    if (filtros.produtoId) {
      request.input('produto_id', sql.Int, filtros.produtoId);
      conditions.push('produto_id = @produto_id');
    }
    if (filtros.tipo) {
      request.input('tipo', sql.VarChar(10), filtros.tipo);
      conditions.push('tipo = @tipo');
    }
    if (filtros.dataInicio) {
      request.input('data_inicio', sql.DateTime, new Date(filtros.dataInicio));
      conditions.push('data_movimento >= @data_inicio');
    }
    if (filtros.dataFim) {
      request.input('data_fim', sql.DateTime, new Date(filtros.dataFim));
      conditions.push('data_movimento <= @data_fim');
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY data_movimento DESC';

    const r = await request.query(sql);
    return r.recordset;
  },

  async buscarPorId(id) {
    const pool = await connect();
    const r = await pool.request().input('id', sql.Int, id)
      .query('SELECT * FROM Movimentacoes WHERE id = @id');
    return r.recordset[0] || null;
  },

  async excluir(id) {
    const pool = await connect();
    await pool.request().input('id', sql.Int, id)
      .query('DELETE FROM Movimentacoes WHERE id = @id');
    return true;
  }
};