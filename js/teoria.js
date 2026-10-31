import { sessao } from './armazenamento.js?v=2026-10-30';
import { rico } from './texto.js';
import { app, estado, esc, normalizar, miniaturaVideo,carregarTeorias, carregarListaTemas, carregarBiblioteca } from './base.js';
import { cabecalhoPagina, rodape } from './interface.js';
import { telaErro } from './rotas.js';
import { montarInterativosDoTexto } from './questao.js';

// ---------- Teoria ----------

export async function telaTeoria() {
  const temas = await carregarBiblioteca();
  const grupos = await carregarListaTemas();
  const materias = [...new Set(temas.map(t => t.materia))].sort((a, b) => a.localeCompare(b));
  let aba = sessao.ler('aba-teoria');
  if (!materias.includes(aba)) aba = materias[0];
  estado.biblioteca = { temas, grupos, materias, aba };
  document.title = 'Teoria · Ponto de Partida';
  const busca = sessao.ler('busca-teoria') || '';
  const idAba = (m) => 'aba-' + normalizar(m).replace(/[^a-z]/g, '');

  app.innerHTML = `<div class="app">
    ${cabecalhoPagina('Teoria', '#/', 'Voltar às provas', 'teoria')}
    <main id="conteudo" class="conteudo teoria">
      <div class="teoria__cabeca">
        <h1 class="teoria__titulo" tabindex="-1">Teoria</h1>
        <p class="teoria__intro">Os ${temas.length} resumos usados nas explicações das questões, num só lugar.</p>
      </div>
      <div class="teoria__barra">
        <div class="abas" role="tablist" aria-label="Matérias">
          ${materias.map(m => `<button type="button" role="tab" class="aba" id="${idAba(m)}" aria-controls="teoria-lista"
            aria-selected="${m === aba}" tabindex="${m === aba ? 0 : -1}" data-acao="aba-teoria" data-materia="${esc(m)}">${esc(m)} · <span data-contagem="${esc(m)}"></span></button>`).join('')}
        </div>
        <div class="busca">
          <span class="busca__icone" aria-hidden="true">⌕</span>
          <label class="visualmente-oculto" for="busca-teoria">Buscar tema</label>
          <input type="search" class="busca__campo" id="busca-teoria" placeholder="Buscar tema" autocomplete="off" value="${esc(busca)}">
          <button type="button" class="busca__limpar" aria-label="Apagar a busca"${busca ? '' : ' hidden'}>✕</button>
        </div>
      </div>
      <div id="teoria-lista" class="teoria__lista" role="tabpanel" aria-labelledby="${idAba(aba)}"></div>
    </main>
    ${rodape()}
  </div>`;

  const campo = document.getElementById('busca-teoria');
  const limpar = app.querySelector('.busca__limpar');
  campo.addEventListener('input', () => {
    sessao.gravar('busca-teoria', campo.value);
    limpar.hidden = !campo.value;
    desenharTeoria();
  });
  limpar.addEventListener('click', () => {
    campo.value = '';
    campo.dispatchEvent(new Event('input'));
    campo.focus();
  });
  app.querySelector('.abas').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const i = materias.indexOf(estado.biblioteca.aba);
    trocarAbaTeoria(materias[(i + (e.key === 'ArrowRight' ? 1 : -1) + materias.length) % materias.length], true);
  });
  desenharTeoria();
}

export function trocarAbaTeoria(materia, focar = false) {
  const b = estado.biblioteca;
  if (!b || !b.materias.includes(materia)) return;
  b.aba = materia;
  sessao.gravar('aba-teoria', materia);
  app.querySelectorAll('.aba').forEach(el => {
    const sel = el.dataset.materia === materia;
    el.setAttribute('aria-selected', String(sel));
    el.tabIndex = sel ? 0 : -1;
    if (sel && focar) el.focus();
    if (sel) document.getElementById('teoria-lista').setAttribute('aria-labelledby', el.id);
  });
  desenharTeoria();
}

function agruparTemas(itens, ordem = []) {
  const nomes = [...ordem, ...new Set(itens.map(t => t.grupo).filter(g => !ordem.includes(g)))];
  return nomes.map(nome => ({
    nome,
    itens: itens.filter(t => t.grupo === nome).sort((x, y) => x.titulo.localeCompare(y.titulo, 'pt-BR')),
  })).filter(g => g.itens.length);
}

