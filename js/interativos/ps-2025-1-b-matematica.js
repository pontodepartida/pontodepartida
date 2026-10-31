// Interativos das explicações da PS 2025.1 – Prova B, Matemática (Q16 a Q30).

import { caixa, svg, attrs, deslizante, num, md } from './kit.js';

export const matematica = {
  // Q19: aresta k vezes maior, volume k³ vezes maior.
  '25b-q19-cubo'(el) {
    const corpo = caixa(el, 'A aresta cresce, o volume dispara', 'Aumente a aresta do cubo. Compare as duas barras: a aresta cresce **k** vezes, e o volume cresce **k³** vezes.');
    corpo.innerHTML = `<div class="ia__figura"></div>
      <div class="ia__linha-barra"><span class="ia__linha-rotulo">Aresta</span><span class="ia__barra ia__barra--ref"><span class="ia-ba"></span></span><span class="ia__ranking-valor ia-va"></span></div>
      <div class="ia__linha-barra"><span class="ia__linha-rotulo">Volume</span><span class="ia__barra"><span class="ia-bv"></span></span><span class="ia__ranking-valor ia-vv"></span></div>
      <p class="ia__conta" aria-live="polite"></p>`;
    const s = svg('svg', { viewBox: '0 0 260 180', class: 'ia__svg', role: 'img', 'aria-label': 'Cubo de 10 cm ao lado de um cubo que cresce' }, corpo.querySelector('.ia__figura'));
    // Cubo em perspectiva: face da frente (quadrado) + topo e lado deslocados.
    const cubo = (x, chao, lado, classe) => {
      const g = svg('g', {}, s);
      const frente = svg('rect', { class: classe + ' ia-contorno' }, g);
      const topo = svg('path', { class: classe + ' ia-contorno' }, g);
      const dir = svg('path', { class: classe + ' ia-contorno' }, g);
      const desenhar = (l) => {
        const dd = l * 0.4; const y = chao - l;
        attrs(frente, { x, y, width: l, height: l });
        attrs(topo, { d: `M${x} ${y} L${x + dd} ${y - dd} L${x + l + dd} ${y - dd} L${x + l} ${y} Z` });
        attrs(dir, { d: `M${x + l} ${y} L${x + l + dd} ${y - dd} L${x + l + dd} ${chao - dd} L${x + l} ${chao} Z` });
      };
      desenhar(lado);
      return { desenhar };
    };
    const CHAO = 172; const U = 2.8; // 1 cm = 2,8 unidades do desenho
    cubo(10, CHAO, 10 * U, 'ia-azul-suave');
    svg('text', { x: 25, y: CHAO - 10 * U * 1.4 - 8, class: 'ia-legenda', 'text-anchor': 'middle', texto: '10 cm = 1 L' }, s);
    const grande = cubo(80, CHAO, 10 * U, 'ia-ocre-suave');
    const [ba, bv, va, vv] = ['.ia-ba', '.ia-bv', '.ia-va', '.ia-vv'].map(q => corpo.querySelector(q));
    const conta = corpo.querySelector('.ia__conta');
    deslizante(corpo, {
      rotulo: 'Aresta', min: 10, max: 40, passo: 10, valor: 20, formatar: (a) => a + ' cm',
      aoMudar(a) {
        const k = a / 10;
        grande.desenhar(a * U);
        ba.style.width = (k / 64) * 100 + '%';
        bv.style.width = (k ** 3 / 64) * 100 + '%';
        va.textContent = '× ' + k;
        vv.textContent = '× ' + k ** 3;
        conta.innerHTML = md(`Aresta ${k} vezes maior: volume \\(${k}^3 = ${k ** 3}\\) vezes maior, ou seja, **${num(k ** 3)} L**.${k === 4 ? ' Com 40 cm: **64 litros** (C).' : ''}`);
      },
    });
  },
};
