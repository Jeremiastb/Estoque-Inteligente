/**
 * ============================================================
 *  SISTEMA INTELIGENTE DE GESTÃO DE ESTOQUE - Frontend
 * ============================================================
 */

const API = '/api';
let dbAtivo = 'mongodb';
let produtosCache = [];

// ============================================================
//  INICIALIZAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  inicializarNavegacao();
  inicializarEventos();
  verificarHealth();
  atualizarDateTime();
  setInterval(atualizarDateTime, 60000);
  carregarDashboard();
});

function inicializarNavegacao() {
  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.onclick = (e) => {
      if (btn.onclick && btn.onclick.toString().includes('location.href')) return;
      e.preventDefault();
      switchTab(btn.dataset.tab);
    };
  });

  document.getElementById('dbSelect').addEventListener('change', e => {
    dbAtivo = e.target.value;
    verificarHealth();
    if (document.getElementById('tab-produtos').classList.contains('active')) {
      carregarProdutos();
    }
    if (document.getElementById('tab-dashboard').classList.contains('active')) {
      carregarDashboard();
    }
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  
  const btn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
  if (btn) btn.classList.add('active');
  
  const tab = document.getElementById(`tab-${tabName}`);
  if (tab) tab.classList.add('active');

  // Atualiza título
  const titulos = {
    dashboard: ['Dashboard', 'Visão geral do sistema'],
    produtos: ['Produtos', 'Gerenciamento de produtos'],
    movimentacoes: ['Movimentações', 'Entradas e saídas de estoque'],
    kv: ['Key-Value Store', 'Aula 12 - Modelo chave-valor'],
    graph: ['Grafo', 'Aula 11 - Modelo orientado a grafos'],
    content: ['Content Store', 'Aula 13 - Modelo orientado a conteúdo'],
    backup: ['Backup & Restore', 'Aula 14 - Segurança de dados'],
    migracao: ['Migração', 'Aula 16 - Migração entre bancos']
  };

  const [titulo, subtitulo] = titulos[tabName] || ['Sistema', ''];
  document.getElementById('pageTitle').textContent = titulo;
  document.getElementById('pageSubtitle').textContent = subtitulo;

  // Carrega dados específicos
  if (tabName === 'produtos') carregarProdutos();
  if (tabName === 'dashboard') carregarDashboard();
}

function inicializarEventos() {
  document.getElementById('formProduto').onsubmit = async e => {
    e.preventDefault();
    await salvarProduto();
  };
}

// ============================================================
//  API CALLS
// ============================================================

async function api(path, opts = {}) {
  const sep = path.includes('?') ? '&' : '?';
  const url = API + path + sep + 'db=' + dbAtivo;
  const r = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  if (!r.ok) {
    const err = await r.json();
    throw new Error(err.erro || 'Erro na requisição');
  }
  return r.json();
}

async function verificarHealth() {
  try {
    const r = await fetch(API + '/health');
    const data = await r.json();
    const badge = document.getElementById('healthStatus');
    const statusDb = data.databases[dbAtivo];
    const isOk = statusDb === 'ok';
    
    badge.className = `health-badge ${isOk ? 'ok' : 'error'}`;
    badge.querySelector('.health-text').textContent = `${dbAtivo}: ${isOk ? 'Online' : 'Offline'}`;
  } catch (e) {
    const badge = document.getElementById('healthStatus');
    badge.className = 'health-badge error';
    badge.querySelector('.health-text').textContent = 'Servidor offline';
  }
}

function atualizarDateTime() {
  const now = new Date();
  const options = { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' };
  document.getElementById('datetime').textContent = now.toLocaleString('pt-BR', options);
}

// ============================================================
//  DASHBOARD
// ============================================================

async function carregarDashboard() {
  try {
    const produtos = await api('/produtos');
    produtosCache = produtos;

    const total = produtos.length;
    const valorTotal = produtos.reduce((s, p) => s + (p.preco * p.quantidade), 0);
    const estoqueBaixo = produtos.filter(p => p.quantidade > 0 && p.quantidade <= (p.estoque_minimo || 10)).length;
    const estoqueZerado = produtos.filter(p => p.quantidade === 0).length;

    document.getElementById('statTotalProdutos').textContent = total;
    document.getElementById('statValorEstoque').textContent = `R$ ${valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('statEstoqueBaixo').textContent = estoqueBaixo;
    document.getElementById('statEstoqueZerado').textContent = estoqueZerado;

    // Produtos por categoria
    const categorias = {};
    produtos.forEach(p => {
      const cat = p.categoria || 'Sem categoria';
      categorias[cat] = (categorias[cat] || 0) + 1;
    });

    const catHtml = Object.entries(categorias)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => {
        const pct = (count / total * 100).toFixed(0);
        return `
          <div class="categoria-item">
            <div class="categoria-info">
              <span class="categoria-nome">${cat}</span>
              <span class="categoria-count">${count} produtos</span>
            </div>
            <div class="categoria-bar">
              <div class="categoria-fill" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');

    document.getElementById('categoriasChart').innerHTML = catHtml || '<p class="empty-state">Nenhum produto cadastrado</p>';

    // Alertas
    try {
      const alertas = await api('/estoque/alertas?resolvidos=false');
      if (alertas.length) {
        document.getElementById('alertasDashboard').innerHTML = alertas.slice(0, 5).map(a => `
          <div class="alerta-item">
            <span class="alerta-icon">⚠️</span>
            <div class="alerta-info">
              <strong>${a.produtoNome || 'Produto'}</strong>
              <span>Estoque: ${a.quantidadeAtual} (mín: ${a.estoqueMinimo})</span>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {}

  } catch (e) {
    console.error('Erro ao carregar dashboard:', e);
  }
}

// ============================================================
//  PRODUTOS
// ============================================================

async function carregarProdutos() {
  try {
    produtosCache = await api('/produtos');
    renderizarProdutos(produtosCache);
  } catch (e) {
    showToast('Erro ao carregar produtos: ' + e.message, 'error');
  }
}

function renderizarProdutos(produtos) {
  const tbody = document.querySelector('#tabelaProdutos tbody');
  
  if (!produtos.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhum produto cadastrado</td></tr>';
    return;
  }

  tbody.innerHTML = produtos.map(p => {
    const qtd = p.quantidade || 0;
    const min = p.estoque_minimo || 10;
    let statusClass = 'status-ok';
    let statusText = 'OK';
    
    if (qtd === 0) { statusClass = 'status-zero'; statusText = 'Zerado'; }
    else if (qtd <= min / 2) { statusClass = 'status-critical'; statusText = 'Crítico'; }
    else if (qtd <= min) { statusClass = 'status-low'; statusText = 'Baixo'; }

    return `
      <tr>
        <td><strong>${p.codigo}</strong></td>
        <td>${p.nome}</td>
        <td>${p.categoria || '-'}</td>
        <td>R$ ${Number(p.preco).toFixed(2)}</td>
        <td>${qtd}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${p.fornecedor || '-'}</td>
        <td>
          <button class="btn-icon" onclick="excluirProduto('${p._id || p.id}')" title="Excluir">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function salvarProduto() {
  const form = document.getElementById('formProduto');
  const fd = new FormData(form);
  const dados = Object.fromEntries(fd);
  dados.preco = parseFloat(dados.preco);
  dados.quantidade = parseInt(dados.quantidade);

  try {
    await api('/produtos', { method: 'POST', body: JSON.stringify(dados) });
    showToast('✅ Produto salvo com sucesso!', 'success');
    form.reset();
    carregarProdutos();
  } catch (e) {
    showToast('❌ Erro: ' + e.message, 'error');
  }
}

async function excluirProduto(id) {
  if (!confirm('Confirma a exclusão deste produto?')) return;
  try {
    await api('/produtos/' + id, { method: 'DELETE' });
    showToast('🗑️ Produto excluído', 'success');
    carregarProdutos();
  } catch (e) {
    showToast('❌ Erro: ' + e.message, 'error');
  }
}

function filtrarProdutos() {
  const termo = document.getElementById('searchProdutos').value.toLowerCase();
  const filtrados = produtosCache.filter(p => 
    p.nome.toLowerCase().includes(termo) || 
    p.codigo.toLowerCase().includes(termo) ||
    (p.categoria || '').toLowerCase().includes(termo)
  );
  renderizarProdutos(filtrados);
}

function toggleForm(formId) {
  const form = document.getElementById(formId);
  const btn = document.getElementById('formToggleText');
  form.classList.toggle('hidden');
  btn.textContent = form.classList.contains('hidden') ? 'Expandir' : 'Recolher';
}

// ============================================================
//  KEY-VALUE
// ============================================================

async function kvSet() {
  try {
    await fetch(API + '/nosql/kv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chave: kvChave.value, valor: kvValor.value })
    });
    document.getElementById('kvResult').textContent = `✅ Chave "${kvChave.value}" salva com sucesso!`;
    showToast('✅ Valor salvo no Key-Value Store', 'success');
  } catch (e) {
    document.getElementById('kvResult').textContent = '❌ Erro: ' + e.message;
  }
}

async function kvGet() {
  try {
    const r = await fetch(API + '/nosql/kv/' + kvChave.value);
    const data = await r.json();
    document.getElementById('kvResult').textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    document.getElementById('kvResult').textContent = '❌ Erro: ' + e.message;
  }
}

// ============================================================
//  GRAFO
// ============================================================

async function addEdge() {
  try {
    await fetch(API + '/nosql/graph/edge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        origem: gOrigem.value, 
        destino: gDestino.value, 
        rotulo: gRotulo.value 
      })
    });
    document.getElementById('gResult').textContent = `✅ Aresta criada: ${gOrigem.value} → ${gDestino.value} (${gRotulo.value})`;
    showToast('✅ Aresta criada no grafo', 'success');
  } catch (e) {
    document.getElementById('gResult').textContent = '❌ Erro: ' + e.message;
  }
}

async function neighbors() {
  try {
    const r = await fetch(API + '/nosql/graph/neighbors/' + gOrigem.value);
    const data = await r.json();
    document.getElementById('gResult').textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    document.getElementById('gResult').textContent = '❌ Erro: ' + e.message;
  }
}

async function path() {
  try {
    const r = await fetch(API + `/nosql/graph/path/${gOrigem.value}/${gDestino.value}`);
    const data = await r.json();
    document.getElementById('gResult').textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    document.getElementById('gResult').textContent = '❌ Erro: ' + e.message;
  }
}

// ============================================================
//  CONTENT STORE
// ============================================================

async function contentSave() {
  try {
    const r = await fetch(API + '/nosql/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: cTitulo.value,
        corpo: cCorpo.value,
        tags: cTags.value.split(',').map(t => t.trim()).filter(t => t)
      })
    });
    const data = await r.json();
    document.getElementById('cResult').textContent = `✅ Conteúdo salvo! ID: ${JSON.stringify(data)}`;
    showToast('✅ Conteúdo salvo', 'success');
  } catch (e) {
    document.getElementById('cResult').textContent = '❌ Erro: ' + e.message;
  }
}

