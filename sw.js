const VERSAO = '06fcbc792489';
const ESSENCIAIS = [
  'css/estilo.css',
  'dados/frases.json',
  'dados/pdfs.json',
  'dados/provas.json',
  'dados/ps-2022-1-a.json',
  'dados/ps-2022-1-b.json',
  'dados/ps-2023-1-a.json',
  'dados/ps-2023-1-b.json',
  'dados/ps-2024-1-a.json',
  'dados/ps-2024-1-b.json',
  'dados/ps-2025-1-a.json',
  'dados/ps-2025-1-b.json',
  'dados/ps-2026-1.json',
  'dados/temas.json',
  'dados/teoria/adjunto-adnominal.json',
  'dados/teoria/adverbios.json',
  'dados/teoria/ambiguidade.json',
  'dados/teoria/angulos-e-paralelas.json',
  'dados/teoria/areas-de-figuras-planas.json',
  'dados/teoria/aumentos-e-descontos-sucessivos.json',
  'dados/teoria/carta-formal.json',
  'dados/teoria/circulo-e-circunferencia.json',
  'dados/teoria/classes-de-palavras.json',
  'dados/teoria/coesao-referencial.json',
  'dados/teoria/colocacao-pronominal.json',
  'dados/teoria/combinacoes.json',
  'dados/teoria/comparacao-entre-textos.json',
  'dados/teoria/concordancia-nominal.json',
  'dados/teoria/concordancia-verbal.json',
  'dados/teoria/conectivos.json',
  'dados/teoria/congruencia-de-triangulos.json',
  'dados/teoria/conversao-de-unidades.json',
  'dados/teoria/crase.json',
  'dados/teoria/discurso-direto-e-indireto.json',
  'dados/teoria/divisibilidade-e-fatoracao.json',
  'dados/teoria/divulgacao-cientifica.json',
  'dados/teoria/dizimas-periodicas.json',
  'dados/teoria/elementos-da-narrativa.json',
  'dados/teoria/equacoes-do-1o-grau.json',
  'dados/teoria/equacoes-do-2o-grau.json',
  'dados/teoria/estrategias-argumentativas.json',
  'dados/teoria/expressoes-algebricas.json',
  'dados/teoria/expressoes-numericas.json',
  'dados/teoria/fato-e-opiniao.json',
  'dados/teoria/figuras-sonoras.json',
  'dados/teoria/formacao-de-palavras.json',
  'dados/teoria/fracoes.json',
  'dados/teoria/funcao-afim.json',
  'dados/teoria/generos-textuais.json',
  'dados/teoria/graficos.json',
  'dados/teoria/grandezas-proporcionais.json',
  'dados/teoria/hifen.json',
  'dados/teoria/infograficos.json',
  'dados/teoria/intertextualidade.json',
  'dados/teoria/ironia-e-humor.json',
  'dados/teoria/linguagem-verbal-e-nao-verbal.json',
  'dados/teoria/lugares-geometricos.json',
  'dados/teoria/media-mediana-e-moda.json',
  'dados/teoria/metafora-e-comparacao.json',
  'dados/teoria/modalizacao.json',
  'dados/teoria/notacao-cientifica.json',
  'dados/teoria/noticia-e-lide.json',
  'dados/teoria/oracoes-coordenadas.json',
  'dados/teoria/oracoes-subordinadas.json',
  'dados/teoria/perimetro.json',
  'dados/teoria/pesquisa-estatistica.json',
  'dados/teoria/plano-cartesiano.json',
  'dados/teoria/poesia.json',
  'dados/teoria/pontuacao.json',
  'dados/teoria/porcentagem.json',
  'dados/teoria/principio-multiplicativo.json',
  'dados/teoria/probabilidade.json',
  'dados/teoria/problemas-de-logica.json',
  'dados/teoria/progressao-geometrica.json',
  'dados/teoria/pronomes.json',
  'dados/teoria/propriedades-de-potencias.json',
  'dados/teoria/quadrilateros.json',
  'dados/teoria/raizes-e-radicais.json',
  'dados/teoria/razoes-especiais.json',
  'dados/teoria/regencia-nominal.json',
  'dados/teoria/regencia-verbal.json',
  'dados/teoria/repeticao-e-paralelismo.json',
  'dados/teoria/resenha-critica.json',
  'dados/teoria/semelhanca-de-triangulos.json',
  'dados/teoria/sentido-pelo-contexto.json',
  'dados/teoria/sequencias.json',
  'dados/teoria/sistemas-de-equacoes.json',
  'dados/teoria/sujeito-e-predicado.json',
  'dados/teoria/tabelas.json',
  'dados/teoria/tema-e-ideia-central.json',
  'dados/teoria/tempos-e-modos-verbais.json',
  'dados/teoria/teorema-de-pitagoras.json',
  'dados/teoria/textos-normativos.json',
  'dados/teoria/textos-persuasivos.json',
  'dados/teoria/transitividade-verbal.json',
  'dados/teoria/triangulos.json',
  'dados/teoria/variacao-linguistica.json',
  'dados/teoria/verbos-de-ligacao.json',
  'dados/teoria/vistas-ortogonais.json',
  'dados/teoria/volumes.json',
  'dados/teoria/vozes-verbais.json',
  'img/icones/icone-180.png',
  'img/icones/icone-192.png',
  'img/icones/icone-512.png',
  './',
  'js/app.js',
  'js/armazenamento.js',
  'js/azulejos.js',
  'js/base.js',
  'js/inicio.js',
  'js/interativos.js',
  'js/interativos/comuns.js',
  'js/interativos/kit.js',
  'js/interativos/ps-2023-1-a-matematica.js',
  'js/interativos/ps-2023-1-b-matematica.js',
  'js/interativos/ps-2024-1-a-matematica.js',
  'js/interativos/ps-2024-1-b-matematica.js',
  'js/interativos/ps-2025-1-a-matematica.js',
  'js/interativos/ps-2025-1-b-matematica.js',
  'js/interativos/ps-2026-1-matematica.js',
  'js/interface.js',
  'js/pdfs.js',
  'js/questao.js',
  'js/rotas.js',
  'js/simulado.js',
  'js/teoria.js',
  'js/texto.js',
  'manifest.webmanifest',
  'vendor/fontes/bricolage-grotesque-400-800-normal-latin-ext.woff2',
  'vendor/fontes/bricolage-grotesque-400-800-normal-latin.woff2',
  'vendor/fontes/fontes.css',
  'vendor/fontes/ibm-plex-mono-400-normal-latin-ext.woff2',
  'vendor/fontes/ibm-plex-mono-400-normal-latin.woff2',
  'vendor/fontes/ibm-plex-mono-500-normal-latin-ext.woff2',
  'vendor/fontes/ibm-plex-mono-500-normal-latin.woff2',
  'vendor/fontes/source-sans-3-400-700-italic-latin-ext.woff2',
  'vendor/fontes/source-sans-3-400-700-italic-latin.woff2',
  'vendor/fontes/source-sans-3-400-700-normal-latin-ext.woff2',
  'vendor/fontes/source-sans-3-400-700-normal-latin.woff2',
  'vendor/katex/fonts/KaTeX_AMS-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2',
  'vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2',
  'vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Main-Bold.woff2',
  'vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2',
  'vendor/katex/fonts/KaTeX_Main-Italic.woff2',
  'vendor/katex/fonts/KaTeX_Main-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2',
  'vendor/katex/fonts/KaTeX_Math-Italic.woff2',
  'vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2',
  'vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2',
  'vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Script-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Size1-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Size2-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Size3-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Size4-Regular.woff2',
  'vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2',
  'vendor/katex/katex.min.css',
  'vendor/katex/katex.min.js',
  'vendor/marked/marked.min.js',
];

