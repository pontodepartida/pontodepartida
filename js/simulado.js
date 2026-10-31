import { armazenamento, sessao } from './armazenamento.js?v=2026-10-30';
import { dividirEnunciado } from './texto.js';
import { DURACAO_SIMULADO, AVISO_SIMULADO, app, dialogo, painelMapa, estado, esc, pct, listaNumeros, formatarTempo, carregarFrases, sortearFrase, htmlFrase, lerProgresso, gravarProgresso, apagarProgresso, situacao, resumo, paraRevisar, lerAndamento, gravarAndamento, apagarAndamento, tempoRestante, lerResultadoSimulado, abrirDialogo } from './base.js';
import { tamanhoLetra, prepararAjuste, cabecalhoProva, rodape, ajustarFixos } from './interface.js';
import { ir, render } from './rotas.js';
import { abrirPassos } from './inicio.js';
import { mapaComputador, mapaSimulado, htmlAlternativas, montarInterativo, HTML_VOLTAR_TEXTO, prepararVoltarTexto } from './questao.js';
import { ondaAzulejos } from './azulejos.js';

// ---------- Terminar e resultado ----------

export function terminar() {
  const rota = estado.rota;
  const prova = estado.provas.get(rota.id);
  if (!prova) return;
  if (rota.tela === 'sim-questao') return terminarSimulado(prova);
  const prog = lerProgresso(prova.id);
  const faltam = prova.questoes.filter(q => !q.anulada && !prog.respostas[q.numero]).map(q => q.numero);
  const concluir = () => {
    const p = lerProgresso(prova.id);
    p.terminada = true;
    gravarProgresso(prova.id, p);
    estado.comemorar = true;
    ir(`#/${prova.id}/resultado`);
  };
  if (painelMapa.open) painelMapa.close();
  if (!faltam.length) return concluir();
  const qtd = faltam.length === 1 ? '1 questão está sem resposta' : `${faltam.length} questões estão sem resposta`;
  abrirDialogo({
    titulo: 'Terminar a prova?',
    texto: `${qtd}: ${listaNumeros(faltam)}. ${faltam.length === 1 ? 'Ela aparece' : 'Elas aparecem'} no resultado como “sem resposta” e ${faltam.length === 1 ? 'entra' : 'entram'} na lista para revisar.`,
    acoes: [
      { rotulo: 'Voltar à prova', classe: 'botao--secundario', seguro: true },
      { rotulo: 'Terminar mesmo assim', classe: 'botao--primario', acao: concluir },
    ],
  });
}

export function recomecar(id) {
  const prova = estado.provas.get(id);
  if (!prova) return;
  const prog = lerProgresso(id);
  const n = Object.keys(prog.respostas).length;
  abrirDialogo({
    titulo: `Recomeçar ${prova.nome}?`,
    texto: `${n === 1 ? 'A resposta salva' : `As ${n} respostas salvas`} neste navegador ${n === 1 ? 'será apagada' : 'serão apagadas'}. Não dá para desfazer.`,
    alerta: true,
    acoes: [
      { rotulo: 'Cancelar', classe: 'botao--secundario', seguro: true },
      { rotulo: 'Apagar e recomeçar', classe: 'botao--perigo', acao: () => { apagarProgresso(id); render(); } },
    ],
  });
}

function htmlMaterias(prova, prog) {
  const materias = [];
  for (const q of prova.questoes) {
    let m = materias.find(x => x.nome === q.materia);
    if (!m) materias.push(m = { nome: q.materia, total: 0, acertos: 0 });
    m.total++;
    const s = situacao(q, prog, true);
    if (s === 'certa' || s === 'anulada') m.acertos++;
  }
  return `<div class="grupo materias">
    ${materias.map(m => `<div class="materia">
      <div class="materia__linha"><span class="materia__nome">${esc(m.nome)}</span><span style="font-size:16px"><b>${m.acertos}</b> de ${m.total} · ${pct(m.acertos, m.total)}%</span></div>
      <div class="barra barra--azul" role="progressbar" aria-label="Acertos em ${esc(m.nome)}" aria-valuenow="${m.acertos}" aria-valuemin="0" aria-valuemax="${m.total}"><div style="width:${pct(m.acertos, m.total)}%"></div></div>
    </div>`).join('')}
  </div>`;
}