async function contentSearch() {
  try {
    const r = await fetch(API + '/nosql/content/tag/' + cBusca.value);
    const data = await r.json();
    document.getElementById('cResult').textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    document.getElementById('cResult').textContent = '❌ Erro: ' + e.message;
  }
}

// ============================================================
//  BACKUP
// ============================================================

async function backupMongo() {
  try {
    const r = await fetch(API + '/nosql/backup/mongo', { method: 'POST' });
    const data = await r.json();
    document.getElementById('bkResult').textContent = JSON.stringify(data, null, 2);
    showToast('✅ Backup MongoDB gerado!', 'success');
  } catch (e) {
    document.getElementById('bkResult').textContent = '❌ Erro: ' + e.message;
  }
}

async function backupSS() {
  try {
    const r = await fetch(API + '/nosql/backup/sqlserver', { method: 'POST' });
    const data = await r.json();
    document.getElementById('bkResult').textContent = JSON.stringify(data, null, 2);
    showToast('✅ Backup SQL Server gerado!', 'success');
  } catch (e) {
    document.getElementById('bkResult').textContent = '❌ Erro: ' + e.message;
  }
}

async function backupViews() {
  try {
    const r = await fetch(API + '/nosql/backup/views');
    const data = await r.json();
    document.getElementById('bkResult').textContent = JSON.stringify(data, null, 2);
    showToast('✅ Snapshot de views capturado!', 'success');
  } catch (e) {
    document.getElementById('bkResult').textContent = '❌ Erro: ' + e.message;
  }
}

