import { armazenamento } from './armazenamento.js?v=2026-10-30';
import { faixaAzulejos } from './azulejos.js';
import { app, explicacoes, painelTema, estado, esc, pct, ehCelular, resumo, empilharPainel, desempilharPainel } from './base.js';
import { render } from './rotas.js';

// ---------- Tamanho da letra (por prova) ----------

const TAMANHOS = [
  ['pequena', 'Pequena', 0.85],
  ['normal', 'Normal', 1],
  ['grande', 'Grande', 1.18],
  ['muito-grande', 'Muito grande', 1.4],
];

export function tamanhoLetra(id) {
  const v = armazenamento.ler('letra:' + id);
  return TAMANHOS.find(t => t[0] === v) || TAMANHOS[1];
}

function botaoLetra(prova) {
  const atual = tamanhoLetra(prova.id)[0];
  const aberta = estado.letraAberta;
  return `<div class="letra">
    <button type="button" class="botao-pilula" data-acao="letra" aria-expanded="${aberta}" aria-controls="letra-painel" aria-label="Tamanho da letra"><span aria-hidden="true">Aa</span></button>
    <div class="letra__painel" id="letra-painel"${aberta ? '' : ' hidden'}>
      <span class="letra__titulo" id="letra-titulo">Tamanho da letra</span>
      <div class="letra__opcoes" role="group" aria-labelledby="letra-titulo">
        ${TAMANHOS.map(([v, nome, f]) => `<button type="button" class="letra__opcao" data-acao="tamanho" data-tamanho="${v}" aria-pressed="${v === atual}" aria-label="${nome}" style="font-size:${Math.round(17 * f)}px">A</button>`).join('')}
      </div>
      <p class="letra__nota">Vale só para a ${esc(prova.nome)}. As outras provas continuam no tamanho normal.</p>
    </div>
  </div>`;
}

export function abrirLetra(botao) {
  estado.letraAberta = true;
  document.getElementById('letra-painel').hidden = false;
  botao.setAttribute('aria-expanded', 'true');
  empilharPainel('letra', fecharLetra);
}

export function fecharLetra() {
  if (!estado.letraAberta) return;
  desempilharPainel('letra');
  estado.letraAberta = false;
  const p = document.getElementById('letra-painel');
  if (p) p.hidden = true;
  const b = app.querySelector('[data-acao="letra"]');
  if (b) b.setAttribute('aria-expanded', 'false');
}

// ---------- Tela cheia (só computador) ----------
const TELAS_QUESTAO = ['questao', 'revisao', 'sim-questao', 'sim-revisao'];
export const telaQuestaoAtiva = () => estado.rota && TELAS_QUESTAO.includes(estado.rota.tela);

export function entrarTelaCheia() {
  if (estado.telaCheia || ehCelular() || !telaQuestaoAtiva()) return;
  estado.telaCheia = true;
  document.documentElement.classList.add('tela-cheia');
  render({ manterRolagem: true });
  const el = document.documentElement;
  if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
}

export function sairTelaCheia({ renderizar = true } = {}) {
  if (!estado.telaCheia) return;
  estado.telaCheia = false;
  document.documentElement.classList.remove('tela-cheia');
  if (painelTema.open) painelTema.close();
  if (explicacoes.open) explicacoes.close();
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  if (renderizar) render({ manterRolagem: true });
}

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && estado.telaCheia) sairTelaCheia();
  else agendarAjuste();
});

const FONTE_MIN = 12;
const FONTE_MAX = 30;

function ajustarTelaCheia() {
  const palco = document.querySelector('.tc-palco');
  if (!palco) return;
  const cols = [...palco.querySelectorAll('.tc-col')];
  const cabe = () => cols.every(c => c.scrollHeight <= c.clientHeight + 1 && c.scrollWidth <= c.clientWidth + 1);
  const buscar = () => {
    let min = FONTE_MIN, max = FONTE_MAX, melhor = null;
    for (let i = 0; i < 9; i++) {
      const meio = (min + max) / 2;
      palco.style.setProperty('--tc-fonte', meio + 'px');
      if (cabe()) { melhor = meio; min = meio; } else { max = meio; }
    }
    if (melhor === null) {
      palco.style.setProperty('--tc-fonte', FONTE_MIN + 'px');
      if (cabe()) melhor = FONTE_MIN;
    }
    return melhor;
  };
  palco.classList.remove('tc-palco--colunas', 'tc-palco--rola');
  let fonte = buscar();
  if (fonte === null) {
    palco.classList.add('tc-palco--colunas');
    fonte = buscar();
  }
  if (fonte === null) {
    palco.classList.remove('tc-palco--colunas');
    palco.classList.add('tc-palco--rola');
    fonte = FONTE_MIN;
  }
  palco.style.setProperty('--tc-fonte', (Math.floor(fonte * 4) / 4) + 'px');
  const rola = palco.classList.contains('tc-palco--rola');
  cols.forEach(c => c.classList.toggle('tc-col--rola', rola && c.scrollHeight > c.clientHeight + 1));
}