function htmlNotaAnulada(anuladas) {
  if (!anuladas.length) return '';
  return `<div class="nota-anulada"><span aria-hidden="true" style="font-weight:800">★</span><span>${anuladas.length === 1
    ? `A questão ${anuladas[0]} foi anulada e contou como acerto.`
    : `As questões ${listaNumeros(anuladas)} foram anuladas e contaram como acerto.`}</span></div>`;
}

export async function telaResultado(prova) {
  const frases = await carregarFrases();
  const citacao = sortearFrase(frases && frases.aleatorias);
  const prog = lerProgresso(prova.id);
  const final = { ...prog, terminada: true };
  const r = resumo(prova, final);
  const lista = paraRevisar(prova, prog);
  const anuladas = prova.questoes.filter(q => q.anulada).map(q => q.numero);
  document.title = `Resultado · ${prova.nome} · Ponto de Partida`;

  const semResposta = r.vazias === 1 ? 'a questão que ficou sem resposta' : `as ${r.vazias} questões que ficaram sem resposta`;
  const frase = !r.erros && !r.vazias ? 'Você terminou a prova sem nenhum erro. Ótimo trabalho!'
    : !r.respondidas ? 'Você terminou a prova sem responder nenhuma questão. Na revisão, veja a explicação de cada uma.'
    : !r.erros ? `Você não errou nenhuma das questões que respondeu. Na revisão, veja a explicação d${semResposta}.`
    : !r.vazias ? 'Você terminou a prova. A revisão mostra as questões erradas, já com as explicações.'
    : `Você terminou a prova. A revisão mostra as questões erradas e ${semResposta}, já com as explicações.`;

  const notaAnulada = htmlNotaAnulada(anuladas);

  const itens = lista.map(q => {
    const resp = prog.respostas[q.numero];
    const detalhe = resp ? `✕ marcou ${resp} · correta ${q.correta}` : `○ sem resposta · correta ${q.correta}`;
    return `<a class="item-revisar" href="#/${prova.id}/revisao/${q.numero}">
      <span class="item-revisar__num ${resp ? 'item-revisar__num--erro' : 'item-revisar__num--vazia'}">${q.numero}</span>
      <span class="item-revisar__txt"><span class="item-revisar__tema">${esc(q.conteudo)}</span><span class="item-revisar__detalhe">${esc(q.materia)} · ${detalhe}</span></span>
      <span class="item-revisar__seta" aria-hidden="true">›</span>
    </a>`;
  }).join('');

  app.innerHTML = `<div class="app">
    ${cabecalhoProva(prova, 'Resultado', prog, false)}
    ${mapaComputador(prova, final, null, false, false)}
    <main id="conteudo" class="conteudo">
      <div class="resultado">
        <div class="resultado__col">
          <div class="resultado__topo">
            <span class="rotulo">Prova concluída</span>
            <h1 class="resultado__placar" tabindex="-1" style="margin:0">
              <span class="resultado__num">${r.acertos}</span>
              <span class="resultado__de">de ${r.total} acertos · ${pct(r.acertos, r.total)}%</span>
            </h1>
            <p class="resultado__frase">${frase}</p>
          </div>
          <div class="grupo grupo--3">
            <div class="contagem"><span class="contagem__num" style="color:var(--cor-certo)"><span aria-hidden="true">✓</span> ${r.acertos}</span><span class="contagem__txt">${r.acertos === 1 ? 'acerto' : 'acertos'}${r.anuladas ? ` (${r.anuladas} ${r.anuladas === 1 ? 'anulada' : 'anuladas'})` : ''}</span></div>
            <div class="contagem"><span class="contagem__num" style="color:var(--cor-erro)"><span aria-hidden="true">✕</span> ${r.erros}</span><span class="contagem__txt">${r.erros === 1 ? 'erro' : 'erros'}</span></div>
            <div class="contagem"><span class="contagem__num"><span aria-hidden="true">○</span> ${r.vazias}</span><span class="contagem__txt">sem resposta</span></div>
          </div>
          ${htmlMaterias(prova, final)}
          ${notaAnulada}
          ${htmlFrase(citacao, 'citacao--resultado')}
          <div class="resultado__acoes">
            ${lista.length ? `<a class="botao botao--primario" href="#/${prova.id}/revisao/${lista[0].numero}">Revisar ${lista.length === 1 ? 'a questão' : `as ${lista.length} questões`}</a>` : ''}
            <a class="botao botao--secundario" href="#/">Voltar às provas</a>
          </div>
        </div>
        <div class="resultado__col">
          <section class="revisar${lista.length > 5 ? ' revisar--recolhido' : ''}">
            <h2 class="resultado__subtitulo">Para revisar (${lista.length})</h2>
            <div class="grupo">
              ${itens || '<div class="vazio-revisar">Nenhuma questão para revisar.</div>'}
              ${lista.length > 5 ? `<button type="button" class="ver-todas" data-acao="ver-todas">Ver as ${lista.length} questões</button>` : ''}
            </div>
          </section>
        </div>
      </div>
    </main>
    ${rodape()}
  </div>`;
  comemorarSeTerminou();
}