// ============================================================
//  MIGRAÇÃO
// ============================================================

async function migrar(tipo) {
  try {
    const r = await fetch(API + '/nosql/migrar/' + tipo, { method: 'POST' });
    const data = await r.json();
    document.getElementById('mgResult').textContent = JSON.stringify(data, null, 2);
    showToast(`✅ Migração ${tipo} concluída!`, 'success');
  } catch (e) {
    document.getElementById('mgResult').textContent = '❌ Erro: ' + e.message;
  }
}

// ============================================================
//  TOAST NOTIFICATIONS
// ============================================================

function showToast(mensagem, tipo = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  
  const icon = tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : '⚠️';
  toast.innerHTML = `<span style="font-size:1.2rem">${icon}</span><span>${mensagem}</span>`;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// CSS adicional para categorias e alertas (injetado via JS)
const styleExtra = document.createElement('style');
styleExtra.textContent = `
  .categoria-item { margin-bottom: 1rem; }
  .categoria-info { display: flex; justify-content: space-between; margin-bottom: 0.375rem; }
  .categoria-nome { font-weight: 600; color: var(--gray-700); }
  .categoria-count { color: var(--gray-500); font-size: 0.85rem; }
  .categoria-bar { height: 8px; background: var(--gray-100); border-radius: var(--radius-full); overflow: hidden; }
  .categoria-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-light)); border-radius: var(--radius-full); transition: width 0.5s ease; }
  .alerta-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--warning-bg); border-radius: var(--radius); margin-bottom: 0.5rem; }
  .alerta-icon { font-size: 1.25rem; }
  .alerta-info { display: flex; flex-direction: column; }
  .alerta-info strong { font-size: 0.9rem; color: var(--gray-800); }
  .alerta-info span { font-size: 0.8rem; color: var(--gray-600); }
`;
document.head.appendChild(styleExtra);