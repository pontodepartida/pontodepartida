import { armazenamento, sessao } from './armazenamento.js?v=2026-10-30';

export const LETRAS = ['A', 'B', 'C', 'D', 'E'];
export const DURACAO_SIMULADO = 3 * 60 * 60 * 1000;
export const AVISO_SIMULADO = 20 * 60 * 1000;
export const app = document.getElementById('app');
export const dialogo = document.getElementById('dialogo');
export const painelMapa = document.getElementById('painel-mapa');
export const zoom = document.getElementById('zoom');
export const explicacoes = document.getElementById('explicacoes');
export const painelTema = document.getElementById('tema');

const anuncio = document.createElement('div');
anuncio.className = 'visualmente-oculto';
anuncio.setAttribute('role', 'status');
anuncio.setAttribute('aria-live', 'polite');
document.body.appendChild(anuncio);

export const estado = {
  catalogo: null,          // [{ id, nome, arquivo, gabarito }]
  temasTeoria: [],         // ids dos temas de teoria usados nas provas
  provas: new Map(),       // id → dados da prova
  teoria: new Map(),       // id do tema → { titulo, texto, videos } (ou null se faltar)
  selecao: null,          // { chave: 'id/n', letra }
  rota: null,
  telaCheia: false,
  letraAberta: false,      // painel "Tamanho da letra" aberto
  biblioteca: null,        // página Teoria: { temas, grupos, materias, aba }
  comemorar: false,
  instalar: null,          // pedido de instalação guardado do evento beforeinstallprompt
};

// ---------- Utilidades ----------

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const ehCelular = () => window.matchMedia('(max-width: 959px)').matches;

export function listaNumeros(nums) {
  if (nums.length <= 1) return nums.join('');
  return nums.slice(0, -1).join(', ') + ' e ' + nums[nums.length - 1];
}

let anuncioPendente = null;

export function anunciar(texto) {
  limparAnuncio();
  anuncioPendente = setTimeout(() => { anuncio.textContent = texto; }, 60);
}

export function limparAnuncio() {
  clearTimeout(anuncioPendente);
  anuncio.textContent = '';
}

export const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function miniaturaVideo(url) {
  let u;
  try { u = new URL(url); } catch (e) { return ''; }
  const host = u.hostname.replace(/^(www\.|m\.)/, '');
  let id = '';
  if (host === 'youtu.be') id = u.pathname.slice(1);
  else if (host === 'youtube.com') id = u.searchParams.get('v') || (u.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/) || [])[2] || '';
  return /^[\w-]{6,}$/.test(id) ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : '';
}

export function formatarTempo(ms, comSegundos = true) {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), seg = s % 60;
  const dois = (n) => String(n).padStart(2, '0');
  return comSegundos ? `${h}:${dois(m)}:${dois(seg)}` : `${h}:${dois(m)}`;
}