const CACHE = 'pdp-' + VERSAO;
const CACHE_IMAGENS = 'pdp-imagens';
const ESPERA_REDE = 4000;

// ---------- Instalação ----------

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ESSENCIAIS.map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => n.startsWith('pdp-') && n !== CACHE && n !== CACHE_IMAGENS).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

// ---------- Pedidos ----------

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.registration.scope)) return;
  const caminho = decodeURIComponent(req.url.slice(self.registration.scope.length));
  if (caminho.startsWith('provas e gabaritos/')) return;
  if (caminho.startsWith('img/')) e.respondWith(guardadaPrimeiro(req, e));
  else e.respondWith(redePrimeiro(req, e));
});

async function redePrimeiro(req, e) {
  const cache = await caches.open(CACHE);
  const daRede = fetch(req).then((r) => {
    if (r.ok) e.waitUntil(cache.put(req, r.clone()));
    return r;
  });
  e.waitUntil(daRede.catch(() => {}));
  const guardada = async () => (await cache.match(req, { ignoreSearch: true, ignoreVary: true }))
    || (req.mode === 'navigate' ? cache.match('./') : undefined);
  const prazo = new Promise(ok => setTimeout(ok, ESPERA_REDE)).then(async () => (await guardada()) || daRede);
  try {
    return await Promise.race([daRede, prazo]);
  } catch (erro) {
    return (await guardada()) || Response.error();
  }
}

async function guardadaPrimeiro(req, e) {
  const cache = await caches.open(CACHE_IMAGENS);
  const daRede = fetch(req).then((r) => {
    if (r.ok) e.waitUntil(cache.put(req, r.clone()));
    return r;
  });
  const guardada = await caches.match(req, { ignoreSearch: true, ignoreVary: true });
  if (guardada) {
    e.waitUntil(daRede.catch(() => {}));
    return guardada;
  }
  return daRede;
}

// ---------- Imagens de uma prova ----------

self.addEventListener('message', (e) => {
  if (!e.data || e.data.tipo !== 'guardar-imagens') return;
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_IMAGENS);
    for (const url of e.data.urls) {
      const req = new Request(new URL(url, self.registration.scope));
      if (await cache.match(req, { ignoreSearch: true, ignoreVary: true })) continue;
      try {
        const r = await fetch(req);
        if (r.ok) await cache.put(req, r);
      } catch (erro) {
        return;
      }
    }
  })());
});
