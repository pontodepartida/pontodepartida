import { armazenamento, sessao } from './armazenamento.js?v=2026-10-30';
import { app, dialogo, painelMapa, zoom, explicacoes, painelTema, estado, ehCelular, anunciar, formatarTempo, dataCurta, paraRevisar, lerAndamento, tempoRestante, fonte, abrirDialogo, abrirZoom, depoisDosPaineis, temPaineis } from './base.js';
import { abrirLetra, fecharLetra, telaQuestaoAtiva, entrarTelaCheia, sairTelaCheia, agendarAjuste, ajustarFixos } from './interface.js';
import { lerRota, ir, render } from './rotas.js';
import { abrirBoasVindas } from './inicio.js';
import { abrirPainelMapa, abrirTema, abrirExplicacoes, selecionar, confirmar, voltarAoTexto } from './questao.js';
import { terminar, recomecar, comecarSimulado, marcarParaRevisar, confirmarSaidaSimulado, fecharAvisoTempo } from './simulado.js';
import { trocarAbaTeoria } from './teoria.js';

// ---------- Exportar e importar o progresso ----------

const CHAVE_PROGRESSO = /^(prova|simulado|letra):/;

function exportarProgresso() {
  const dados = {};
  for (const k of armazenamento.chaves()) {
    if (CHAVE_PROGRESSO.test(k)) dados[k] = armazenamento.ler(k);
  }
  const arquivo = { app: 'ponto-de-partida', versao: 1, exportadoEm: new Date().toISOString(), dados };
  const url = URL.createObjectURL(new Blob([JSON.stringify(arquivo, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `ponto-de-partida-progresso-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  anunciar('Arquivo de progresso baixado.');
}

const seletorArquivo = document.createElement('input');
seletorArquivo.type = 'file';
seletorArquivo.accept = '.json,application/json';
seletorArquivo.hidden = true;
document.body.appendChild(seletorArquivo);

function importarProgresso() {
  seletorArquivo.value = '';
  seletorArquivo.click();
}

function lerArquivoProgresso(texto) {
  let j;
  try { j = JSON.parse(texto); } catch (e) { return null; }
  if (!j || j.app !== 'ponto-de-partida' || !j.dados || typeof j.dados !== 'object') return null;
  const itens = Object.entries(j.dados).filter(([k, v]) => {
    if (!CHAVE_PROGRESSO.test(k) || typeof v !== 'string') return false;
    if (k.startsWith('letra:')) return true;
    try { const o = JSON.parse(v); return !!o && typeof o.respostas === 'object'; } catch (e) { return false; }
  });
  return { itens, exportadoEm: Date.parse(j.exportadoEm) || null };
}

seletorArquivo.addEventListener('change', async () => {
  const arq = seletorArquivo.files && seletorArquivo.files[0];
  if (!arq) return;
  const lido = lerArquivoProgresso(await arq.text());
  if (!lido) {
    return abrirDialogo({
      titulo: 'Arquivo não reconhecido',
      texto: 'Este arquivo não é um progresso exportado do Ponto de Partida.',
      acoes: [{ rotulo: 'Fechar', classe: 'botao--primario', seguro: true }],
    });
  }
  const nProvas = lido.itens.filter(([k]) => k.startsWith('prova:')).length;
  const nSim = lido.itens.filter(([k]) => k.startsWith('simulado:')).length;
  const conta = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
  abrirDialogo({
    titulo: 'Importar progresso?',
    texto: `O arquivo${lido.exportadoEm ? `, exportado em ${dataCurta(lido.exportadoEm)},` : ''} tem respostas de ${conta(nProvas, 'prova', 'provas')} e ${conta(nSim, 'simulado', 'simulados')}. O progresso salvo neste navegador será trocado pelo do arquivo. Não dá para desfazer.`,
    alerta: true,
    acoes: [
      { rotulo: 'Cancelar', classe: 'botao--secundario', seguro: true },
      { rotulo: 'Importar', classe: 'botao--primario', acao: () => {
        for (const k of armazenamento.chaves()) if (CHAVE_PROGRESSO.test(k)) armazenamento.apagar(k);
        for (const [k, v] of lido.itens) armazenamento.gravar(k, v);
        render({ manterRolagem: true });
        anunciar('Progresso importado.');
      } },
    ],
  });
});

// ---------- Eventos ----------

document.addEventListener('click', (e) => {
  if (!temPaineis() || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  e.preventDefault();
  const destino = link.getAttribute('href');
  depoisDosPaineis(() => { location.hash = destino; });
}, true);

document.addEventListener('click', (e) => {
  if (estado.letraAberta && !e.target.closest('.letra')) fecharLetra();
  const alvo = e.target.closest('[data-acao], .alt[role="radio"], .figura__botao');
  if (!alvo) return;
  if (alvo.matches('.alt[role="radio"]')) return selecionar(alvo.dataset.letra);
  if (alvo.matches('.figura__botao')) return abrirZoom(alvo.dataset.zoom, alvo.dataset.alt);
  switch (alvo.dataset.acao) {
    case 'ordem': {
      armazenamento.gravar('ordem-provas', alvo.dataset.ordem);
      return render({ manterRolagem: true });
    }
    case 'modo': {
      armazenamento.gravar('modo-provas', alvo.dataset.modo);
      return render({ manterRolagem: true }).then(() => {
        const b = app.querySelector(`[data-acao="modo"][data-modo="${alvo.dataset.modo}"]`);
        if (b) b.focus({ preventScroll: true });
      });
    }
    case 'comecar-simulado': {
      e.preventDefault();
      return comecarSimulado(alvo.dataset.id);
    }
    case 'marcar': return marcarParaRevisar();
    case 'alternar-cronometro': {
      const oculto = sessao.ler('cronometro-oculto') !== '1';
      sessao.gravar('cronometro-oculto', oculto ? '1' : '0');
      const a = estado.rota && lerAndamento(estado.rota.id);
      document.querySelectorAll('.cronometro').forEach(el => {
        el.classList.toggle('cronometro--oculto', oculto);
        el.querySelector('[data-cronometro]').textContent = oculto ? 'tempo oculto' : a ? formatarTempo(tempoRestante(a)) : '';
        el.querySelector('.cronometro__alternar').textContent = oculto ? 'mostrar' : 'ocultar';
      });
      return agendarAjuste();
    }
    case 'fechar-aviso-tempo': return fecharAvisoTempo();
    case 'letra': {
      if (estado.letraAberta) return fecharLetra();
      abrirLetra(alvo);
      const sel = app.querySelector('.letra__opcao[aria-pressed="true"]');
      if (sel) sel.focus();
      return;
    }
    case 'tamanho': {
      armazenamento.gravar('letra:' + estado.rota.id, alvo.dataset.tamanho);
      estado.letraAberta = true;
      return render({ manterRolagem: true }).then(() => {
        const b = app.querySelector(`.letra__opcao[data-tamanho="${alvo.dataset.tamanho}"]`);
        if (b) b.focus({ preventScroll: true });
      });
    }
    case 'aba-teoria': return trocarAbaTeoria(alvo.dataset.materia);
    case 'ir-secao': {
      const titulo = document.getElementById(alvo.dataset.secao);
      if (!titulo) return;
      const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      titulo.scrollIntoView({ behavior: suave ? 'smooth' : 'instant', block: 'start' });
      return titulo.focus({ preventScroll: true });
    }
    case 'voltar-texto': return voltarAoTexto();
    case 'fechar-dica': {
      armazenamento.gravar('dica:' + alvo.dataset.dica, '1');
      alvo.closest('.dica').remove();
      return ajustarFixos();
    }
    case 'exportar': return exportarProgresso();
    case 'importar': return importarProgresso();
    case 'tela-cheia': return entrarTelaCheia();
    case 'sair-tela-cheia': return sairTelaCheia();
    case 'explicacoes': return abrirExplicacoes();
    case 'fechar-explicacoes': return explicacoes.close();
    case 'abrir-tema': return abrirTema(alvo.dataset.tema, alvo);
    case 'fechar-tema': return painelTema.close();
    case 'confirmar': return confirmar();
    case 'terminar': return terminar();
    case 'recomecar': return recomecar(alvo.dataset.id);
    case 'abrir-mapa': return abrirPainelMapa();
    case 'fechar-mapa': return painelMapa.close();
    case 'fechar-zoom': return zoom.close();
    case 'ver-todas': {
      alvo.closest('.revisar').classList.remove('revisar--recolhido');
      alvo.remove();
      return;
    }
    case 'secao': {
      const id = alvo.dataset.secao;
      const aberta = alvo.getAttribute('aria-expanded') !== 'true';
      alvo.setAttribute('aria-expanded', String(aberta));
      alvo.querySelector('.secao__seta').textContent = aberta ? '▴' : '▾';
      document.getElementById('secao-' + id).hidden = !aberta;
      sessao.gravar('secao-' + id, aberta ? '1' : '0');
      return ajustarFixos();
    }
  }
});

painelMapa.addEventListener('click', (e) => {
  if (e.target.closest('.celula')) painelMapa.close();
});

dialogo.addEventListener('click', (e) => {
  if (e.target.closest('a[href^="#"]')) dialogo.close();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && estado.letraAberta) {
    e.preventDefault();
    fecharLetra();
    const b = app.querySelector('[data-acao="letra"]');
    if (b) b.focus();
    return;
  }
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  if (dialogo.open || painelMapa.open || zoom.open || explicacoes.open || painelTema.open) return;
  const alvo = e.target;
  if (alvo.closest && alvo.closest('input, textarea, select, [contenteditable="true"], .interativo, .letra')) return;
  const rota = estado.rota;
  if (!telaQuestaoAtiva()) return;
  const prova = estado.provas.get(rota.id);
  if (!prova) return;
  const pergunta = !!app.querySelector('.alt[role="radio"]');
  const tecla = e.key;

  if (tecla === 'f' || tecla === 'F') {
    if (ehCelular()) return;
    e.preventDefault();
    return estado.telaCheia ? sairTelaCheia() : entrarTelaCheia();
  }
  if (tecla === 'Escape' && estado.telaCheia) {
    e.preventDefault();
    return sairTelaCheia();
  }

  if (pergunta && /^[a-eA-E]$/.test(tecla)) {
    e.preventDefault();
    const letra = tecla.toUpperCase();
    selecionar(letra);
    const b = app.querySelector(`.alt[data-letra="${letra}"]`);
    if (b) b.focus();
    return;
  }
  if (pergunta && (tecla === 'ArrowUp' || tecla === 'ArrowDown') && alvo.matches && alvo.matches('.alt[role="radio"]')) {
    e.preventDefault();
    const botoes = [...app.querySelectorAll('.alt[role="radio"]')];
    const i = botoes.indexOf(alvo);
    const novo = botoes[(i + (tecla === 'ArrowDown' ? 1 : -1) + botoes.length) % botoes.length];
    selecionar(novo.dataset.letra);
    novo.focus();
    return;
  }
  const naAlternativa = alvo.matches && alvo.matches('.alt[role="radio"]');
  if (pergunta && naAlternativa && tecla === ' ') {
    e.preventDefault();
    selecionar(alvo.dataset.letra);
    return;
  }
  if (pergunta && tecla === 'Enter') {
    if (naAlternativa && (!estado.selecao || estado.selecao.letra !== alvo.dataset.letra)) {
      e.preventDefault();
      selecionar(alvo.dataset.letra);
      return;
    }
    const ehOutroControle = !naAlternativa && alvo.closest && alvo.closest('a, button, summary');
    if (ehOutroControle) return;
    if (estado.selecao) { e.preventDefault(); confirmar(); }
    return;
  }
  if (tecla === 'ArrowLeft' || tecla === 'ArrowRight') {
    const dir = tecla === 'ArrowRight' ? 1 : -1;
    if (rota.tela === 'revisao' || rota.tela === 'sim-revisao') {
      const f = fonte(prova);
      const lista = paraRevisar(prova, f.prog);
      const pos = lista.findIndex(x => x.numero === rota.n);
      const dest = lista[pos + dir];
      if (pos >= 0 && dest) { e.preventDefault(); ir(`${f.base}/revisao/${dest.numero}`); }
    } else {
      const base = rota.tela === 'sim-questao' ? `#/${prova.id}/simulado` : `#/${prova.id}`;
      const idx = prova.questoes.findIndex(x => x.numero === rota.n);
      const dest = prova.questoes[idx + dir];
      if (dest) { e.preventDefault(); ir(`${base}/${dest.numero}`); }
    }
  }
});

window.addEventListener('hashchange', (e) => {
  const antes = estado.rota;
  if (antes && antes.tela === 'sim-questao' && lerAndamento(antes.id)) {
    const depois = lerRota();
    const fica = depois.id === antes.id && (depois.tela === 'sim-questao' || depois.tela === 'sim-resultado');
    if (!fica) {
      const destino = location.hash || '#/';
      history.replaceState(null, '', e.oldURL);
      return confirmarSaidaSimulado(antes.id, destino);
    }
  }
  render();
});

window.addEventListener('beforeunload', (e) => {
  const rota = estado.rota;
  if (rota && rota.tela === 'sim-questao' && lerAndamento(rota.id)) {
    e.preventDefault();
    e.returnValue = '';
  }
});
render().then(() => {
  if (!armazenamento.ler('boas-vindas') && !dialogo.open) abrirBoasVindas();
});
