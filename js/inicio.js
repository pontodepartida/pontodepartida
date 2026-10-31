import { armazenamento } from './armazenamento.js?v=2026-10-30';
import { app, dialogo, esc, pct, formatarTempo, dataCurta, carregarCatalogo, carregarProva, idsTeoria, carregarFrases, htmlFrase, lerProgresso, resumo, primeiraSemResposta, lerResultadoSimulado } from './base.js';
import { cabecalhoInicio, rodape } from './interface.js';

// ---------- Início ----------

export async function telaInicio() {
  const cat = await carregarCatalogo();
  const frases = await carregarFrases();
  const provas = (await Promise.all(cat.map(p => carregarProva(p.id).catch(() => null)))).filter(Boolean);
  document.title = 'Ponto de Partida';

  const infos = provas.map(p => {
    const prog = lerProgresso(p.id);
    const r = resumo(p, prog);
    let status = 'nova';
    if (prog.terminada) status = 'concluida';
    else if (r.respondidas > 0) status = 'andamento';
    return { prova: p, prog, r, status };
  });

  const recentes = (st) => infos.filter(i => i.status === st).sort((a, b) => b.prog.atualizadoEm - a.prog.atualizadoEm);
  const destaque = recentes('andamento')[0] || recentes('concluida')[0] || null;
  const ordem = armazenamento.ler('ordem-provas') === 'antigas' ? 'antigas' : 'recentes';
  const modo = armazenamento.ler('modo-provas') === 'simulado' ? 'simulado' : 'estudar';
  const outras = ordenarProvas(modo === 'simulado' ? infos : infos.filter(i => i !== destaque), ordem);
  const titulo = destaque ? 'Suas provas' : 'Escolha uma prova';

  const chip = (i) => i.status === 'concluida'
    ? `<span class="etiqueta etiqueta--pequena etiqueta--ok">✓ Concluída</span>`
    : i.status === 'andamento'
      ? `<span class="etiqueta etiqueta--pequena etiqueta--neutra">Em andamento</span>`
      : `<span class="etiqueta etiqueta--pequena etiqueta--neutra">Não iniciada</span>`;

  const meta = (i) => i.status === 'nova'
    ? `0 de ${i.r.total} respondidas`
    : `${i.r.respondidas} de ${i.r.total} · ${i.r.acertos} ${i.r.acertos === 1 ? 'acerto' : 'acertos'}`;

  let htmlDestaque = '';
  if (destaque) {
    const d = destaque;
    const n = primeiraSemResposta(d.prova, d.prog);
    let acao;
    if (d.status === 'concluida' || !n) acao = `<a class="botao botao--primario botao--largo" href="#/${d.prova.id}/resultado">Ver resultado</a>`;
    else acao = `<a class="botao botao--primario botao--largo" href="#/${d.prova.id}/${n}">Continuar na questão ${n}</a>`;
    const etiqueta = d.status === 'concluida' ? '✓ Concluída' : d.status === 'andamento' ? 'Em andamento' : 'Não iniciada';
    htmlDestaque = `<section class="cartao destaque" aria-label="${esc(d.prova.nome)}">
      <div class="destaque__info">
        <div><span class="etiqueta${d.status === 'concluida' ? ' etiqueta--ok' : ''}">${etiqueta}</span></div>
        <h2 class="destaque__nome">${esc(d.prova.nome)}</h2>
        <div class="barra" role="progressbar" aria-label="Questões respondidas" aria-valuenow="${d.r.respondidas}" aria-valuemin="0" aria-valuemax="${d.r.total}"><div style="width:${pct(d.r.respondidas, d.r.total)}%"></div></div>
        <div class="destaque__numeros">
          <span>${d.r.respondidas} de ${d.r.total} respondidas</span>
          ${d.r.respondidas ? `<span class="txt-certo"><span aria-hidden="true">✓</span> ${d.r.acertos}<span class="so-computador"> ${d.r.acertos === 1 ? 'acerto' : 'acertos'}</span><span class="visualmente-oculto so-celular"> acertos</span></span>
          <span class="txt-erro"><span aria-hidden="true">✕</span> ${d.r.erros}<span class="so-computador"> ${d.r.erros === 1 ? 'erro' : 'erros'}</span><span class="visualmente-oculto so-celular"> erros</span></span>` : ''}
        </div>
      </div>
      <div class="destaque__acoes">
        ${acao}
        ${d.status !== 'nova' ? `<button type="button" class="link-botao" data-acao="recomecar" data-id="${d.prova.id}">Recomeçar</button>` : ''}
      </div>
    </section>`;
  }

  const cartaoSimulado = (i) => {
    const id = i.prova.id;
    const res = lerResultadoSimulado(id);
    const rr = res && resumo(i.prova, res);
    const nome = res
      ? `<a href="#/${id}/simulado/resultado">${esc(i.prova.nome)}</a>`
      : `<a href="#/${id}/simulado" data-acao="comecar-simulado" data-id="${id}">${esc(i.prova.nome)}</a>`;
    return `<article class="cartao cartao-prova">
      <div class="cartao-prova__topo">
        <h3 class="cartao-prova__nome">${nome}</h3>
        <span class="cartao-prova__seta" aria-hidden="true">›</span>
      </div>
      <div><span class="etiqueta etiqueta--pequena etiqueta--neutra">${res ? `Feito em ${dataCurta(res.feitoEm)} · ${rr.acertos} de ${rr.total}` : 'Nunca feito'}</span></div>
      <div class="barra barra--8" role="progressbar" aria-label="Acertos no último simulado" aria-valuenow="${res ? rr.acertos : 0}" aria-valuemin="0" aria-valuemax="${i.r.total}"><div style="width:${res ? pct(rr.acertos, rr.total) : 0}%"></div></div>
      <div class="cartao-prova__rodape">
        <span class="cartao-prova__meta">${res ? `Tempo usado: ${formatarTempo(res.tempoUsado, false)}` : `3h · ${i.r.total} questões`}</span>
        ${res
          ? `<a class="link-botao" href="#/${id}/simulado/resultado">Ver resultado</a>`
          : `<button type="button" class="link-botao" data-acao="comecar-simulado" data-id="${id}">Começar simulado</button>`}
      </div>
    </article>`;
  };

  const htmlOutras = modo === 'simulado' ? outras.map(cartaoSimulado).join('') : outras.map(i => `<article class="cartao cartao-prova">
      <div class="cartao-prova__topo">
        <h3 class="cartao-prova__nome"><a href="#/${i.prova.id}">${esc(i.prova.nome)}</a></h3>
        <span class="cartao-prova__seta" aria-hidden="true">›</span>
      </div>
      <div>${chip(i)}</div>
      <div class="barra barra--8" role="progressbar" aria-label="Questões respondidas" aria-valuenow="${i.r.respondidas}" aria-valuemin="0" aria-valuemax="${i.r.total}"><div style="width:${pct(i.r.respondidas, i.r.total)}%"></div></div>
      <div class="cartao-prova__rodape">
        <span class="cartao-prova__meta">${meta(i)}</span>
        ${i.status !== 'nova' ? `<button type="button" class="link-botao so-computador" data-acao="recomecar" data-id="${i.prova.id}">Recomeçar</button>` : ''}
      </div>
    </article>`).join('');

  const acoesProgresso = `<div class="aviso-salvo__acoes">
      <button type="button" class="botao botao--secundario botao--pequeno" data-acao="exportar"><span aria-hidden="true">↓</span> Exportar progresso</button>
      <button type="button" class="botao botao--secundario botao--pequeno" data-acao="importar"><span aria-hidden="true">↑</span> Importar</button>
    </div>`;
  let avisoSalvo;
  if (!armazenamento.disponivel || armazenamento.falhouAoGravar) {
    avisoSalvo = `<div class="aviso-salvo aviso-salvo--alerta" role="alert">
      <b>Seu progresso não está sendo salvo.</b>
      <span>Este navegador bloqueou o armazenamento (pode ser uma janela anônima ou uma configuração de privacidade). Você pode estudar normalmente, mas as respostas somem quando esta aba for fechada ou recarregada. Antes de sair, exporte o progresso para não perder. <a href="#/sobre/privacidade">Saiba mais</a></span>
    </div>${acoesProgresso}`;
  } else {
    avisoSalvo = `<div class="aviso-salvo aviso-salvo--com-acoes">
      <div class="aviso-salvo__textos">
        <span>Seu progresso fica salvo neste navegador. Para continuar em outro navegador ou aparelho, exporte um arquivo aqui e importe lá.</span>
        <span>Ele também pode ser perdido se você limpar os dados de navegação, usar uma janela anônima ou se o navegador apagar dados de sites pouco usados. <a href="#/sobre/privacidade">Saiba mais</a></span>
      </div>
      ${acoesProgresso}
    </div>`;
  }

  const notaModo = modo === 'simulado'
    ? 'No simulado, cada prova tem 3 horas e o gabarito só aparece no final. O progresso do modo estudo não é afetado.'
    : 'Sem tempo. A explicação aparece logo depois de cada resposta.';

  app.innerHTML = `<div class="app">
    ${cabecalhoInicio(titulo, idsTeoria(provas).length)}
    <main id="conteudo" class="conteudo inicio">
      ${htmlFrase(frases && frases.destaque, destaque ? 'citacao--destaque' : 'citacao--destaque citacao--primeira')}
      <div class="inicio__cabeca">
        <h1 class="inicio__titulo" tabindex="-1">${titulo}</h1>
      </div>
      ${htmlDestaque}
      ${outras.length ? `<div class="lista-provas__topo">
        <div class="lista-provas__esq">
          ${destaque ? `<h2 class="rotulo" style="margin:0"><span class="so-computador">Todas as provas</span><span class="so-celular">${modo === 'simulado' ? 'Todas as provas' : 'Outras provas'}</span></h2>` : ''}
          <div class="modo" role="group" aria-label="Como fazer as provas">
            <button type="button" class="modo__opcao" data-acao="modo" data-modo="estudar" aria-pressed="${modo === 'estudar'}">Estudar</button>
            <button type="button" class="modo__opcao" data-acao="modo" data-modo="simulado" aria-pressed="${modo === 'simulado'}"><span aria-hidden="true">◷</span> Simulado</button>
          </div>
        </div>
        ${outras.length > 1 ? `<div class="ordem" role="group" aria-label="Ordenar provas por ano">
          <span class="ordem__rotulo">Ordenar por ano:</span>
          <button type="button" class="ordem__opcao" data-acao="ordem" data-ordem="recentes" aria-pressed="${ordem === 'recentes'}">Mais recentes</button>
          <button type="button" class="ordem__opcao" data-acao="ordem" data-ordem="antigas" aria-pressed="${ordem === 'antigas'}">Mais antigas</button>
        </div>` : ''}
      </div>
      <p class="lista-provas__nota">${notaModo}</p>
      <div class="grade-provas">${htmlOutras}</div>` : ''}
      ${avisoSalvo}
    </main>
    ${rodape()}
  </div>`;
}

