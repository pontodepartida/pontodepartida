import { armazenamento, sessao } from './armazenamento.js?v=2026-10-30';
import { rico, dividirEnunciado, textoPuro } from './texto.js';
import { interativos } from './interativos.js';
import { LETRAS, app, painelMapa, explicacoes, painelTema, estado, esc, pct, ehCelular, anunciar, miniaturaVideo,lerProgresso, gravarProgresso, situacao, resumo, paraRevisar, lerAndamento, fonte, mostrarPainel } from './base.js';
import { tamanhoLetra, agendarAjuste, prepararAjuste, cabecalhoProva, rodape, ajustarFixos } from './interface.js';
import { responderSimulado } from './simulado.js';
import { bolinhasAcerto } from './azulejos.js';

// ---------- Mapa de questões ----------

const SIMBOLO = { certa: '✓', errada: '✕', anulada: '★', vazia: '○', atual: '●' };
const NOME_ESTADO = { certa: 'certa', errada: 'errada', anulada: 'anulada', vazia: 'sem resposta', atual: 'atual' };

function celulasMapa(prova, prog, atual, revisao, base = `#/${prova.id}`) {
  const final = !!prog.terminada || !!revisao;
  const lista = revisao ? new Set(paraRevisar(prova, prog).map(q => q.numero)) : null;
  return prova.questoes.map(q => {
    const s = q.numero === atual ? 'atual' : situacao(q, prog, final);
    const apagada = revisao && q.numero !== atual && !lista.has(q.numero);
    const destino = revisao && (lista.has(q.numero) || base !== `#/${prova.id}`) ? `${base}/revisao/${q.numero}` : `${base}/${q.numero}`;
    return `<a class="celula celula--${s}${apagada ? ' celula--apagada' : ''}" href="${destino}"
      aria-label="Questão ${q.numero}, ${NOME_ESTADO[s]}"${q.numero === atual ? ' aria-current="page"' : ''}>
      <b>${q.numero}</b><span aria-hidden="true">${SIMBOLO[s]}</span></a>`;
  }).join('');
}

export function mapaComputador(prova, prog, atual, revisao, comTerminar = !revisao, base = `#/${prova.id}`) {
  const r = resumo(prova, prog);
  return `<nav class="mapa-nav" aria-label="Mapa de questões">
    <div class="mapa-nav__dentro">
      <div class="mapa-nav__linha">
        <span class="mapa-nav__titulo">Questões</span>
        <div class="mapa-nav__barra" role="progressbar" aria-label="Questões respondidas" aria-valuenow="${r.respondidas}" aria-valuemin="0" aria-valuemax="${r.total}"><div style="width:${pct(r.respondidas, r.total)}%"></div></div>
        <span>${r.respondidas} de ${r.total} respondidas</span>
        <span style="flex:1"></span>
        <span class="mapa-nav__legenda" aria-hidden="true"><span>✓ certa</span><span>✕ errada</span><span>★ anulada</span><span>○ sem resposta</span></span>
        ${comTerminar ? `<button type="button" class="mapa-nav__terminar" data-acao="terminar">Terminar prova</button>` : ''}
      </div>
      <div class="mapa mapa--linha" style="--colunas:${r.total}">${celulasMapa(prova, prog, atual, revisao, base)}</div>
    </div>
  </nav>`;
}

function celulasSimulado(prova, a, atual) {
  return prova.questoes.map(q => {
    const n = q.numero, resp = a.respostas[n], marcada = a.marcadas.includes(n);
    const s = marcada ? 'marcada' : resp ? 'respondida' : 'vazia';
    const nome = (resp ? 'respondida' : 'sem resposta') + (marcada ? ', marcada para revisar' : '');
    return `<a class="celula celula--${s}${n === atual ? ' celula--aqui' : ''}" href="#/${prova.id}/simulado/${n}"
      aria-label="Questão ${n}, ${nome}"${n === atual ? ' aria-current="page"' : ''}>
      <b>${n}</b><span aria-hidden="true">${marcada ? '⚑' : resp ? '●' : '○'}</span></a>`;
  }).join('');
}