let quadroAjuste = 0;
export function agendarAjuste() {
  if (!estado.telaCheia) return;
  cancelAnimationFrame(quadroAjuste);
  quadroAjuste = requestAnimationFrame(ajustarTelaCheia);
}

export function prepararAjuste() {
  if (!estado.telaCheia) return;
  ajustarTelaCheia();
  document.querySelectorAll('.tc-palco img').forEach(img => {
    if (!img.complete) img.addEventListener('load', agendarAjuste, { once: true });
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(agendarAjuste);
}

function botaoTelaCheia() {
  return `<button type="button" class="botao-pilula so-computador" data-acao="tela-cheia" aria-keyshortcuts="F">
    <span aria-hidden="true">⛶</span> Tela cheia</button>`;
}

// ---------- Cabeçalhos ----------

export function cabecalhoInicio(titulo = 'Suas provas', nTemas = 0) {
  return `<header class="cabecalho cabecalho--inicio">
    <div class="cabecalho__barra">
      <a class="cabecalho__marca so-computador" href="#/">Ponto de Partida</a>
      <span class="cabecalho__sub so-computador">Provas antigas do processo seletivo do IFSP</span>
      <div class="cabecalho__inicio-mobile">
        <h1 class="cabecalho__grande so-celular" tabindex="-1" style="margin:0">${titulo}</h1>
        <span class="cabecalho__sub">Ponto de Partida · IFSP</span>
      </div>
      <span class="cabecalho__espaco so-computador"></span>
      <a class="cabecalho__link" href="#/teoria">Teoria${nTemas ? `<span class="so-computador">&nbsp;· ${nTemas} temas</span>` : ''}</a>
    </div>
    ${faixaAzulejos('inicio')}
  </header>`;
}

export function cabecalhoPagina(sub, voltar = '#/', rotuloVoltar = 'Voltar às provas', semente = 'sobre') {
  return `<header class="cabecalho cabecalho--pagina">
      <div class="cabecalho__barra">
        <a class="botao-redondo" href="${voltar}" aria-label="${rotuloVoltar}">←</a>
        <div class="cabecalho__textos">
          <span class="cabecalho__titulo">Ponto de Partida</span>
          <span class="cabecalho__sub">${esc(sub)}</span>
        </div>
      </div>
      ${faixaAzulejos(semente)}
    </header>`;
}

export function cabecalhoProva(prova, subtitulo, prog, comMapa, extras = '') {
  const r = resumo(prova, prog);
  const [longo, curto] = Array.isArray(subtitulo) ? subtitulo : [subtitulo, subtitulo];
  const sub = longo === curto ? esc(longo)
    : `<span class="sub-longo">${esc(longo)}</span><span class="sub-curto">${esc(curto)}</span>`;
  return `<header class="cabecalho cabecalho--prova">
    <div class="cabecalho__barra">
      <a class="botao-redondo" href="#/" aria-label="Voltar às provas">←</a>
      <div class="cabecalho__textos">
        <span class="cabecalho__titulo">${esc(prova.nome)}</span>
        <span class="cabecalho__sub">${sub}</span>
      </div>
      <span class="cabecalho__espaco"></span>
      ${extras}
      ${comMapa ? botaoLetra(prova) : ''}
      ${comMapa ? `<button type="button" class="botao-pilula so-celular" data-acao="abrir-mapa" aria-label="Abrir mapa de questões"><span aria-hidden="true">▦</span><span class="so-largo" aria-hidden="true"> Questões</span></button>` : ''}
      ${comMapa ? botaoTelaCheia() : ''}
    </div>
    ${faixaAzulejos(prova.nome)}
    <div class="progresso-cabecalho" role="progressbar" aria-label="Questões respondidas" aria-valuenow="${r.respondidas}" aria-valuemin="0" aria-valuemax="${r.total}">
      <div style="width:${pct(r.respondidas, r.total)}%"></div>
    </div>
  </header>`;
}

// ---------- Rodapé e página Sobre ----------

const CONTATO = 'pontodepartida.ifsp@gmail.com';

export function rodape() {
  return `<footer class="rodape">
    ${faixaAzulejos('rodape')}
    <div class="rodape__dentro">
      <p class="rodape__texto">Ponto de Partida · projeto independente, sem vínculo com o IFSP</p>
      <nav class="rodape__links" aria-label="Rodapé">
        <a class="link-botao link-botao--sublinhado" href="#/ajuda">Ajuda</a>
        <a class="link-botao link-botao--sublinhado" href="#/sobre">Sobre</a>
        <a class="link-botao link-botao--sublinhado" href="#/sobre/contato">Contato</a>
      </nav>
    </div>
  </footer>`;
}

const SOBRE = [
  ['independencia', 'Projeto independente', `
    <p>O Ponto de Partida não é um site oficial. Ele não tem vínculo com o Instituto Federal de São Paulo (IFSP) e não fala em nome do instituto.</p>
    <p>Para inscrições, datas e regras do processo seletivo, consulte sempre os editais e os sites oficiais.</p>`],
  ['fontes', 'De onde vêm as provas', `
    <p>As provas e os gabaritos são documentos públicos, divulgados pelo próprio IFSP. Os enunciados, os textos de apoio e as imagens aparecem como no caderno de prova, com as fontes originais citadas em cada questão.</p>
    <p>Se você é titular de algum desses conteúdos e quer pedir a remoção, escreva para o contato abaixo.</p>`],
  ['explicacoes', 'Sobre as explicações', `
    <p>As explicações foram escritas com ajuda de inteligência artificial e revisadas antes de serem publicadas, apenas para fins de estudo. Mesmo assim, podem conter erros.</p>
    <p>A alternativa correta segue sempre o gabarito oficial, que é a referência em caso de dúvida. Questões anuladas pela banca valem ponto para todos.</p>`],
  ['privacidade', 'Privacidade', `
    <p>O Ponto de Partida não pede cadastro e não coleta dados pessoais. Suas respostas ficam salvas apenas neste aparelho, no armazenamento do navegador, e nunca são enviadas para nenhum servidor. Você pode apagá-las quando quiser, com o botão “Recomeçar” de cada prova ou limpando os dados de navegação.</p>
    <p>O site é hospedado no GitHub Pages, que, como qualquer serviço de hospedagem, pode registrar dados técnicos de acesso, como o endereço IP. Os vídeos indicados nas explicações estão no YouTube e só abrem quando você clica no link; a partir daí, valem as regras de privacidade do YouTube.</p>`],
  ['contato', 'Contato', `
    <p>Sou a Bruna Scarpelli, estudante de Ciência da Computação. Criei o Ponto de Partida com o objetivo principal de reunir as provas antigas num só lugar e oferecer uma breve explicação de cada questão.</p>
    <p>Sugestões, correções e pedidos podem ser enviados para <a href="mailto:${CONTATO}">${CONTATO}</a>. Se encontrar um erro numa questão, diga a prova e o número dela.</p>`],
];

export function telaSobre(secao) {
  document.title = 'Sobre · Ponto de Partida';
  app.innerHTML = `<div class="app">
    ${cabecalhoPagina('Sobre')}
    <main id="conteudo" class="conteudo sobre">
      <div class="sobre__cabeca">
        <h1 class="sobre__titulo" tabindex="-1">Sobre o Ponto de Partida</h1>
        <p class="sobre__intro">O Ponto de Partida reúne provas antigas do processo seletivo do IFSP para estudar uma questão por vez, com a explicação de cada alternativa.</p>
      </div>
      <div class="grupo">
        ${SOBRE.map(([id, rotulo, html]) => `<section class="sobre__bloco" id="sobre-${id}" aria-labelledby="sobre-${id}-titulo">
          <h2 class="rotulo" id="sobre-${id}-titulo">${rotulo}</h2>
          <div class="sobre__texto">${html}</div>
          ${id === 'contato' ? `<div><a class="botao botao--secundario botao--pequeno" href="mailto:${CONTATO}?subject=${encodeURIComponent('Erro no Ponto de Partida')}">Reportar um erro</a></div>` : ''}
        </section>`).join('')}
      </div>
      <p class="sobre__nota">Azulejos em homenagem a Athos Bulcão (1918–2008), assentados sem padrão, como nos painéis dele.</p>
    </main>
    ${rodape()}
  </div>`;
  irParaBloco('sobre-' + secao, secao);
}

function irParaBloco(id, secao) {
  if (!secao) return;
  const alvo = document.getElementById(id);
  if (alvo) requestAnimationFrame(() => alvo.scrollIntoView({ block: 'start' }));
}

// ---------- Página Ajuda ----------

const kbd = (t) => `<kbd class="tecla">${t}</kbd>`;
const celulaExemplo = (s, n, simbolo) => `<span class="celula celula--${s} celula--exemplo" aria-hidden="true"><b>${n}</b><span>${simbolo}</span></span>`;

const AJUDA = [
  ['comecar', 'Primeiros passos', `
    <p>Na tela inicial, escolha uma prova. Você pode fazer as questões em qualquer ordem e parar quando quiser: ao voltar, o cartão da prova mostra <b>Continuar na questão…</b> e leva para a primeira que ficou sem resposta.</p>
    <p>A chave <b>Estudar / ◷ Simulado</b>, acima da lista de provas, troca o jeito de fazer: no estudo, sem tempo e com a explicação logo depois de cada resposta; no simulado, como no dia da prova.</p>`],
  ['questao', 'Responder uma questão', `
    <p>Toque numa alternativa para escolher e depois em <b>Confirmar resposta</b>. Enquanto não confirmar, dá para trocar. Depois de confirmada, a resposta não muda (para refazer, use <b>Recomeçar</b> no cartão da prova, que apaga as respostas daquela prova).</p>
    <p>Se não souber, use <b>Pular para a…</b> e volte depois. Toque numa imagem para ampliá-la.</p>`],
  ['explicacoes', 'As explicações', `
    <p>Depois de confirmar, aparecem três seções:</p>
    <ul>
      <li><b>Raciocínio para resolver:</b> o passo a passo desta questão.</li>
      <li><b>Por que as outras estão erradas:</b> o erro de cada alternativa.</li>
      <li><b>Base teórica:</b> o mínimo de teoria que a questão usa. Em <b>Quer se aprofundar?</b>, cada botão abre o tema completo, com vídeos, sem sair da questão.</li>
    </ul>
    <p>Em algumas questões de Matemática há um quadro interativo para mexer e ver o raciocínio acontecer.</p>`],
  ['mapa', 'Mapa de questões e resultado', `
    <p>O mapa mostra todas as questões da prova e leva direto a qualquer uma. No computador, ele fica abaixo do cabeçalho; no celular, abre no botão <b>▦</b>.</p>
    <div class="ajuda-legenda">
      <span>${celulaExemplo('certa', 1, '✓')} certa</span>
      <span>${celulaExemplo('errada', 2, '✕')} errada</span>
      <span>${celulaExemplo('anulada', 3, '★')} anulada (vale para todos)</span>
      <span>${celulaExemplo('vazia', 4, '○')} sem resposta</span>
    </div>
    <p>Em <b>Terminar prova</b> você vê o resultado por matéria e a lista <b>Para revisar</b>, com as questões erradas e os temas delas. <b>Revisar</b> passa só por essas questões, já com as explicações.</p>`],
  ['simulado', 'Simulado', `
    <ul>
      <li><b>3 horas</b> para a prova inteira, contadas pelo relógio: o tempo não pausa, nem com a aba em segundo plano. Quando faltam 20 minutos, aparece um aviso; no zero, o simulado termina sozinho.</li>
      <li><b>Sem gabarito até o fim.</b> A resposta fica gravada ao tocar e pode ser trocada até terminar.</li>
      <li><b>⚑ Marcar para revisar</b> destaca a questão no mapa, para você voltar a ela antes de terminar. O cronômetro pode ser ocultado, se ele atrapalhar.</li>
      <li><b>Não existe simulado pela metade:</b> recarregar a página mantém, mas fechar a aba ou sair da prova apaga as respostas. O app pergunta antes.</li>
    </ul>
    <p>Fica salvo só o resultado do último simulado de cada prova. Ele não mexe no que você respondeu no modo estudo.</p>`],
  ['teoria', 'Teoria', `
    <p>Em <b>Teoria</b>, no topo da tela inicial, ficam todos os temas usados nas explicações, separados por matéria e por assunto, com busca. Cada tema tem o texto completo e vídeos indicados.</p>`],
  ['leitura', 'Letra e tela cheia', `
    <p>O botão <b>Aa</b>, nas telas de questão, muda o tamanho da letra. A escolha vale para a prova aberta.</p>
    <p>No computador, <b>⛶ Tela cheia</b> esconde o resto da tela e ajusta a letra para a questão inteira caber sem rolagem. As explicações abrem num painel lateral, em <b>Ver explicações</b>.</p>`],
  ['atalhos', 'Atalhos do teclado', `
    <p>Nas telas de questão, no computador:</p>
    <table class="atalhos">
      <tbody>
        <tr><td>${kbd('A')} … ${kbd('E')}</td><td>escolher a alternativa</td></tr>
        <tr><td>${kbd('↑')} ${kbd('↓')}</td><td>passar pelas alternativas</td></tr>
        <tr><td>${kbd('Enter')}</td><td>confirmar a resposta</td></tr>
        <tr><td>${kbd('←')} ${kbd('→')}</td><td>questão anterior e próxima (na revisão, erro anterior e próximo)</td></tr>
        <tr><td>${kbd('F')}</td><td>entrar e sair da tela cheia</td></tr>
        <tr><td>${kbd('Esc')}</td><td>fechar painéis e sair da tela cheia</td></tr>
      </tbody>
    </table>`],
  ['progresso', 'Onde fica o seu progresso', `
    <p>As respostas ficam salvas só neste navegador, sem cadastro. Elas somem se você limpar os dados de navegação ou usar uma janela anônima.</p>
    <p>Para continuar em outro aparelho, use <b>↓ Exportar progresso</b>, no fim da tela inicial, e depois <b>↑ Importar</b> no outro navegador. Importar troca o progresso de lá pelo do arquivo.</p>`],
];

export function telaAjuda(secao) {
  document.title = 'Ajuda · Ponto de Partida';
  app.innerHTML = `<div class="app">
    ${cabecalhoPagina('Ajuda', '#/', 'Voltar às provas', 'ajuda')}
    <main id="conteudo" class="conteudo sobre ajuda">
      <div class="sobre__cabeca">
        <h1 class="sobre__titulo" tabindex="-1">Como usar o Ponto de Partida</h1>
        <p class="sobre__intro">Tudo o que o app faz, num lugar só. Se a dúvida não estiver aqui, <a href="#/sobre/contato">escreva para o contato</a>.</p>
      </div>
      <nav class="ajuda__sumario" aria-label="Assuntos da ajuda">
        ${AJUDA.map(([id, rotulo]) => `<a class="ajuda__assunto" href="#/ajuda/${id}">${rotulo}</a>`).join('')}
      </nav>
      <div class="grupo">
        ${AJUDA.map(([id, rotulo, html]) => `<section class="sobre__bloco" id="ajuda-${id}" aria-labelledby="ajuda-${id}-titulo">
          <h2 class="rotulo" id="ajuda-${id}-titulo">${rotulo}</h2>
          <div class="sobre__texto">${html}</div>
        </section>`).join('')}
      </div>
    </main>
    ${rodape()}
  </div>`;
  irParaBloco('ajuda-' + secao, secao);
}

// ---------- Fixar colunas que cabem na tela ----------

export function ajustarFixos() {
  document.querySelectorAll('.fixa-se-couber').forEach(el => {
    el.classList.remove('fixa');
    if (!ehCelular() && el.offsetHeight < window.innerHeight - 48) el.classList.add('fixa');
  });
}
let tempoResize;
window.addEventListener('resize', () => {
  clearTimeout(tempoResize);
  tempoResize = setTimeout(() => {
    if (estado.telaCheia && ehCelular()) return sairTelaCheia();
    ajustarFixos();
    agendarAjuste();
  }, 150);
});
