import { app, esc, carregarCatalogo } from './base.js';
import { cabecalhoPagina, rodape } from './interface.js';

// ---------- PDFs ----------

const tamanho = (bytes) => bytes >= 1e6
  ? (bytes / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' MB'
  : Math.round(bytes / 1e3) + ' KB';

export async function telaPdfs() {
  const [catalogo, r] = await Promise.all([carregarCatalogo(), fetch('dados/pdfs.json', { cache: 'no-cache' })]);
  if (!r.ok) throw new Error('Não foi possível carregar a lista de PDFs.');
  const { pasta, provas } = await r.json();
  const nome = (id) => (catalogo.find(p => p.id === id) || {}).nome || id;
  document.title = 'PDFs · Ponto de Partida';

  app.innerHTML = `<div class="app">
    ${cabecalhoPagina('PDFs', '#/', 'Voltar às provas', 'pdfs')}
    <main id="conteudo" class="conteudo sobre pdfs">
      <div class="sobre__cabeca">
        <h1 class="sobre__titulo" tabindex="-1">Provas e gabaritos em PDF</h1>
        <p class="sobre__intro">As provas e os gabaritos abaixo são os arquivos originais publicados pelo IFSP e podem ser baixados ou impressos.</p>
      </div>
      <div class="grupo">
        ${provas.map(p => `<section class="pdfs__prova" aria-labelledby="pdfs-${p.id}">
          <h2 class="pdfs__nome" id="pdfs-${p.id}">${esc(nome(p.id))}</h2>
          <ul class="pdfs__arquivos">
            ${p.arquivos.map(a => `<li><a class="pdfs__arquivo" href="${encodeURI(pasta + a.arquivo)}" target="_blank" rel="noopener"
              download="${esc(nome(p.id) + ' - ' + a.rotulo)}.pdf">
              <span class="pdfs__rotulo">${esc(a.rotulo)}</span>
              <span class="pdfs__tamanho">PDF · ${tamanho(a.tamanho)}</span>
            </a></li>`).join('')}
          </ul>
        </section>`).join('')}
      </div>
    </main>
    ${rodape()}
  </div>`;
}