// ---------- Simulado: telas ----------

export function comecarSimulado(id) {
  const prova = estado.provas.get(id);
  if (!prova) return;
  const anterior = lerResultadoSimulado(id);
  const substitui = anterior ? ' Ao terminar, este resultado substitui o anterior.' : '';
  const comecar = () => {
    gravarAndamento(id, { inicio: Date.now(), respostas: {}, marcadas: [], aviso20: false });
    ir(`#/${id}/simulado/${prova.questoes[0].numero}`);
  };
  if (!armazenamento.ler('intro-simulado')) {
    return abrirPassos({
      rotulo: 'Simulado',
      concluir: 'Começar simulado',
      passos: [
        ['Como no dia da prova', `Você terá 3 horas para as ${prova.questoes.length} questões da ${esc(prova.nome)}. O tempo conta pelo relógio e não pausa, nem com a aba em segundo plano. Quando faltarem 20 minutos, aparece um aviso.`],
        ['Gabarito só no final', 'A resposta fica gravada ao tocar e pode ser trocada até você terminar. Nas questões em que ficar em dúvida, use ⚑ Marcar para revisar e volte a elas pelo mapa.'],
        ['Sair apaga o simulado', `Se você fechar esta aba ou sair da prova, o simulado é apagado e recomeça do zero, mas o app sempre pergunta antes.${substitui}`],
      ],
      aoConcluir: () => { armazenamento.gravar('intro-simulado', '1'); comecar(); },
    });
  }
  abrirDialogo({
    titulo: `Começar o simulado da ${prova.nome}?`,
    texto: `São 3 horas para as ${prova.questoes.length} questões, sem pausa, e o gabarito só aparece no final. Sair da prova apaga o simulado.${substitui}`,
    acoes: [
      { rotulo: 'Cancelar', classe: 'botao--secundario', seguro: true },
      { rotulo: 'Começar', classe: 'botao--primario', acao: comecar },
    ],
  });
}

function encerrarSimulado(prova, esgotado = false) {
  const a = lerAndamento(prova.id);
  if (!a) return;
  armazenamento.gravarJSON('simulado:' + prova.id, {
    respostas: a.respostas,
    marcadas: a.marcadas,
    feitoEm: Date.now(),
    tempoUsado: Math.min(DURACAO_SIMULADO, Date.now() - a.inicio),
    esgotado,
  });
  apagarAndamento(prova.id);
  avisoTempo.hidden = true;
  if (dialogo.open) dialogo.close();
  if (painelMapa.open) painelMapa.close();
  estado.comemorar = true;
  ir(`#/${prova.id}/simulado/resultado`);
}

function htmlCronometro(a) {
  const oculto = sessao.ler('cronometro-oculto') === '1';
  const ms = tempoRestante(a);
  return `<span class="cronometro${oculto ? ' cronometro--oculto' : ''}${ms <= AVISO_SIMULADO ? ' cronometro--fim' : ''}">
    <span class="cronometro__tempo" role="timer" aria-label="Tempo restante"><span aria-hidden="true">◷</span> <span data-cronometro>${oculto ? 'tempo oculto' : formatarTempo(ms)}</span></span>
    <button type="button" class="cronometro__alternar" data-acao="alternar-cronometro">${oculto ? 'mostrar' : 'ocultar'}</button>
  </span>`;
}

function htmlMarcar(a, q) {
  const m = a.marcadas.includes(q.numero);
  return `<button type="button" class="marcar" data-acao="marcar" aria-pressed="${m}">
    <span class="marcar__caixa" aria-hidden="true">${m ? '✓' : ''}</span> Marcar para revisar
  </button>`;
}

function htmlNavSimulado(prova, q) {
  const idx = prova.questoes.indexOf(q);
  const ant = prova.questoes[idx - 1], prox = prova.questoes[idx + 1];
  return `<div class="questao__nav">
    ${ant ? `<a class="link-botao" href="#/${prova.id}/simulado/${ant.numero}">‹ Questão ${ant.numero}</a>` : '<span></span>'}
    ${prox ? `<a class="botao botao--primario" href="#/${prova.id}/simulado/${prox.numero}">Próxima questão →</a>`
           : `<button type="button" class="botao botao--primario" data-acao="terminar">Terminar simulado</button>`}
  </div>`;
}