const LEGENDA_SIMULADO = '<span>● respondida</span><span>○ sem resposta</span><span>⚑ para revisar</span>';

export function mapaSimulado(prova, a, atual) {
  return `<nav class="mapa-nav" aria-label="Mapa de questões">
    <div class="mapa-nav__dentro">
      <div class="mapa-nav__linha">
        <span class="mapa-nav__titulo">Questões</span>
        <span class="mapa-nav__legenda" aria-hidden="true">${LEGENDA_SIMULADO}</span>
        <span style="flex:1"></span>
        <button type="button" class="mapa-nav__terminar" data-acao="terminar">Terminar simulado</button>
      </div>
      <div class="mapa mapa--linha" style="--colunas:${prova.questoes.length}">${celulasSimulado(prova, a, atual)}</div>
    </div>
  </nav>`;
}

export function abrirPainelMapa() {
  const rota = estado.rota;
  const prova = estado.provas.get(rota.id);
  if (!prova) return;
  if (rota.tela === 'sim-questao') {
    const a = lerAndamento(prova.id);
    if (!a) return;
    const r = resumo(prova, a);
    painelMapa.innerHTML = `
      <div class="painel__alca" aria-hidden="true"></div>
      <div class="painel__topo">
        <div class="painel__titulos"><h2 class="painel__titulo">Questões</h2><span class="painel__sub">${r.respondidas} de ${r.total} respondidas</span></div>
        <button type="button" class="painel__fechar" data-acao="fechar-mapa" aria-label="Fechar">✕</button>
      </div>
      <div class="mapa mapa--painel">${celulasSimulado(prova, a, rota.n)}</div>
      <div class="painel__legenda" aria-hidden="true">${LEGENDA_SIMULADO}</div>
      <button type="button" class="botao botao--secundario botao--largo" data-acao="terminar" style="height:52px">Terminar simulado</button>`;
    mostrarPainel(painelMapa);
    painelMapa.querySelector('[data-acao="fechar-mapa"]').focus();
    return;
  }
  const f = fonte(prova);
  const prog = f.prog;
  const r = resumo(prova, prog);
  const revisao = rota.tela === 'revisao' || rota.tela === 'sim-revisao';
  painelMapa.innerHTML = `
    <div class="painel__alca" aria-hidden="true"></div>
    <div class="painel__topo">
      <div class="painel__titulos"><h2 class="painel__titulo">Questões</h2><span class="painel__sub">${r.respondidas} de ${r.total} respondidas</span></div>
      <button type="button" class="painel__fechar" data-acao="fechar-mapa" aria-label="Fechar">✕</button>
    </div>
    <div class="mapa mapa--painel">${celulasMapa(prova, prog, rota.n, revisao, f.base)}</div>
    <div class="painel__legenda" aria-hidden="true"><span>✓ certa</span><span>✕ errada</span><span>★ anulada</span><span>○ sem resposta</span><span>● atual</span></div>
    ${revisao ? '' : `<button type="button" class="botao botao--secundario botao--largo" data-acao="terminar" style="height:52px">Terminar prova</button>`}`;
  mostrarPainel(painelMapa);
  painelMapa.querySelector('[data-acao="fechar-mapa"]').focus();
}

// ---------- Dicas ----------
const DICAS = {
  questao: () => ehCelular()
    ? [`Toque em <b>▦</b> para ver todas as questões e em <b>Aa</b> para mudar o tamanho da letra.`, 'mapa']
    : null,
  revisao: () => [`Aqui você passa só pelas questões que errou, já com as explicações. Ao terminar, volte ao resultado em <b>Sair da revisão</b>.`, 'mapa'],
};

function htmlDica(nome) {
  const dica = !armazenamento.ler('dica:' + nome) && DICAS[nome]();
  if (!dica) return '';
  const [texto, ajuda] = dica;
  return `<aside class="dica" aria-label="Dica">
    <span class="dica__selo" aria-hidden="true">i</span>
    <p class="dica__texto">${texto} <a href="#/ajuda/${ajuda}">Mais na Ajuda</a></p>
    <button type="button" class="link-botao dica__fechar" data-acao="fechar-dica" data-dica="${nome}">Entendi</button>
  </aside>`;
}