const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
export function dataCurta(ms) {
  const d = new Date(ms);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

// ---------- Dados ----------

export async function carregarCatalogo() {
  if (estado.catalogo) return estado.catalogo;
  const r = await fetch('dados/provas.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error('Não foi possível carregar a lista de provas.');
  const j = await r.json();
  estado.catalogo = j.provas;
  estado.temasTeoria = j.teoria || [];
  return estado.catalogo;
}

export function provaResumida(item) {
  return {
    id: item.id,
    nome: item.nome,
    questoes: [...(item.gabarito || '')].map((l, i) => ({ numero: i + 1, correta: l === '*' ? null : l, anulada: l === '*' })),
  };
}

export async function carregarProva(id) {
  if (estado.provas.has(id)) return estado.provas.get(id);
  const cat = await carregarCatalogo();
  const item = cat.find(p => p.id === id);
  if (!item) return null;
  const r = await fetch('dados/' + item.arquivo, { cache: 'no-cache' });
  if (!r.ok) throw new Error('Não foi possível carregar a prova ' + item.nome + '.');
  const prova = await r.json();
  prova.id = item.id;
  prova.nome = prova.nome || item.nome;
  prova.questoes.sort((a, b) => a.numero - b.numero);
  estado.provas.set(id, prova);
  verificarTemas(prova);
  return prova;
}

const imagensPedidas = new Set();
export function guardarImagens(prova) {
  if (!('serviceWorker' in navigator) || imagensPedidas.has(prova.id)) return;
  if (navigator.connection && navigator.connection.saveData) return;
  imagensPedidas.add(prova.id);
  const urls = [...new Set(JSON.stringify(prova).match(/img\/[\w./-]+\.(?:png|jpe?g|webp|gif|svg)/g) || [])];
  if (!urls.length) return;
  navigator.serviceWorker.ready.then(reg => reg.active && reg.active.postMessage({ tipo: 'guardar-imagens', urls }));
}


export async function carregarTeorias(ids) {
  const faltam = (ids || []).filter(id => !estado.teoria.has(id));
  await Promise.all(faltam.map(async (id) => {
    try {
      const r = await fetch('dados/teoria/' + id + '.json', { cache: 'no-cache' });
      estado.teoria.set(id, r.ok ? await r.json() : null);
    } catch (e) {
      estado.teoria.set(id, null);
    }
  }));
}

let listaTemas = null;

export function carregarListaTemas() {
  if (!listaTemas) {
    listaTemas = fetch('dados/temas.json', { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error('Não foi possível carregar a lista de temas.'); return r.json(); })
      .catch(e => { listaTemas = null; throw e; });
  }
  return listaTemas;
}

export async function carregarBiblioteca() {
  await carregarCatalogo();
  const ids = estado.temasTeoria;
  await carregarTeorias(ids);
  return ids.map(id => [id, estado.teoria.get(id)]).filter(([, t]) => t).map(([id, t]) => ({ ...t, id }));
}

async function verificarTemas(prova) {
  try {
    const temas = await carregarListaTemas();
    for (const q of prova.questoes) {
      const lista = temas[q.materia];
      if (!lista || !lista.includes(q.conteudo)) {
        console.warn(`${prova.nome}, questão ${q.numero}: o tema "${q.conteudo}" não está em dados/temas.json`);
      }
    }
  } catch (e) { }
}

// ---------- Frases sobre educação ----------

export async function carregarFrases() {
  if (estado.frases !== undefined) return estado.frases;
  try {
    const r = await fetch('dados/frases.json', { cache: 'no-cache' });
    estado.frases = r.ok ? await r.json() : null;
  } catch (e) {
    estado.frases = null;
  }
  return estado.frases;
}

export function sortearFrase(lista) {
  if (!lista || !lista.length) return null;
  const ultima = armazenamento.ler('ultima-frase');
  const opcoes = lista.length > 1 ? lista.filter(f => f.texto !== ultima) : lista;
  const frase = opcoes[Math.floor(Math.random() * opcoes.length)];
  armazenamento.gravar('ultima-frase', frase.texto);
  return frase;
}

const MOSAICO = [90, 0, 0, 180];

export function htmlFrase(f, classe = '') {
  if (!f || !f.texto) return '';
  const autor = f.atribuida ? `atribuída a ${esc(f.autor)}` : esc(f.autor);
  return `<figure class="citacao ${classe}">
    <span class="citacao__mosaico" aria-hidden="true">${MOSAICO.map(g => `<i style="--giro:${g}deg"></i>`).join('')}</span>
    <div class="citacao__corpo">
      <blockquote class="citacao__texto"><p>“${esc(f.texto)}”</p></blockquote>
      <figcaption class="citacao__autoria"><span class="citacao__autor">${autor}</span></figcaption>
    </div>
  </figure>`;
}

// ---------- Progresso ----------

export function lerProgresso(id) {
  const p = armazenamento.lerJSON('prova:' + id, null);
  if (!p || typeof p !== 'object' || typeof p.respostas !== 'object' || p.respostas === null) {
    return { respostas: {}, terminada: false, atualizadoEm: 0 };
  }
  return p;
}

export function gravarProgresso(id, p) {
  p.atualizadoEm = Date.now();
  armazenamento.gravarJSON('prova:' + id, p);
}

export function apagarProgresso(id) {
  armazenamento.apagar('prova:' + id);
}

export function situacao(q, prog, final) {
  const r = prog.respostas[q.numero];
  if (q.anulada) return (r || final) ? 'anulada' : 'vazia';
  if (!r) return 'vazia';
  return r === q.correta ? 'certa' : 'errada';
}

export function resumo(prova, prog) {
  const final = !!prog.terminada;
  const r = { total: prova.questoes.length, respondidas: 0, certas: 0, erros: 0, anuladas: 0, vazias: 0, acertos: 0 };
  for (const q of prova.questoes) {
    if (prog.respostas[q.numero]) r.respondidas++;
    const s = situacao(q, prog, final);
    if (s === 'certa') r.certas++;
    else if (s === 'errada') r.erros++;
    else if (s === 'anulada') r.anuladas++;
    else r.vazias++;
  }
  r.acertos = r.certas + r.anuladas;
  return r;
}

export function primeiraSemResposta(prova, prog) {
  const q = prova.questoes.find(q => !prog.respostas[q.numero]);
  return q ? q.numero : null;
}

export function paraRevisar(prova, prog) {
  return prova.questoes.filter(q => {
    const s = situacao(q, prog, true);
    return s === 'errada' || s === 'vazia';
  });
}

// ---------- Simulado ----------

export function lerAndamento(id) {
  const a = sessao.lerJSON('simulado-andamento:' + id, null);
  if (!a || typeof a.inicio !== 'number' || typeof a.respostas !== 'object' || a.respostas === null) return null;
  if (!Array.isArray(a.marcadas)) a.marcadas = [];
  return a;
}

export function gravarAndamento(id, a) { sessao.gravarJSON('simulado-andamento:' + id, a); }
export function apagarAndamento(id) { sessao.apagar('simulado-andamento:' + id); }
export const tempoRestante = (a) => Math.max(0, DURACAO_SIMULADO - (Date.now() - a.inicio));

export function lerResultadoSimulado(id) {
  const r = armazenamento.lerJSON('simulado:' + id, null);
  if (!r || typeof r.respostas !== 'object' || r.respostas === null) return null;
  return { ...r, marcadas: Array.isArray(r.marcadas) ? r.marcadas : [], terminada: true };
}

export function fonte(prova) {
  if (estado.rota && estado.rota.tela.startsWith('sim-')) {
    return {
      prog: lerResultadoSimulado(prova.id) || { respostas: {}, marcadas: [], terminada: true },
      base: `#/${prova.id}/simulado`,
      simulado: true,
    };
  }
  return { prog: lerProgresso(prova.id), base: `#/${prova.id}`, simulado: false };
}

// ---------- Diálogos ----------

export function abrirDialogo({ titulo, texto, acoes, alerta, html = '' }) {
  dialogo.setAttribute('role', alerta ? 'alertdialog' : 'dialog');
  dialogo.setAttribute('aria-labelledby', 'dialogo-titulo');
  dialogo.setAttribute('aria-describedby', 'dialogo-texto');
  dialogo.innerHTML = `<h2 class="dialogo__titulo" id="dialogo-titulo">${esc(titulo)}</h2>
    <p class="dialogo__texto" id="dialogo-texto">${esc(texto)}</p>
    ${html}
    <div class="dialogo__acoes">${acoes.map((a, i) => `<button type="button" class="botao ${a.classe}" data-i="${i}">${esc(a.rotulo)}</button>`).join('')}</div>`;
  dialogo.querySelectorAll('[data-i]').forEach(b => {
    b.addEventListener('click', () => {
      const a = acoes[Number(b.dataset.i)];
      dialogo.close();
      if (a.acao) a.acao();
    });
  });
  dialogo.showModal();
  const seguro = acoes.findIndex(a => a.seguro);
  dialogo.querySelector(`[data-i="${seguro >= 0 ? seguro : 0}"]`).focus();
}

export function abrirZoom(src, alt) {
  zoom.classList.remove('zoom--ampliavel', 'zoom--real');
  zoom.innerHTML = `<div class="zoom__barra">
      <span class="zoom__dica" aria-live="polite"></span>
      <button type="button" class="zoom__fechar" data-acao="fechar-zoom">Fechar ✕</button>
    </div>
    <div class="zoom__area"><img src="${esc(src)}" alt="${esc(alt)}"></div>`;
  zoom.showModal();
  abrirPainel(zoom);
  zoom.querySelector('.zoom__fechar').focus();
  const img = zoom.querySelector('img');
  const medir = () => {
    const ampliavel = img.naturalWidth > img.clientWidth + 8;
    zoom.classList.toggle('zoom--ampliavel', ampliavel);
    atualizarDicaZoom();
  };
  if (img.complete) medir();
  else img.addEventListener('load', medir, { once: true });
}

function atualizarDicaZoom() {
  const dica = zoom.querySelector('.zoom__dica');
  if (!dica) return;
  const toque = ehCelular() ? 'Toque' : 'Clique';
  dica.textContent = !zoom.classList.contains('zoom--ampliavel') ? ''
    : zoom.classList.contains('zoom--real') ? `Arraste para ver o resto. ${toque} na imagem para ajustar à tela.`
    : `${toque} na imagem para ver no tamanho real.`;
}

for (const d of [dialogo, painelMapa, zoom, explicacoes, painelTema]) {
  d.addEventListener('click', (e) => {
    if (e.target === d) d.close();
  });
}
zoom.addEventListener('click', (e) => {
  if (e.target.classList.contains('zoom__area')) return zoom.close();
  if (e.target.tagName !== 'IMG') return;
  if (!zoom.classList.contains('zoom--ampliavel')) return zoom.close();
  const area = zoom.querySelector('.zoom__area');
  const img = e.target;
  const real = zoom.classList.toggle('zoom--real');
  if (real) {
    const r = img.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    area.scrollLeft = fx * area.scrollWidth - area.clientWidth / 2;
    area.scrollTop = fy * area.scrollHeight - area.clientHeight / 2;
  }
  atualizarDicaZoom();
});

// ---------- Painéis e o botão voltar ----------

const pilhaPaineis = [];
let voltasPendentes = 0;
let depoisDeVoltar = null;

export function empilharPainel(id, fechar) {
  if (pilhaPaineis.some(p => p.id === id)) return;
  history.pushState({ painel: id }, '');
  pilhaPaineis.push({ id, fechar });
}

export function desempilharPainel(id) {
  const i = pilhaPaineis.findIndex(p => p.id === id);
  if (i < 0) return;
  pilhaPaineis.splice(i, 1);
  voltasPendentes++;
  history.back();
}

export function descartarPaineis() {
  pilhaPaineis.length = 0;
}

export const temPaineis = () => pilhaPaineis.length > 0;

export function depoisDosPaineis(fn) {
  if (pilhaPaineis.length) {
    const n = pilhaPaineis.length;
    pilhaPaineis.splice(0).reverse().forEach(p => p.fechar());
    voltasPendentes++;
    history.go(-n);
  }
  if (voltasPendentes) depoisDeVoltar = fn;
  else fn();
}

function abrirPainel(d) {
  empilharPainel(d.id, () => d.close());
}

for (const d of [painelMapa, zoom, explicacoes, painelTema]) {
  d.addEventListener('close', () => desempilharPainel(d.id));
}

export function mostrarPainel(d) {
  d.showModal();
  abrirPainel(d);
}

window.addEventListener('popstate', () => {
  if (voltasPendentes) {
    voltasPendentes--;
    if (!voltasPendentes && depoisDeVoltar) {
      const fn = depoisDeVoltar;
      depoisDeVoltar = null;
      fn();
    }
    return;
  }
  const p = pilhaPaineis.pop();
  if (p) p.fechar();
});
