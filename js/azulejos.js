// Faixa de azulejos em assentamento livre, inspirados em Athos Bulcão.

function gerador(semente) {
  let a = 0;
  for (const ch of semente) a = (a * 31 + ch.charCodeAt(0)) | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AF = 'var(--cor-azulejo-figura)';
const AZ = 'var(--cor-azulejo)';
const AO = 'var(--cor-ocre)';
const QUARTO = '0 0 100% 0';

const PECAS = [
  [{ bg: AF, camadas: [{ l: '0', t: '0', w: '100%', h: '100%', br: QUARTO, bg: AZ }] }, 4],
  [{ bg: AZ, camadas: [{ l: '0', t: '0', w: '100%', h: '100%', br: QUARTO, bg: AF }] }, 4],
  [{ bg: AF, camadas: [
    { l: '0', t: '0', w: '100%', h: '100%', br: QUARTO, bg: AZ },
    { l: '64%', t: '64%', w: '22%', h: '22%', br: '50%', bg: AO },
  ] }, 1],
];

export function faixaAzulejos(semente, quantidade = 60) {
  const r = gerador(semente);
  let html = '';
  for (let i = 0; i < quantidade; i++) {
    let x = r() * 9;
    let peca = PECAS[0][0];
    for (const [p, peso] of PECAS) {
      if ((x -= peso) < 0) { peca = p; break; }
    }
    const giro = [0, 90, 180, 270][Math.floor(r() * 4)];
    const camadas = peca.camadas
      .map(c => `<i style="left:${c.l};top:${c.t};width:${c.w};height:${c.h};border-radius:${c.br};background:${c.bg}"></i>`)
      .join('');
    html += `<div class="azulejo" style="background:${peca.bg};transform:rotate(${giro}deg)">${camadas}</div>`;
  }
  return `<div class="azulejos" aria-hidden="true">${html}</div>`;
}

// ---------- Comemorações ----------

const semMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ondaAzulejos() {
  const faixa = document.querySelector('.cabecalho .azulejos');
  if (!faixa || semMovimento()) return;
  [...faixa.children]
    .filter(a => a.getBoundingClientRect().left < window.innerWidth)
    .forEach((a, i) => {
      a.style.animationDelay = i * 35 + 'ms';
      a.classList.add('azulejo--onda');
    });
}

export function bolinhasAcerto(selo) {
  if (!selo || semMovimento()) return;
  const n = 8;
  for (let i = 0; i < n; i++) {
    const angulo = (i / n) * 2 * Math.PI + Math.random() * .4;
    const distancia = 34 + Math.random() * 14;
    const b = document.createElement('i');
    b.className = 'bolinha';
    b.style.setProperty('--dx', (Math.cos(angulo) * distancia).toFixed(1) + 'px');
    b.style.setProperty('--dy', (Math.sin(angulo) * distancia).toFixed(1) + 'px');
    b.style.animationDelay = Math.round(Math.random() * 60) + 'ms';
    selo.appendChild(b);
  }
  selo.classList.add('aviso__selo--pulo');
  setTimeout(() => selo.querySelectorAll('.bolinha').forEach(b => b.remove()), 900);
}