// ---------- Questão ----------

function chaveQuestao(prova, q) { return prova.id + '/' + q.numero; }

function textoCurtoAlternativa(q, letra) {
  const t = q.alternativas[letra] || '';
  if (/!\[|\\\(|\\\[|\n/.test(t)) return '';
  const puro = textoPuro(t).replace(/[.;:]+$/, '');
  return puro.length <= 48 ? puro : '';
}

function comPrefixo(html, prefixo) {
  return html.startsWith('<p>') ? '<p>' + prefixo + html.slice(3) : prefixo + html;
}

export function htmlAlternativas(prova, q, prog, revisao, opcoes = {}) {
  const resposta = prog.respostas[q.numero] || null;
  const respondida = !!resposta || revisao;
  const selecionada = opcoes.selecionada !== undefined ? opcoes.selecionada
    : estado.selecao && estado.selecao.chave === chaveQuestao(prova, q) ? estado.selecao.letra : null;
  const rotuloSel = opcoes.rotulo || '● Sua escolha';
  const letras = LETRAS.filter(l => q.alternativas[l] !== undefined);
  const primeiraFocavel = selecionada || letras[0];

  const itens = letras.map(l => {
    const texto = rico(q.alternativas[l], { imagensSimples: true });
    if (!respondida) {
      const sel = l === selecionada;
      return `<div class="alt${sel ? ' alt--selecionada' : ''}" role="radio" aria-checked="${sel}"
          data-letra="${l}" tabindex="${l === primeiraFocavel ? 0 : -1}">
        <span class="alt__selo" aria-hidden="true">${l}</span>
        <div class="alt__texto">${comPrefixo(texto, `<span class="visualmente-oculto">${l}) </span>`)}</div>
        <span class="alt__rotulo">${sel ? rotuloSel : ''}</span>
      </div>`;
    }
    let classe = 'alt--apagada', selo = l, rotulo = '', prefixo = '';
    if (q.anulada) {
      if (l === resposta) { classe = 'alt--anulada'; selo = '★'; rotulo = 'Anulada'; prefixo = l + ' · '; }
    } else if (l === q.correta) {
      classe = 'alt--correta'; selo = '✓'; prefixo = l + ' · ';
      rotulo = l === resposta ? 'Correta · Sua resposta' : 'Correta';
    } else if (l === resposta) {
      classe = 'alt--errada'; selo = '✕'; prefixo = l + ' · '; rotulo = 'Sua resposta';
    }
    return `<div class="alt ${classe}" role="listitem" aria-disabled="true">
        <span class="alt__selo" aria-hidden="true">${selo}</span>
        <div class="alt__texto">${comPrefixo(texto, prefixo ? `<span class="alt__letra-txt">${prefixo}</span>` : `<span class="visualmente-oculto">${l}) </span>`)}</div>
        <span class="alt__rotulo">${rotulo}</span>
      </div>`;
  }).join('');

  return respondida
    ? `<div class="alternativas" id="alternativas" role="list" aria-label="Alternativas">${itens}</div>`
    : `<div class="alternativas" id="alternativas" role="radiogroup" aria-label="Alternativas">${itens}</div>`;
}

function htmlAviso(q, resposta) {
  let tipo, selo, titulo, texto;
  if (q.anulada) {
    tipo = 'anulada'; selo = '★'; titulo = 'Questão anulada';
    texto = 'Esta questão vale ponto para todos. As explicações continuam disponíveis.';
  } else if (!resposta) {
    tipo = 'vazia'; selo = '○'; titulo = 'Você não respondeu esta questão';
    texto = `A alternativa correta é ${q.correta}.`;
  } else if (resposta === q.correta) {
    const curto = textoCurtoAlternativa(q, resposta);
    tipo = 'certo'; selo = '✓'; titulo = 'Resposta correta';
    texto = curto ? `Você marcou ${resposta}, ${esc(curto)}.` : `Você marcou ${resposta}.`;
  } else {
    tipo = 'erro'; selo = '✕'; titulo = 'Resposta incorreta';
    texto = `Você marcou ${resposta}. A alternativa correta é ${q.correta}.`;
  }
  return `<div class="aviso aviso--${tipo}" role="status" tabindex="-1" id="aviso">
    <span class="aviso__selo" aria-hidden="true">${selo}</span>
    <div class="aviso__textos"><span class="aviso__titulo">${titulo}</span><span class="aviso__texto">${texto}</span></div>
  </div>`;
}

function secaoAberta(id) {
  const v = sessao.ler('secao-' + id);
  if (v !== null) return v === '1';
  return id === 'raciocinio';
}

function htmlSecao(num, id, titulo, corpo) {
  const aberta = secaoAberta(id);
  return `<div class="secao">
    <button type="button" class="secao__cabeca" aria-expanded="${aberta}" aria-controls="secao-${id}" data-acao="secao" data-secao="${id}">
      <span class="secao__num" aria-hidden="true">${num}</span>
      <span class="secao__titulo">${titulo}</span>
      <span class="secao__seta" aria-hidden="true">${aberta ? '▴' : '▾'}</span>
    </button>
    <div class="secao__corpo rico" id="secao-${id}"${aberta ? '' : ' hidden'}>${corpo}</div>
  </div>`;
}

function htmlBaseTeorica(q) {
  const essencial = (q.essencial || []).map(t => `<li class="rico-inline">${rico(t)}</li>`).join('');
  const temas = (q.teoria || []).map(id => [id, estado.teoria.get(id)]).filter(([, t]) => t);
  const aprofundar = temas.length
    ? `<div class="aprofundar">
        <h3 class="aprofundar__titulo">Quer se aprofundar?</h3>
        <div class="aprofundar__botoes">${temas.map(([id, t]) =>
          `<button type="button" class="botao botao--pequeno botao--contorno-azul" data-acao="abrir-tema" data-tema="${esc(id)}">${esc(t.titulo)}<span aria-hidden="true">›</span></button>`).join('')}</div>
      </div>`
    : '';
  return `<ul class="essencial">${essencial}</ul>${aprofundar}`;
}

function htmlSecoes(q, resposta) {
  const letras = LETRAS.filter(l => q.porQueErradas && q.porQueErradas[l]);
  const porque = `<div class="porque">${letras.map(l => `<div class="porque__item">
      <b class="porque__letra${l === resposta && !q.anulada && l !== q.correta ? ' porque__letra--erro' : ''}">${l}</b>
      <div class="rico-inline">${rico(q.porQueErradas[l])}</div>
    </div>`).join('')}</div>`;

  return `<div class="secoes">
      ${htmlSecao(1, 'raciocinio', 'Raciocínio para resolver', rico(q.raciocinio))}
      ${htmlSecao(2, 'porque', q.anulada ? 'Análise das alternativas' : 'Por que as outras estão erradas', porque)}
      ${htmlSecao(3, 'teoria', 'Base teórica', htmlBaseTeorica(q))}
    </div>`;
}

function htmlVideos(tema) {
  const videos = (tema.videos || []).filter(v => v && v.url);
  if (!videos.length) return '';
  return `<div class="videos"><h3 class="videos__titulo">Vídeos para revisar</h3><ul class="videos__lista">${videos.map(v => {
    const miniatura = miniaturaVideo(v.url);
    const icone = miniatura
      ? `<span class="tema-video__miniatura" aria-hidden="true"><img src="${esc(miniatura)}" alt="" loading="lazy"><span>▶</span></span>`
      : '<span aria-hidden="true">▶</span>';
    return `<li><a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${icone} ${esc(v.titulo || v.url)}<span class="visualmente-oculto"> (abre em nova aba)</span></a></li>`;
  }).join('')}</ul></div>`;
}

let origemTema = null;
painelTema.addEventListener('close', () => {
  if (origemTema && origemTema.isConnected) origemTema.focus({ preventScroll: true });
  origemTema = null;
});

export function abrirTema(id, origem) {
  const tema = estado.teoria.get(id);
  const prova = estado.rota && estado.provas.get(estado.rota.id);
  const q = prova && prova.questoes.find(x => x.numero === estado.rota.n);
  if (!tema || !q) return;
  painelTema.innerHTML = `<div class="gaveta__topo">
      <div class="gaveta__titulos">
        <span class="gaveta__sobre">Base teórica · ${esc(tema.materia)}</span>
        <h2 class="gaveta__titulo" id="tema-titulo">${esc(tema.titulo)}</h2>
      </div>
      <button type="button" class="painel__fechar" data-acao="fechar-tema" aria-label="Fechar o tema e voltar à questão">✕</button>
    </div>
    <div class="gaveta__corpo">
      <div class="rico tema-texto">${rico(tema.texto)}</div>
      ${htmlVideos(tema)}
      <button type="button" class="botao botao--secundario botao--largo tema-voltar" data-acao="fechar-tema">‹ Voltar à questão ${q.numero}</button>
    </div>`;
  montarInterativosDoTexto(painelTema, prova, q);
  origemTema = origem || null;
  mostrarPainel(painelTema);
  painelTema.querySelector('.gaveta__corpo').scrollTop = 0;
  painelTema.querySelector('[data-acao="fechar-tema"]').focus();
}

function htmlExplicacoes(q, resposta) {
  return `<h2 class="entenda">Entenda a questão</h2>${htmlSecoes(q, resposta)}`;
}

export function montarInterativo(prova, q) {
  if (!q.interativo) return;
  const el = document.getElementById('interativo');
  const montar = interativos[q.interativo.tipo];
  if (el && montar) {
    try { montar(el, q.interativo, { questao: q, prova }); } catch (e) { console.error(e); el.remove(); }
  } else if (el) el.remove();
}

export function montarInterativosDoTexto(raiz, prova, q) {
  raiz.querySelectorAll('[data-interativo]:not([data-montado])').forEach((el) => {
    const montar = interativos[el.dataset.interativo];
    if (!montar) return el.remove();
    el.dataset.montado = '';
    el.classList.add('interativo');
    try { montar(el, { ...el.dataset }, { questao: q, prova }); } catch (e) { console.error(e); el.remove(); }
  });
}

function telaQuestaoTelaCheia(prova, q, revisao) {
  const f = fonte(prova);
  const prog = f.prog;
  const r = resumo(prova, prog);
  const resposta = prog.respostas[q.numero] || null;
  const respondida = !!resposta || revisao;
  const idx = prova.questoes.indexOf(q);
  const anterior = prova.questoes[idx - 1];
  const proxima = prova.questoes[idx + 1];
  const { corpo, comando } = dividirEnunciado(q.enunciado);

  let sub = `${prova.nome} · ${r.respondidas} de ${r.total} respondidas`;
  let acoes;
  if (!respondida) {
    const sel = estado.selecao && estado.selecao.chave === chaveQuestao(prova, q);
    acoes = `<div class="tc-acoes">
        <button type="button" class="botao botao--primario botao--largo" data-acao="confirmar" ${sel ? '' : 'aria-disabled="true"'}>${sel ? 'Confirmar resposta' : 'Escolha uma alternativa'}</button>
      </div>
      <div class="questao__nav">
        ${anterior ? `<a class="link-botao" href="${f.base}/${anterior.numero}">‹ Questão ${anterior.numero}</a>` : '<span></span>'}
        ${proxima ? `<a class="link-botao" href="${f.base}/${proxima.numero}">Pular para a ${proxima.numero} ›</a>`
                  : `<button type="button" class="link-botao" data-acao="terminar">Terminar prova ›</button>`}
      </div>`;
  } else if (revisao) {
    const lista = paraRevisar(prova, prog);
    const pos = lista.findIndex(x => x.numero === q.numero);
    const ant = pos > 0 ? lista[pos - 1] : null;
    const prox = pos >= 0 && pos < lista.length - 1 ? lista[pos + 1] : null;
    sub = `${prova.nome} · ${pos >= 0 ? `Revisando erros · ${pos + 1} de ${lista.length}` : 'Revisando erros'}`;
    acoes = `<div class="tc-acoes">
        <button type="button" class="botao botao--secundario" data-acao="explicacoes">Ver explicações</button>
        ${ant ? `<a class="botao botao--secundario" href="${f.base}/revisao/${ant.numero}">‹ Erro anterior</a>` : ''}
        ${prox ? `<a class="botao botao--primario" href="${f.base}/revisao/${prox.numero}">Próximo erro ›</a>`
               : `<a class="botao botao--primario" href="${f.base}/resultado">Sair da revisão</a>`}
      </div>`;
  } else {
    acoes = `<div class="tc-acoes">
        <button type="button" class="botao botao--secundario" data-acao="explicacoes">Ver explicações</button>
        ${proxima ? `<a class="botao botao--primario" href="${f.base}/${proxima.numero}">Próxima questão →</a>`
                  : `<button type="button" class="botao botao--primario" data-acao="terminar">Ver resultado →</button>`}
      </div>`;
  }

  app.innerHTML = `<div class="tc">
    <header class="tc-barra">
      <div class="tc-barra__titulo">
        <h1 class="tc-barra__questao" tabindex="-1">Questão ${q.numero}</h1>
        <span class="etiqueta etiqueta--materia tc-barra__materia">${esc(q.materia)}</span>
      </div>
      <span class="tc-barra__sub">${esc(sub)}</span>
      <span class="cabecalho__espaco"></span>
      <div class="tc-barra__progresso" role="progressbar" aria-label="Questões respondidas" aria-valuenow="${r.respondidas}" aria-valuemin="0" aria-valuemax="${r.total}"><div style="width:${pct(r.respondidas, r.total)}%"></div></div>
      <button type="button" class="botao-pilula" data-acao="abrir-mapa"><span aria-hidden="true">▦</span> Questões</button>
      <button type="button" class="botao-pilula" data-acao="sair-tela-cheia"><span aria-hidden="true">✕</span> Sair da tela cheia</button>
    </header>
    <main id="conteudo" class="tc-palco">
      <div class="tc-col tc-col--textos">
        <div class="questao__textos rico">${corpo}${q.interativo ? '<div class="interativo" id="interativo"></div>' : ''}</div>
        <p class="tc-rola-aviso" aria-hidden="true">Role para ver o texto completo ↓</p>
      </div>
      <div class="tc-col tc-col--direita">
        ${comando ? `<div class="comando">${comando}</div>` : ''}
        ${htmlAlternativas(prova, q, prog, revisao)}
        ${respondida ? htmlAviso(q, resposta) : ''}
        ${acoes}
        <p class="tc-rola-aviso" aria-hidden="true">Role para ver tudo ↓</p>
      </div>
    </main>
  </div>`;
  montarInterativo(prova, q);
  montarInterativosDoTexto(app, prova, q);
}

export function abrirExplicacoes() {
  const rota = estado.rota;
  const prova = estado.provas.get(rota.id);
  const q = prova && prova.questoes.find(x => x.numero === rota.n);
  if (!q) return;
  const resposta = fonte(prova).prog.respostas[q.numero] || null;
  explicacoes.innerHTML = `<div class="gaveta__topo">
      <h2 class="gaveta__titulo" id="explicacoes-titulo">Entenda a questão ${q.numero}</h2>
      <button type="button" class="painel__fechar" data-acao="fechar-explicacoes" aria-label="Fechar explicações">✕</button>
    </div>
    <div class="gaveta__corpo">${htmlSecoes(q, resposta)}</div>`;
  montarInterativosDoTexto(explicacoes, prova, q);
  mostrarPainel(explicacoes);
  explicacoes.querySelector('[data-acao="fechar-explicacoes"]').focus();
}

export function telaQuestao(prova, q, revisao) {
  if (estado.selecao && estado.selecao.chave !== chaveQuestao(prova, q)) estado.selecao = null;
  document.title = `Questão ${q.numero} · ${prova.nome} · Ponto de Partida`;
  if (estado.telaCheia) return telaQuestaoTelaCheia(prova, q, revisao);
  telaQuestaoNormal(prova, q, revisao);
}

function telaQuestaoNormal(prova, q, revisao) {
  const f = fonte(prova);
  const prog = f.prog;
  const r = resumo(prova, prog);
  const resposta = prog.respostas[q.numero] || null;
  const respondida = !!resposta || revisao;
  const idx = prova.questoes.indexOf(q);
  const anterior = prova.questoes[idx - 1];
  const proxima = prova.questoes[idx + 1];
  const { corpo, comando } = dividirEnunciado(q.enunciado);

  const cabeca = `<div class="questao__cabeca">
      <h1 class="questao__numero" tabindex="-1">Questão ${q.numero}</h1>
      <span class="etiqueta etiqueta--materia">${esc(q.materia)}</span>
    </div>`;
  const textos = `<div class="questao__textos rico">${corpo}${q.interativo ? '<div class="interativo" id="interativo"></div>' : ''}</div>`;
  const htmlComando = HTML_VOLTAR_TEXTO + (comando ? `<div class="comando">${comando}</div>` : '');

  let barraRevisao = '';
  let direita;
  if (!respondida) {
    const sel = estado.selecao && estado.selecao.chave === chaveQuestao(prova, q);
    direita = `${htmlComando}
      ${htmlAlternativas(prova, q, prog, false)}
      <div class="barra-confirmar">
        <button type="button" class="botao botao--primario botao--largo" data-acao="confirmar" ${sel ? '' : 'aria-disabled="true"'}>${sel ? 'Confirmar resposta' : 'Escolha uma alternativa'}</button>
      </div>
      <div class="questao__nav">
        ${anterior ? `<a class="link-botao" href="${f.base}/${anterior.numero}">‹ Questão ${anterior.numero}</a>` : '<span></span>'}
        ${proxima ? `<a class="link-botao" href="${f.base}/${proxima.numero}">Pular para a ${proxima.numero} ›</a>`
                  : `<button type="button" class="link-botao" data-acao="terminar">Terminar prova ›</button>`}
      </div>`;
  } else {
    let acoes = '';
    if (revisao) {
      const lista = paraRevisar(prova, prog);
      const pos = lista.findIndex(x => x.numero === q.numero);
      const ant = pos > 0 ? lista[pos - 1] : null;
      const prox = pos >= 0 && pos < lista.length - 1 ? lista[pos + 1] : null;
      barraRevisao = `<div class="barra-revisao"><div class="barra-revisao__dentro">
        <span class="barra-revisao__titulo">${pos >= 0 ? `Revisando erros · ${pos + 1} de ${lista.length}` : 'Revisando erros'}</span>
        <span style="flex:1"></span>
        <div class="barra-revisao__acoes">
          ${ant ? `<a class="botao botao--pequeno botao--contorno-azul" href="${f.base}/revisao/${ant.numero}">‹ Erro anterior</a>` : ''}
          ${prox ? `<a class="botao botao--pequeno botao--primario" href="${f.base}/revisao/${prox.numero}">Próximo erro ›</a>` : ''}
          <a class="link-botao link-botao--sublinhado" href="${f.base}/resultado">Sair da revisão</a>
        </div>
      </div></div>`;
    } else {
      acoes = `<div class="resposta-acoes">
        ${anterior ? `<a class="botao botao--secundario" href="${f.base}/${anterior.numero}" style="font-size:16px">‹ Questão ${anterior.numero}</a>` : ''}
        ${proxima ? `<a class="botao botao--primario" href="${f.base}/${proxima.numero}">Próxima questão →</a>`
                  : `<button type="button" class="botao botao--primario" data-acao="terminar">Ver resultado →</button>`}
      </div>`;
    }
    direita = `${htmlAlternativas(prova, q, prog, revisao)}
      ${htmlAviso(q, resposta)}
      ${htmlExplicacoes(q, resposta)}
      ${acoes}`;
  }

  const subtitulo = revisao ? (f.simulado ? 'Revisão do simulado' : 'Revisão')
    : [`${r.respondidas} de ${r.total} respondidas`, `${r.respondidas}/${r.total} respondidas`];
  app.innerHTML = `<div class="app">
    ${cabecalhoProva(prova, subtitulo, prog, true)}
    ${mapaComputador(prova, prog, q.numero, revisao, !revisao, f.base)}
    ${barraRevisao}
    <main id="conteudo" class="conteudo">
      ${htmlDica(revisao ? 'revisao' : 'questao')}
      <div class="questao${respondida ? ' questao--resposta' : ''}" style="--letra:${tamanhoLetra(prova.id)[2]}">
        <div class="questao__col questao__col--esquerda${respondida ? ' fixa-se-couber' : ''}">
          ${cabeca}
          ${textos}
          ${respondida ? htmlComando : ''}
        </div>
        <div class="questao__col questao__col--direita${respondida ? '' : ' fixa-se-couber'}">
          ${direita}
        </div>
      </div>
    </main>
    ${rodape()}
  </div>`;
  montarInterativo(prova, q);
  montarInterativosDoTexto(app, prova, q);
  prepararVoltarTexto();
}

// ---------- Textos longos no celular ----------

export const HTML_VOLTAR_TEXTO = `<button type="button" class="link-botao voltar-texto" data-acao="voltar-texto" hidden><span aria-hidden="true">↑</span> Voltar ao início do texto</button>`;

export function prepararVoltarTexto() {
  const botao = app.querySelector('.voltar-texto');
  const textos = app.querySelector('.questao__textos');
  if (!botao || !textos) return;
  const medir = () => { botao.hidden = !ehCelular() || textos.offsetHeight < 2 * window.innerHeight; };
  medir();
  textos.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', medir, { once: true });
  });
}