function desenharTeoria() {
  const b = estado.biblioteca;
  const campo = document.getElementById('busca-teoria');
  const lista = document.getElementById('teoria-lista');
  if (!b || !campo || !lista) return;
  const termo = normalizar(campo.value.trim());
  const casa = (t) => !termo || normalizar(t.titulo).includes(termo) || normalizar(t.grupo).includes(termo);
  const achados = b.temas.filter(casa);
  for (const m of b.materias) {
    const el = app.querySelector(`[data-contagem="${CSS.escape(m)}"]`);
    if (el) el.textContent = achados.filter(t => t.materia === m).length;
  }
  const grupos = agruparTemas(achados.filter(t => t.materia === b.aba), b.grupos[b.aba]);

  if (!grupos.length) {
    const outra = b.materias.find(m => m !== b.aba && achados.some(t => t.materia === m));
    const nOutra = outra ? achados.filter(t => t.materia === outra).length : 0;
    lista.innerHTML = `<p class="teoria__vazio">Nenhum tema de ${esc(b.aba)} com “${esc(campo.value.trim())}”.${outra
      ? ` <button type="button" class="link-botao link-botao--sublinhado" data-acao="aba-teoria" data-materia="${esc(outra)}">Ver ${nOutra} em ${esc(outra)}</button>` : ''}</p>`;
    return;
  }
  lista.innerHTML = `<div class="teoria__colunas">${grupos.map(g => `<section class="teoria__grupo">
      <h2 class="teoria__grupo-titulo"><span>${esc(g.nome)}</span><span class="teoria__grupo-n">${g.itens.length}</span></h2>
      <ul class="teoria__temas">${g.itens.map(t => `<li><a href="#/teoria/${esc(t.id)}">${esc(t.titulo)}</a></li>`).join('')}</ul>
    </section>`).join('')}</div>`;
}

export async function telaTema(id) {
  await carregarTeorias([id]);
  const t = estado.teoria.get(id);
  if (!t) return telaErro('Tema não encontrado.');
  let temas = [], grupos = {};
  try { [temas, grupos] = await Promise.all([carregarBiblioteca(), carregarListaTemas()]); } catch (e) { console.error(e); }
  document.title = `${t.titulo} · Teoria · Ponto de Partida`;

  const { abertura, secoes } = secoesDoTema(ligarTemas(t.texto, temas));
  const titulo = (s) => rico(s).trim().replace(/^<p>|<\/p>$/g, '');
  const htmlSecaoTema = (s, i) => `<section class="tema-secao" aria-labelledby="tema-secao-${i}">
      <h2 class="tema-secao__titulo" id="tema-secao-${i}" tabindex="-1">${s.itens ? 'Não confunda' : titulo(s.titulo)}</h2>
      ${s.itens
        ? s.itens.map(c => `<div class="nao-confunda">
            <h3 class="nao-confunda__titulo">${titulo(c.titulo)}</h3>
            <div class="rico">${rico(c.corpo)}</div>
          </div>`).join('')
        : `<div class="rico">${rico(s.corpo)}</div>`}
    </section>`;

  const daMateria = agruparTemas(temas.filter(x => x.materia === t.materia), grupos[t.materia]).flatMap(g => g.itens);
  const pos = daMateria.findIndex(x => x.id === id);
  const anterior = pos > 0 ? daMateria[pos - 1] : null;
  const proximo = pos >= 0 ? daMateria[pos + 1] : null;
  const nav = anterior || proximo
    ? `<nav class="tema-nav" aria-label="Outros temas de ${esc(t.materia)}">
        ${anterior ? `<a class="tema-nav__link" href="#/teoria/${esc(anterior.id)}"><span class="tema-nav__rotulo">‹ Tema anterior</span><span class="tema-nav__titulo">${esc(anterior.titulo)}</span></a>` : '<span></span>'}
        ${proximo ? `<a class="tema-nav__link tema-nav__link--proximo" href="#/teoria/${esc(proximo.id)}"><span class="tema-nav__rotulo">Próximo tema ›</span><span class="tema-nav__titulo">${esc(proximo.titulo)}</span></a>` : ''}
      </nav>`
    : '';

  const sumario = secoes.length > 1
    ? `<nav class="sumario" aria-label="Nesta página">
        <h2 class="tema-lado__titulo">Nesta página</h2>
        <ul class="sumario__lista">${secoes.map((s, i) => `<li><button type="button" class="sumario__item${i ? '' : ' sumario__item--atual'}"
          data-acao="ir-secao" data-secao="tema-secao-${i}">${s.itens ? 'Não confunda' : titulo(s.titulo)}</button></li>`).join('')}</ul>
      </nav>`
    : '';
  const videos = (t.videos || []).filter(v => v && v.url);
  const htmlVideosLado = videos.length
    ? `<div class="tema-videos">
        <h2 class="tema-lado__titulo">Vídeos para revisar</h2>
        <ul class="tema-videos__lista">${videos.map(v => {
          const { nome, autor, site } = partesVideo(v);
          const miniatura = miniaturaVideo(v.url);
          return `<li><a class="tema-video" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">
            ${miniatura
              ? `<span class="tema-video__miniatura" aria-hidden="true"><img src="${esc(miniatura)}" alt="" loading="lazy"><span>▶</span></span>`
              : '<span class="tema-video__icone" aria-hidden="true">▶</span>'}
            <span class="tema-video__textos"><span class="tema-video__nome">${esc(nome)}</span>
              <span class="tema-video__meta">${autor ? `${esc(autor)} · ` : ''}${esc(site)}</span></span>
            <span class="visualmente-oculto"> (abre em nova aba)</span></a></li>`;
        }).join('')}</ul>
      </div>`
    : '';

  app.innerHTML = `<div class="app">
    ${cabecalhoPagina(`Teoria · ${t.materia}`, '#/teoria', 'Voltar à teoria', 'teoria')}
    <main id="conteudo" class="conteudo tema-pagina">
      <div class="tema-pagina__cabeca">
        <span class="rotulo">${esc(t.materia)}${t.grupo ? ` · ${esc(t.grupo)}` : ''}</span>
        <h1 class="tema-pagina__titulo" tabindex="-1">${esc(t.titulo)}</h1>
      </div>
      <article class="tema-artigo">
        ${abertura ? `<div class="rico tema-abertura">${rico(abertura)}</div>` : ''}
        ${secoes.map(htmlSecaoTema).join('')}
      </article>
      ${sumario || htmlVideosLado ? `<aside class="tema-lado${htmlVideosLado ? '' : ' tema-lado--so-sumario'}">${sumario}${htmlVideosLado}</aside>` : ''}
      ${nav}
    </main>
    ${rodape()}
  </div>`;
  montarInterativosDoTexto(app, null, null);
  marcarSumario();
}

