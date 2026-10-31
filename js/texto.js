// Converte os textos dos JSON (Markdown + fórmulas KaTeX) em HTML.

const katex = () => window.katex;
const marked = () => window.marked;

let configurado = false;
let imagemSimples = false;

function escaparAttr(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function configurar() {
  if (configurado) return;
  configurado = true;
  marked().use({
    gfm: true,
    breaks: true,
    renderer: {
      image(href, title, text) {
        const alt = text || '';
        if (imagemSimples) return `<img src="${escaparAttr(href)}" alt="${alt}">`;
        const transcricao = title ? String(title).split(' | ').join('\n') : '';
        const detalhes = transcricao
          ? `<details class="figura__transcricao"><summary>Ler transcrição</summary><div>${transcricao}</div></details>`
          : '';
        return `<div class="figura"><button type="button" class="figura__botao" data-zoom="${escaparAttr(href)}" data-alt="${alt}" aria-label="Ampliar imagem: ${alt}"><img src="${escaparAttr(href)}" alt="${alt}"></button>`
          + `<div class="figura__dica"><span class="figura__desktop">Clique na imagem para ampliar</span><span class="figura__mobile">Toque para ampliar</span>${detalhes}</div></div>`;
      },
      paragraph(text) {
        const t = text.trim();
        if (t.startsWith('<div class="figura">') && t.endsWith('</div>')) return t + '\n';
        return `<p>${text}</p>\n`;
      },
      table(header, body) {
        return `<div class="tabela"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>\n`;
      },
    },
  });
}

// Tira as fórmulas antes do Markdown (para as barras invertidas não serem
// consumidas) e devolve uma função que as recoloca já renderizadas.
function protegerFormulas(src) {
  const formulas = [];
  const protegido = String(src ?? '').replace(/\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g, (_, bloco, linha) => {
    formulas.push({ tex: bloco ?? linha, bloco: bloco !== undefined });
    return `KTXMATH${formulas.length - 1}KTX`;
  });
  const restaurar = (html) => html.replace(/KTXMATH(\d+)KTX/g, (_, i) => {
    const f = formulas[Number(i)];
    try {
      return katex().renderToString(f.tex, { displayMode: f.bloco, throwOnError: false, output: 'htmlAndMathml' });
    } catch (e) {
      return escaparAttr(f.tex);
    }
  });
  return { protegido, restaurar };
}

// imagensSimples: imagens sem botão de ampliar (usado dentro das alternativas,
// que já são clicáveis).
export function rico(src, { imagensSimples = false } = {}) {
  if (!src) return '';
  configurar();
  const { protegido, restaurar } = protegerFormulas(src);
  imagemSimples = imagensSimples;
  try {
    return restaurar(marked().parse(protegido));
  } finally {
    imagemSimples = false;
  }
}

// Separa o enunciado em "corpo" (textos de apoio, imagens) e "comando"
// (o último parágrafo, que é a pergunta propriamente dita).
export function dividirEnunciado(src) {
  configurar();
  const { protegido, restaurar } = protegerFormulas(src);
  const tokens = marked().lexer(protegido).filter(t => t.type !== 'space');
  const ultimo = tokens[tokens.length - 1];
  const naoEhComando = !ultimo || ultimo.type !== 'paragraph' || tokens.length < 2
    || ultimo.raw.includes('![') || /^\s*<cite>/.test(ultimo.raw);
  if (naoEhComando) {
    return { corpo: restaurar(marked().parse(protegido)), comando: '' };
  }
  const corpoSrc = tokens.slice(0, -1).map(t => t.raw).join('\n\n');
  return {
    corpo: restaurar(marked().parse(corpoSrc)),
    comando: restaurar(marked().parse(ultimo.raw)),
  };
}

// Texto puro (para resumos curtos e rótulos), sem Markdown nem fórmulas.
export function textoPuro(src) {
  return String(src ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\\\(|\\\)|\\\[|\\\]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