export function telaSimulado(prova, q) {
  const a = lerAndamento(prova.id);
  if (!a) { location.replace('#/'); return false; }
  if (!tempoRestante(a)) { encerrarSimulado(prova, true); return false; }
  document.title = `Questão ${q.numero} · Simulado · ${prova.nome} · Ponto de Partida`;
  if (estado.telaCheia) telaSimuladoTelaCheia(prova, q, a);
  else telaSimuladoNormal(prova, q, a);
  montarInterativo(prova, q);
  prepararVoltarTexto();
  verificarAvisoTempo(a);
  return true;
}

function telaSimuladoNormal(prova, q, a) {
  const r = resumo(prova, a);
  const { corpo, comando } = dividirEnunciado(q.enunciado);
  app.innerHTML = `<div class="app app--simulado">
    ${cabecalhoProva(prova, [`Simulado · ${r.respondidas} de ${r.total} respondidas`, `Simulado · ${r.respondidas}/${r.total}`], a, true, htmlCronometro(a))}
    ${mapaSimulado(prova, a, q.numero)}
    <main id="conteudo" class="conteudo">
      <div class="questao" style="--letra:${tamanhoLetra(prova.id)[2]}">
        <div class="questao__col questao__col--esquerda">
          <div class="questao__cabeca">
            <h1 class="questao__numero" tabindex="-1">Questão ${q.numero}</h1>
            <span class="etiqueta etiqueta--materia">${esc(q.materia)}</span>
          </div>
          <div class="questao__textos rico">${corpo}${q.interativo ? '<div class="interativo" id="interativo"></div>' : ''}</div>
        </div>
        <div class="questao__col questao__col--direita fixa-se-couber">
          ${HTML_VOLTAR_TEXTO}
          ${comando ? `<div class="comando">${comando}</div>` : ''}
          ${htmlAlternativas(prova, q, { respostas: {} }, false, { selecionada: a.respostas[q.numero] || null, rotulo: '● Sua resposta' })}
          ${htmlMarcar(a, q)}
          ${htmlNavSimulado(prova, q)}
        </div>
      </div>
    </main>
    ${rodape()}
  </div>`;
}

function telaSimuladoTelaCheia(prova, q, a) {
  const r = resumo(prova, a);
  const { corpo, comando } = dividirEnunciado(q.enunciado);
  app.innerHTML = `<div class="tc">
    <header class="tc-barra">
      <div class="tc-barra__titulo">
        <h1 class="tc-barra__questao" tabindex="-1">Questão ${q.numero}</h1>
        <span class="etiqueta etiqueta--materia tc-barra__materia">${esc(q.materia)}</span>
      </div>
      <span class="tc-barra__sub">${esc(prova.nome)} · Simulado · ${r.respondidas} de ${r.total} respondidas</span>
      <span class="cabecalho__espaco"></span>
      ${htmlCronometro(a)}
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
        ${htmlAlternativas(prova, q, { respostas: {} }, false, { selecionada: a.respostas[q.numero] || null, rotulo: '● Sua resposta' })}
        ${htmlMarcar(a, q)}
        ${htmlNavSimulado(prova, q)}
        <p class="tc-rola-aviso" aria-hidden="true">Role para ver tudo ↓</p>
      </div>
    </main>
  </div>`;
}

function redesenharSimulado(prova, q, foco) {
  if (!telaSimulado(prova, q)) return;
  ajustarFixos();
  prepararAjuste();
  const el = foco && app.querySelector(foco);
  if (el) el.focus({ preventScroll: true });
}

export function responderSimulado(prova, q, letra) {
  const a = lerAndamento(prova.id);
  if (!a) return;
  a.respostas[q.numero] = letra;
  gravarAndamento(prova.id, a);
  redesenharSimulado(prova, q, `.alt[data-letra="${letra}"]`);
}

export function marcarParaRevisar() {
  const rota = estado.rota;
  const prova = estado.provas.get(rota.id);
  const q = prova && prova.questoes.find(x => x.numero === rota.n);
  const a = prova && lerAndamento(prova.id);
  if (!q || !a) return;
  a.marcadas = a.marcadas.includes(q.numero) ? a.marcadas.filter(n => n !== q.numero) : [...a.marcadas, q.numero];
  gravarAndamento(prova.id, a);
  redesenharSimulado(prova, q, '[data-acao="marcar"]');
}

