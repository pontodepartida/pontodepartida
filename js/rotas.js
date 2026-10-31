import { sessao } from './armazenamento.js?v=2026-10-30';
import { app, dialogo, zoom, painelMapa, explicacoes, painelTema, estado, esc, limparAnuncio, descartarPaineis, depoisDosPaineis, carregarProva, guardarImagens, carregarTeorias, lerProgresso, primeiraSemResposta, lerAndamento, lerResultadoSimulado } from './base.js';
import { telaQuestaoAtiva, sairTelaCheia, prepararAjuste, cabecalhoInicio, rodape, telaSobre, telaAjuda, ajustarFixos } from './interface.js';
import { telaInicio } from './inicio.js';
import { telaQuestao } from './questao.js';
import { telaResultado, telaSimulado, avisoTempo, telaResultadoSimulado } from './simulado.js';
import { telaTeoria, telaTema } from './teoria.js';
import { telaPdfs } from './pdfs.js';

// ---------- Rotas ----------

export function lerRota() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const partes = h.split('/').filter(Boolean);
  if (!partes.length) return { tela: 'inicio' };
  if (partes[0] === 'sobre') return { tela: 'sobre', secao: partes[1] || null };
  if (partes[0] === 'ajuda') return { tela: 'ajuda', secao: partes[1] || null };
  if (partes[0] === 'teoria') return partes[1] ? { tela: 'tema', tema: partes[1] } : { tela: 'teoria' };
  if (partes[0] === 'pdfs') return { tela: 'pdfs' };
  const [id, a, b, c] = partes;
  if (!a) return { tela: 'continuar', id };
  if (a === 'simulado') {
    if (!b) return { tela: 'sim-inicio', id };
    if (b === 'resultado') return { tela: 'sim-resultado', id };
    if (b === 'revisao') return { tela: 'sim-revisao', id, n: Number(c) };
    return { tela: 'sim-questao', id, n: Number(b) };
  }
  if (a === 'resultado') return { tela: 'resultado', id };
  if (a === 'revisao') return { tela: 'revisao', id, n: Number(b) };
  return { tela: 'questao', id, n: Number(a) };
}

export function ir(hash) {
  depoisDosPaineis(() => {
    if (location.hash === hash) render();
    else location.hash = hash;
  });
}

export async function render(opcoes = {}) {
  const rota = lerRota();
  const mudouTela = JSON.stringify(rota) !== JSON.stringify(estado.rota);
  estado.rota = rota;
  if (mudouTela) {
    limparAnuncio();
    descartarPaineis();
    if (zoom.open) zoom.close();
    if (dialogo.open) dialogo.close();
  }
  if (painelMapa.open) painelMapa.close();
  if (painelTema.open) painelTema.close();
  if (explicacoes.open) explicacoes.close();
  if (estado.telaCheia && !telaQuestaoAtiva()) sairTelaCheia({ renderizar: false });
  if (mudouTela) estado.letraAberta = false;
  if (rota.tela !== 'sim-questao') avisoTempo.hidden = true;

  if (rota.tela !== 'teoria' && rota.tela !== 'tema') sessao.apagar('busca-teoria');
  try {
    if (rota.tela === 'inicio') await telaInicio();
    else if (rota.tela === 'sobre') telaSobre(rota.secao);
    else if (rota.tela === 'ajuda') telaAjuda(rota.secao);
    else if (rota.tela === 'teoria') await telaTeoria();
    else if (rota.tela === 'tema') await telaTema(rota.tema);
    else if (rota.tela === 'pdfs') await telaPdfs();
    else {
      const prova = await carregarProva(rota.id);
      if (!prova) return telaErro('Prova não encontrada.');
      guardarImagens(prova);
      if (rota.tela === 'continuar') {
        const prog = lerProgresso(prova.id);
        const n = primeiraSemResposta(prova, prog);
        return void location.replace(n ? `#/${prova.id}/${n}` : `#/${prova.id}/resultado`);
      }
      if (rota.tela === 'sim-inicio') {
        const a = lerAndamento(prova.id);
        return void location.replace(a ? `#/${prova.id}/simulado/${primeiraSemResposta(prova, a) || prova.questoes[0].numero}` : '#/');
      }
      if (rota.tela === 'resultado') await telaResultado(prova);
      else if (rota.tela === 'sim-resultado') { if (!await telaResultadoSimulado(prova)) return; }
      else {
        const q = prova.questoes.find(q => q.numero === rota.n);
        if (!q) return telaErro('Questão não encontrada.');
        if (rota.tela === 'sim-questao') {
          if (!telaSimulado(prova, q)) return;
        } else {
          if (rota.tela === 'sim-revisao' && !lerResultadoSimulado(prova.id)) return void location.replace('#/');
          await carregarTeorias(q.teoria);
          telaQuestao(prova, q, rota.tela !== 'questao');
        }
      }
    }
  } catch (e) {
    console.error(e);
    return telaErro(e.message || 'Algo deu errado ao carregar.');
  }
  if (mudouTela && !opcoes.manterRolagem) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const h1 = app.querySelector('h1:not([hidden])');
    if (h1 && estado.rotaAnteriorExiste) h1.focus({ preventScroll: true });
  }
  estado.rotaAnteriorExiste = true;
  ajustarFixos();
  prepararAjuste();
}

export function telaErro(msg) {
  app.innerHTML = `<div class="app">${cabecalhoInicio()}<main id="conteudo" class="conteudo">
    <div class="erro-carga"><p>${esc(msg)}</p><p><a href="#/">Voltar às provas</a></p></div></main>${rodape()}</div>`;
}