function chaveProva(id) {
  const m = /(\d{4})-(\d)(?:-([a-z]))?/.exec(id) || [];
  return { periodo: Number(m[1] || 0) * 10 + Number(m[2] || 0), letra: m[3] || '' };
}

function ordenarProvas(infos, ordem) {
  const sinal = ordem === 'antigas' ? 1 : -1;
  return [...infos].sort((a, b) => {
    const ka = chaveProva(a.prova.id), kb = chaveProva(b.prova.id);
    return (ka.periodo - kb.periodo) * sinal || ka.letra.localeCompare(kb.letra);
  });
}

// ---------- Passo a passo (boas-vindas e primeiro simulado) ----------
export function abrirPassos({ passos, rotulo = '', concluir = 'Começar', aoConcluir, aoFechar }, passo = 0) {
  const [titulo, texto] = passos[passo];
  const ultimo = passo === passos.length - 1;
  const secundario = !ultimo ? 'Pular' : aoConcluir ? 'Cancelar' : '';
  dialogo.setAttribute('role', 'dialog');
  dialogo.setAttribute('aria-labelledby', 'dialogo-titulo');
  dialogo.setAttribute('aria-describedby', 'dialogo-texto');
  dialogo.innerHTML = `<p class="boas-vindas__passo">${rotulo ? `${esc(rotulo)} · ` : ''}${passo + 1} de ${passos.length}</p>
    <div class="boas-vindas__pontos" aria-hidden="true">${passos.map((_, i) => `<span${i <= passo ? ' class="feito"' : ''}></span>`).join('')}</div>
    <h2 class="dialogo__titulo" id="dialogo-titulo">${titulo}</h2>
    <p class="dialogo__texto" id="dialogo-texto">${texto}</p>
    <div class="dialogo__acoes">
      ${secundario ? `<button type="button" class="botao botao--secundario" data-bv="pular">${secundario}</button>` : ''}
      <button type="button" class="botao botao--primario" data-bv="seguir">${ultimo ? concluir : 'Próximo'}</button>
    </div>`;
  dialogo.querySelector('[data-bv="seguir"]').addEventListener('click', () => {
    if (!ultimo) return abrirPassos({ passos, rotulo, concluir, aoConcluir, aoFechar }, passo + 1);
    dialogo.close();
    if (aoConcluir) aoConcluir();
  });
  const pular = dialogo.querySelector('[data-bv="pular"]');
  if (pular) pular.addEventListener('click', () => dialogo.close());
  if (!dialogo.open) {
    if (aoFechar) dialogo.addEventListener('close', aoFechar, { once: true });
    dialogo.showModal();
  }
  dialogo.querySelector('[data-bv="seguir"]').focus();
}

const BOAS_VINDAS = [
  ['Boas-vindas ao Ponto de Partida', 'Aqui você treina com provas antigas do processo seletivo do IFSP, uma questão por vez.'],
  ['Como funciona', 'Escolha uma alternativa e confirme. Depois, veja o passo a passo da resolução, por que as outras estão erradas e a teoria. Para treinar com tempo, use o modo Simulado.'],
  ['Seu progresso', 'Suas respostas ficam salvas só neste navegador, sem cadastro. Ficou com dúvida em algum botão? A Ajuda fica no rodapé de todas as telas.'],
];

export function abrirBoasVindas() {
  abrirPassos({ passos: BOAS_VINDAS, aoFechar: () => armazenamento.gravar('boas-vindas', '1') });
}