export function voltarAoTexto() {
  const cabeca = app.querySelector('.questao__cabeca');
  if (!cabeca) return;
  cabeca.scrollIntoView({ behavior: suave(), block: 'start' });
  const h1 = cabeca.querySelector('h1');
  if (h1) h1.focus({ preventScroll: true });
}

export function irParaAlternativas() {
  const alts = document.getElementById('alternativas');
  if (!alts) return;
  alts.scrollIntoView({ behavior: suave(), block: 'start' });
  const alt = alts.querySelector('.alt[tabindex="0"]');
  if (alt) alt.focus({ preventScroll: true });
}

const suave = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';

export function selecionar(letra) {
  const rota = estado.rota;
  const prova = estado.provas.get(rota.id);
  const q = prova && prova.questoes.find(x => x.numero === rota.n);
  if (!q || q.alternativas[letra] === undefined) return;
  if (rota.tela === 'sim-questao') return responderSimulado(prova, q, letra);
  estado.selecao = { chave: chaveQuestao(prova, q), letra };
  app.querySelectorAll('.alt[role="radio"]').forEach(b => {
    const sel = b.dataset.letra === letra;
    b.classList.toggle('alt--selecionada', sel);
    b.setAttribute('aria-checked', String(sel));
    b.tabIndex = sel ? 0 : -1;
    b.querySelector('.alt__rotulo').textContent = sel ? '● Sua escolha' : '';
  });
  const conf = app.querySelector('[data-acao="confirmar"]');
  if (conf) {
    conf.removeAttribute('aria-disabled');
    conf.textContent = 'Confirmar resposta';
  }
  agendarAjuste();
}

export function confirmar() {
  const rota = estado.rota;
  if (rota.tela !== 'questao') return;
  const prova = estado.provas.get(rota.id);
  const q = prova && prova.questoes.find(x => x.numero === rota.n);
  if (!q) return;
  if (!estado.selecao || estado.selecao.chave !== chaveQuestao(prova, q)) return irParaAlternativas();
  const prog = lerProgresso(prova.id);
  if (prog.respostas[q.numero]) return;
  prog.respostas[q.numero] = estado.selecao.letra;
  gravarProgresso(prova.id, prog);
  estado.selecao = null;
  telaQuestao(prova, q, false);
  ajustarFixos();

  const aviso = document.getElementById('aviso');
  if (aviso) anunciar(`${aviso.querySelector('.aviso__titulo').textContent}. ${aviso.querySelector('.aviso__texto').textContent}`);
  if (estado.telaCheia) {
    prepararAjuste();
  } else {
    const alts = document.getElementById('alternativas');
    if (alts) alts.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (aviso) aviso.focus({ preventScroll: true });
  if (aviso && aviso.classList.contains('aviso--certo')) bolinhasAcerto(aviso.querySelector('.aviso__selo'));
}