function terminarSimulado(prova) {
  const a = lerAndamento(prova.id);
  if (!a) return;
  if (painelMapa.open) painelMapa.close();
  const vazias = prova.questoes.filter(q => !a.respostas[q.numero]).map(q => q.numero);
  const marcadas = [...a.marcadas].sort((x, y) => x - y);
  const numeros = (nums) => `<div class="pendentes__numeros">${nums.map(n =>
    `<a class="pendentes__num" href="#/${prova.id}/simulado/${n}" aria-label="Ir para a questão ${n}">${n}</a>`).join('')}</div>`;
  let html = '';
  if (vazias.length) html += `<div class="pendentes"><span class="pendentes__titulo"><span aria-hidden="true">○</span> ${vazias.length} sem resposta</span>${numeros(vazias)}</div>`;
  if (marcadas.length) html += `<div class="pendentes pendentes--marcadas"><span class="pendentes__titulo"><span aria-hidden="true">⚑</span> ${marcadas.length} ${marcadas.length === 1 ? 'marcada' : 'marcadas'} para revisar</span>${numeros(marcadas)}</div>`;
  abrirDialogo({
    titulo: 'Terminar o simulado?',
    texto: `Ainda faltam ${formatarTempo(tempoRestante(a))}. Depois de terminar, as respostas não podem ser mudadas.`,
    html,
    acoes: [
      { rotulo: 'Voltar à prova', classe: 'botao--secundario', seguro: true },
      { rotulo: 'Terminar simulado', classe: 'botao--primario', acao: () => encerrarSimulado(prova) },
    ],
  });
}

export function confirmarSaidaSimulado(id, destino) {
  abrirDialogo({
    titulo: 'Sair do simulado?',
    texto: 'O simulado não fica salvo pela metade. Se você sair agora, as respostas são apagadas e, na próxima vez, ele começa do zero, com as 3 horas.',
    alerta: true,
    acoes: [
      { rotulo: 'Continuar o simulado', classe: 'botao--secundario', seguro: true },
      { rotulo: 'Sair e apagar', classe: 'botao--perigo', acao: () => { apagarAndamento(id); avisoTempo.hidden = true; ir(destino); } },
    ],
  });
}

export const avisoTempo = document.createElement('div');
avisoTempo.className = 'aviso-tempo';
avisoTempo.setAttribute('role', 'alert');
avisoTempo.hidden = true;
document.body.appendChild(avisoTempo);

function verificarAvisoTempo(a) {
  const mostrar = !a.aviso20 && tempoRestante(a) <= AVISO_SIMULADO;
  if (mostrar && avisoTempo.hidden) {
    const min = Math.max(1, Math.ceil(tempoRestante(a) / 60000));
    avisoTempo.innerHTML = `<div class="aviso-tempo__textos">
        <span class="aviso-tempo__titulo"><span aria-hidden="true">◷</span> Faltam ${min} ${min === 1 ? 'minuto' : 'minutos'}</span>
        <span class="aviso-tempo__texto">Ainda há tempo para conferir as respostas.</span>
      </div>
      <button type="button" class="botao botao--pequeno botao--primario" data-acao="fechar-aviso-tempo">Entendi</button>`;
    avisoTempo.hidden = false;
  } else if (!mostrar) {
    avisoTempo.hidden = true;
  }
}

export function fecharAvisoTempo() {
  const rota = estado.rota;
  const a = rota && rota.id && lerAndamento(rota.id);
  if (a) { a.aviso20 = true; gravarAndamento(rota.id, a); }
  avisoTempo.hidden = true;
  const h1 = app.querySelector('h1');
  if (h1) h1.focus({ preventScroll: true });
}


setInterval(() => {
  const rota = estado.rota;
  if (!rota || rota.tela !== 'sim-questao') return;
  const prova = estado.provas.get(rota.id);
  const a = prova && lerAndamento(prova.id);
  if (!a) return;
  const ms = tempoRestante(a);
  if (!ms) return encerrarSimulado(prova, true);
  document.querySelectorAll('.cronometro').forEach(el => {
    el.classList.toggle('cronometro--fim', ms <= AVISO_SIMULADO);
    if (!el.classList.contains('cronometro--oculto')) el.querySelector('[data-cronometro]').textContent = formatarTempo(ms);
  });
  verificarAvisoTempo(a);
}, 1000);