function secoesDoTema(texto) {
  const abertura = [];
  const secoes = [];
  let atual = null;
  for (const bloco of String(texto ?? '').trim().split(/\n\s*\n/)) {
    const m = bloco.match(/^\*\*([^*\n]+?):\*\*\s*/);
    if (!m) { (atual ? atual.partes : abertura).push(bloco); continue; }
    atual = { titulo: m[1].trim(), partes: [] };
    const resto = bloco.slice(m[0].length).replace(/^([*_“"(]*)(\p{Ll})/u, (_, a, l) => a + l.toUpperCase());
    if (resto) atual.partes.push(resto);
    if (!/ × /.test(atual.titulo)) { secoes.push(atual); continue; }
    let grupo = secoes.find(s => s.itens);
    if (!grupo) secoes.push(grupo = { itens: [] });
    grupo.itens.push(atual);
  }
  const juntar = (s) => ({ ...s, corpo: (s.partes || []).join('\n\n') });
  return {
    abertura: abertura.join('\n\n'),
    secoes: secoes.map(s => s.itens ? { itens: s.itens.map(juntar) } : juntar(s)),
  };
}

function ligarTemas(texto, temas) {
  const porTitulo = new Map(temas.map(x => [x.titulo, x.id]));
  return String(texto ?? '').replace(/\b([Vv]eja) \*([^*\n]+)\*/g, (tudo, veja, titulo) =>
    porTitulo.has(titulo) ? `${veja} [${titulo}](#/teoria/${porTitulo.get(titulo)})` : tudo);
}

function partesVideo(v) {
  const bruto = String(v.titulo || v.url);
  const i = bruto.lastIndexOf(' - ');
  let nome = i > 0 ? bruto.slice(0, i) : bruto;
  let autor = i > 0 ? bruto.slice(i + 3) : '';
  const gritado = (s) => {
    const letras = s.match(/\p{L}/gu) || [];
    return letras.length > 2 && letras.filter(l => l !== l.toLowerCase()).length / letras.length > 0.8;
  };
  if (gritado(nome)) nome = nome.charAt(0) + nome.slice(1).toLowerCase();
  if (gritado(autor)) autor = autor.toLowerCase().replace(/(^|\s)\p{Ll}/gu, c => c.toUpperCase());
  let site = '';
  try { site = new URL(v.url).hostname.replace(/^www\./, ''); } catch (e) { /* url relativa */ }
  if (/(^|\.)youtu(\.be|be\.com)$/.test(site)) site = 'YouTube';
  return { nome, autor, site };
}

function marcarSumario() {
  const itens = app.querySelectorAll('.sumario__item');
  if (!itens.length) return;
  const noFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  let atual = 0;
  itens.forEach((b, i) => {
    const alvo = document.getElementById(b.dataset.secao);
    if (alvo && alvo.getBoundingClientRect().top < window.innerHeight * 0.3) atual = i;
  });
  if (noFim) atual = itens.length - 1;
  itens.forEach((b, i) => {
    b.classList.toggle('sumario__item--atual', i === atual);
    if (i === atual) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
}
let sumarioAgendado = false;
window.addEventListener('scroll', () => {
  if (sumarioAgendado) return;
  sumarioAgendado = true;
  requestAnimationFrame(() => { sumarioAgendado = false; marcarSumario(); });
}, { passive: true });
