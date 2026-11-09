/**
 * Serviço de estoque - gerencia entradas, saídas e alertas
 * Aula 15: Modelos alternativos - usa MongoDB para alertas (flexibilidade)
 */
const produtoRepo = require('../repositories/produto.repository');
const estoqueRepo = require('../repositories/estoque.repository');
const logger = require('../utils/logger');

class EstoqueService {
  /**
   * Registra entrada de produtos
   */
  async registrarEntrada(produtoId, quantidade, motivo, usuario) {
    const repo = produtoRepo.getRepo();
    const produto = await repo.buscarPorId(produtoId);
    if (!produto) throw new Error('Produto não encontrado');

    // Atualiza quantidade
    const novaQuantidade = (produto.quantidade || 0) + quantidade;
    await repo.atualizar(produtoId, { ...produto, quantidade: novaQuantidade });

    // Registra movimentação
    const mov = await estoqueRepo.getRepo().registrarMovimentacao({
      produtoId,
      tipo: 'entrada',
      quantidade,
      motivo: motivo || 'Entrada manual',
      usuario: usuario || 'sistema'
    });

    logger.info(`Entrada registrada: ${quantidade}x produto ${produtoId}`);
    return { produto: { ...produto, quantidade: novaQuantidade }, movimentacao: mov };
  }

  /**
   * Registra saída de produtos
   */
  async registrarSaida(produtoId, quantidade, motivo, usuario) {
    const repo = produtoRepo.getRepo();
    const produto = await repo.buscarPorId(produtoId);
    if (!produto) throw new Error('Produto não encontrado');

    const estoqueAtual = produto.quantidade || 0;
    if (estoqueAtual < quantidade) {
      throw new Error(`Estoque insuficiente. Disponível: ${estoqueAtual}`);
    }

    // Atualiza quantidade
    const novaQuantidade = estoqueAtual - quantidade;
    await repo.atualizar(produtoId, { ...produto, quantidade: novaQuantidade });

    // Registra movimentação
    const mov = await estoqueRepo.getRepo().registrarMovimentacao({
      produtoId,
      tipo: 'saida',
      quantidade,
      motivo: motivo || 'Saída manual',
      usuario: usuario || 'sistema'
    });

    logger.info(`Saída registrada: ${quantidade}x produto ${produtoId}`);

    // Verifica alerta de estoque baixo
    const alerta = await this.verificarEstoqueBaixo(produtoId);

    return { produto: { ...produto, quantidade: novaQuantidade }, movimentacao: mov, alerta };
  }

  /**
   * Verifica se produto está com estoque baixo
   */
  async verificarEstoqueBaixo(produtoId) {
    const repo = produtoRepo.getRepo();
    const produto = await repo.buscarPorId(produtoId);
    const estoqueMinimo = produto.estoqueMinimo || 10; // padrão

    if (produto.quantidade <= estoqueMinimo) {
      // Registra alerta no MongoDB (Aula 15 - modelo alternativo)
      const { db } = require('../config/mongodb');
      const alerta = {
        produtoId,
        produtoNome: produto.nome,
        quantidadeAtual: produto.quantidade,
        estoqueMinimo,
        dataAlerta: new Date(),
        resolvido: false
      };
      await db().collection('alertas_estoque').insertOne(alerta);
      logger.warn(`⚠️ Alerta: Produto ${produto.nome} com estoque baixo (${produto.quantidade})`);
      return alerta;
    }
    return null;
  }

  /**
   * Lista alertas de estoque baixo
   */
  async listarAlertas(resolvidos = false) {
    const { db } = require('../config/mongodb');
    return db().collection('alertas_estoque')
      .find({ resolvido })
      .sort({ dataAlerta: -1 })
      .toArray();
  }

  /**
   * Marca alerta como resolvido
   */
  async resolverAlerta(alertaId) {
    const { ObjectId } = require('mongodb');
    const { db } = require('../config/mongodb');
    await db().collection('alertas_estoque').updateOne(
      { _id: new ObjectId(alertaId) },
      { $set: { resolvido: true, dataResolucao: new Date() } }
    );
    return true;
  }

  /**
   * Relatório de movimentações
   */
  async gerarRelatorio(filtros = {}) {
    const repo = estoqueRepo.getRepo();
    const movimentacoes = await repo.listarMovimentacoes(filtros);

    const resumo = {
      totalEntradas: 0,
      totalSaidas: 0,
      valorEntradas: 0,
      valorSaidas: 0,
      movimentacoes
    };

    for (const mov of movimentacoes) {
      const produtoRepo = require('../repositories/produto.repository').getRepo();
      const produto = await produtoRepo.buscarPorId(mov.produtoId);
      if (produto) {
        const valor = mov.quantidade * (produto.preco || 0);
        if (mov.tipo === 'entrada') {
          resumo.totalEntradas += mov.quantidade;
          resumo.valorEntradas += valor;
        } else {
          resumo.totalSaidas += mov.quantidade;
          resumo.valorSaidas += valor;
        }
      }
    }

    return resumo;
  }
}

module.exports = new EstoqueService();