export async function telaResultadoSimulado(prova) {
  const res = lerResultadoSimulado(prova.id);
  if (!res) { location.replace('#/'); return false; }
  document.title = `Resultado do simulado · ${prova.nome} · Ponto de Partida`;
  const r = resumo(prova, res);
  const lista = paraRevisar(prova, res);
  const anuladas = prova.questoes.filter(q => q.anulada).map(q => q.numero);
  const base = `#/${prova.id}/simulado`;

  const itens = prova.questoes.map(q => {
    const s = situacao(q, res, true);
    const resp = res.respostas[q.numero];
    const detalhe = s === 'certa' ? `✓ acertou · ${q.correta}`
      : s === 'errada' ? `✕ marcou ${resp} · correta ${q.correta}`
      : s === 'anulada' ? '★ anulada, conta como acerto'
      : `○ sem resposta · correta ${q.correta}`;
    const marcada = res.marcadas.includes(q.numero) ? ' · ⚑ marcada' : '';
    const classe = { certa: 'certa', errada: 'erro', anulada: 'anulada', vazia: 'vazia' }[s];
    return `<a class="item-revisar" href="${base}/revisao/${q.numero}">
      <span class="item-revisar__num item-revisar__num--${classe}">${q.numero}</span>
      <span class="item-revisar__txt"><span class="item-revisar__tema">${esc(q.conteudo)}</span><span class="item-revisar__detalhe">${esc(q.materia)} · ${detalhe}${marcada}</span></span>
      <span class="item-revisar__seta" aria-hidden="true">›</span>
    </a>`;
  }).join('');

  app.innerHTML = `<div class="app">
    ${cabecalhoProva(prova, 'Resultado do simulado', res, false)}
    <main id="conteudo" class="conteudo">
      <div class="resultado">
        <div class="resultado__col">
          ${res.esgotado ? `<div class="nota-tempo"><span aria-hidden="true">◷</span><span>O tempo acabou e o simulado foi encerrado automaticamente. As questões sem resposta contam como erro.</span></div>` : ''}
          <div class="resultado__topo">
            <span class="rotulo">Simulado concluído</span>
            <h1 class="resultado__placar" tabindex="-1" style="margin:0">
              <span class="resultado__num">${r.acertos}</span>
              <span class="resultado__de">de ${r.total} acertos · ${pct(r.acertos, r.total)}%</span>
            </h1>
          </div>
          <div class="grupo grupo--4">
            <div class="contagem"><span class="contagem__num" style="color:var(--cor-certo)"><span aria-hidden="true">✓</span> ${r.acertos}</span><span class="contagem__txt">${r.acertos === 1 ? 'acerto' : 'acertos'}${r.anuladas ? ` (${r.anuladas} ${r.anuladas === 1 ? 'anulada' : 'anuladas'})` : ''}</span></div>
            <div class="contagem"><span class="contagem__num" style="color:var(--cor-erro)"><span aria-hidden="true">✕</span> ${r.erros}</span><span class="contagem__txt">${r.erros === 1 ? 'erro' : 'erros'}</span></div>
            <div class="contagem"><span class="contagem__num"><span aria-hidden="true">○</span> ${r.vazias}</span><span class="contagem__txt">sem resposta</span></div>
            <div class="contagem"><span class="contagem__num">${formatarTempo(res.tempoUsado)}</span><span class="contagem__txt">tempo usado, de ${formatarTempo(DURACAO_SIMULADO)}</span></div>
          </div>
          ${htmlMaterias(prova, res)}
          ${htmlNotaAnulada(anuladas)}
          <div class="resultado__acoes">
            ${lista.length ? `<a class="botao botao--primario" href="${base}/revisao/${lista[0].numero}">Revisar ${lista.length === 1 ? 'a questão' : `as ${lista.length} questões`}</a>` : ''}
            <a class="botao botao--secundario" href="#/">Voltar às provas</a>
          </div>
          <div class="resultado__refazer"><button type="button" class="link-botao link-botao--sublinhado" data-acao="comecar-simulado" data-id="${prova.id}">Refazer o simulado</button></div>
        </div>
        <div class="resultado__col">
          <section class="revisar">
            <h2 class="resultado__subtitulo">Todas as questões (${r.total})</h2>
            <div class="grupo">${itens}</div>
          </section>
        </div>
      </div>
    </main>
    ${rodape()}
  </div>`;
  comemorarSeTerminou();
  return true;
}

function comemorarSeTerminou() {
  if (!estado.comemorar) return;
  estado.comemorar = false;
  ondaAzulejos();
}
