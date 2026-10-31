// Interativos das explicações da PS 2024.1 – Prova B (Matemática, Q16 a Q30).

import { caixa, svg, attrs, esperar, deslizante, num, entre } from './kit.js';

export const matematica = {
  // Q17: qualquer ponto da mediatriz fica à mesma distância de A e B.
  'q17-mediatriz'(el) {
    const corpo = caixa(el, 'Mova o ponto P pela Estrada 2', 'Compare as distâncias de **P** até as duas cidades. Depois troque a Estrada 2 por uma reta qualquer.');
    const A = { x: 50, y: 80 };
    const B = { x: 310, y: 200 };
    const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
    const ab = Math.hypot(B.x - A.x, B.y - A.y);
    const perp = { x: -(B.y - A.y) / ab, y: (B.x - A.x) / ab };
    const Q = { x: entre(A.x, B.x, 0.3), y: entre(A.y, B.y, 0.3) };
    const outra = { x: 0.25, y: 0.97 };
    const retas = {
      mediatriz: { origem: M, dir: perp, rotulo: 'Estrada 2 (mediatriz)' },
      qualquer: { origem: Q, dir: outra, rotulo: 'Outra reta que só corta AB' },
    };
    corpo.innerHTML = `<div class="ia__figura"></div>
      <div class="ia__chips" role="radiogroup" aria-label="Qual reta">
        <button type="button" class="ia__chip" role="radio" aria-checked="true" data-reta="mediatriz">Estrada 2 (mediatriz)</button>
        <button type="button" class="ia__chip" role="radio" aria-checked="false" data-reta="qualquer">Uma reta qualquer</button>
      </div>
      <div class="ia__placar" aria-live="polite"></div>`;
    const s = svg('svg', { viewBox: '0 0 360 270', class: 'ia__svg', role: 'img', 'aria-label': 'Segmento AB, a reta da Estrada 2 e o ponto P' }, corpo.querySelector('.ia__figura'));
    const linha = svg('line', { class: 'ia-reta' }, s);
    svg('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: 'ia-traco-forte' }, s);
    const marcas = svg('g', {}, s);
    const tick = (P) => svg('line', { x1: P.x - perp.x * 7, y1: P.y - perp.y * 7, x2: P.x + perp.x * 7, y2: P.y + perp.y * 7, class: 'ia-traco-forte' }, marcas);
    tick({ x: entre(A.x, M.x, 0.5), y: entre(A.y, M.y, 0.5) });
    tick({ x: entre(M.x, B.x, 0.5), y: entre(M.y, B.y, 0.5) });
    const u = { x: (B.x - A.x) / ab, y: (B.y - A.y) / ab };
    const q = 10;
    svg('path', { d: `M${M.x + u.x * q} ${M.y + u.y * q} L${M.x + u.x * q + perp.x * q} ${M.y + u.y * q + perp.y * q} L${M.x + perp.x * q} ${M.y + perp.y * q}`, class: 'ia-angulo' }, marcas);
    const pa = svg('line', { class: 'ia-dist ia-dist--a' }, s);
    const pb = svg('line', { class: 'ia-dist ia-dist--b' }, s);
    for (const [P, n] of [[A, 'A'], [B, 'B']]) {
      svg('circle', { cx: P.x, cy: P.y, r: 5, class: 'ia-ponto' }, s);
      svg('text', { x: P.x + (n === 'A' ? -16 : 10), y: P.y + 5, class: 'ia-rotulo', texto: n }, s);
    }
    const p = svg('circle', { r: 7, class: 'ia-ponto-ocre' }, s);
    const pRot = svg('text', { class: 'ia-rotulo', texto: 'P' }, s);
    const placar = corpo.querySelector('.ia__placar');
    let reta = 'mediatriz';
    let t = 0.5;
    function desenhar() {
      const r = retas[reta];
      attrs(linha, { x1: r.origem.x - r.dir.x * 130, y1: r.origem.y - r.dir.y * 130, x2: r.origem.x + r.dir.x * 130, y2: r.origem.y + r.dir.y * 130 });
      attrs(marcas, { opacity: reta === 'mediatriz' ? 1 : 0 });
      const P = { x: r.origem.x + r.dir.x * 120 * t, y: r.origem.y + r.dir.y * 120 * t };
      attrs(p, { cx: P.x, cy: P.y });
      attrs(pRot, { x: P.x + 10, y: P.y - 8 });
      attrs(pa, { x1: P.x, y1: P.y, x2: A.x, y2: A.y });
      attrs(pb, { x1: P.x, y1: P.y, x2: B.x, y2: B.y });
      const da = Math.hypot(P.x - A.x, P.y - A.y) / 20;
      const db = Math.hypot(P.x - B.x, P.y - B.y) / 20;
      const iguais = Math.abs(da - db) < 0.05;
      placar.innerHTML = `<span class="ia__dist ia__dist--a">PA = ${num(da, 1)} km</span>
        <span class="ia__sinal">${iguais ? '=' : '≠'}</span>
        <span class="ia__dist ia__dist--b">PB = ${num(db, 1)} km</span>
        <span class="ia__placar-nota">${iguais ? 'Sempre iguais: é a <b>mediatriz</b> de AB.' : 'Distâncias diferentes: esta reta não é mediatriz.'}</span>`;
    }
    deslizante(corpo, { rotulo: 'Posição de P', min: -1, max: 1, passo: 0.01, valor: 0.5, formatar: () => '', aoMudar: (v) => { t = v; desenhar(); } });
    corpo.addEventListener('click', (e) => {
      const b = e.target.closest('[data-reta]');
      if (!b) return;
      reta = b.dataset.reta;
      corpo.querySelectorAll('[data-reta]').forEach(c => c.setAttribute('aria-checked', String(c === b)));
      desenhar();
    });
  },

  // Q21: andar por andar do prédio oco.
  'q21-predio'(el) {
    const C = 5; const Lg = 4; const H = 8; const T = 34;
    const corpo = caixa(el, 'Veja o prédio andar por andar', 'Cada quadradinho é um bloco visto de cima. Os tracejados são o **espaço oco**.');
    corpo.innerHTML = `<div class="ia__figura ia__figura--lado"></div><div class="ia__placar" aria-live="polite"></div>
      <div class="ia__controles"><button type="button" class="ia__botao ia__botao--primario">▶ Subir andar por andar</button></div>`;
    const s = svg('svg', { viewBox: '0 0 300 190', class: 'ia__svg', role: 'img', 'aria-label': 'Andar do prédio visto de cima' }, corpo.querySelector('.ia__figura'));
    const celulas = [];
    for (let j = 0; j < Lg; j++) for (let i = 0; i < C; i++) {
      const borda = i === 0 || j === 0 || i === C - 1 || j === Lg - 1;
      celulas.push([svg('rect', { x: 14 + i * T, y: 20 + j * T, width: T - 3, height: T - 3, rx: 3 }, s), borda]);
    }
    const pilha = [];
    for (let k = 0; k < H; k++) pilha.push(svg('rect', { x: 230, y: 160 - k * 18, width: 50, height: 15, rx: 2 }, s));
    svg('text', { x: 255, y: 186, class: 'ia-legenda', 'text-anchor': 'middle', texto: 'andares' }, s);
    const tit = svg('text', { x: 14, y: 14, class: 'ia-rotulo' }, s);
    const placar = corpo.querySelector('.ia__placar');
    let andar = 1;
    function desenhar() {
      const cheio = andar === 1 || andar === H;
      celulas.forEach(([r, borda]) => attrs(r, { class: borda || cheio ? 'ia-azul' : 'ia-oco' }));
      pilha.forEach((r, k) => attrs(r, { class: k + 1 === andar ? 'ia-ocre' : k + 1 < andar ? 'ia-azul-medio' : 'ia-azul-suave' }));
      tit.textContent = andar === 1 ? 'Andar 1 (piso)' : andar === H ? `Andar ${H} (teto)` : `Andar ${andar} (só paredes)`;
      const oco = cheio ? 0 : (C - 2) * (Lg - 2);
      const ocoAte = Math.max(0, Math.min(andar, H - 1) - 1) * (C - 2) * (Lg - 2);
      placar.innerHTML = `<span>Neste andar: <b>${C * Lg - oco}</b> blocos e <b>${oco}</b> oco</span>
        <span>Oco acumulado: <b>${ocoAte} cm³</b>${andar === H ? ` = 6 andares × 6 = <b>36 cm³</b>` : ''}</span>`;
    }
    const input = deslizante(corpo, { rotulo: 'Andar', min: 1, max: H, valor: 1, aoMudar: (v) => { andar = v; desenhar(); } });
    let rodando = false;
    corpo.querySelector('.ia__botao').addEventListener('click', async () => {
      if (rodando) return;
      rodando = true;
      for (let k = 1; k <= H && el.isConnected; k++) {
        input.value = k;
        input.dispatchEvent(new Event('input'));
        await esperar(650);
      }
      rodando = false;
    });
  },
};
