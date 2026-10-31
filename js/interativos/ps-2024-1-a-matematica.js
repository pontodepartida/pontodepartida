// Interativos das explicações da PS 2024.1 – Prova A, Matemática (Q16 a Q30).

import { caixa, svg, attrs, deslizante, num, md } from './kit.js';

export const matematica = {
  // Q22: as duas retas do ChatGPT e o ponto (2, 3).
  '24a-q22-retas'(el) {
    const corpo = caixa(el, 'O ponto (2, 3) está nas duas retas?', 'Mova o x. Cada ponto anda sobre uma das retas; veja onde cada uma passa quando x = 2.');
    corpo.innerHTML = '<div class="ia__figura"></div><p class="ia__conta" aria-live="polite"></p>';
    const s = svg('svg', { viewBox: '0 0 300 210', class: 'ia__svg', role: 'img', 'aria-label': 'Retas x + 2y = 8 e 3x − y = 1 no plano cartesiano' }, corpo.querySelector('.ia__figura'));
    const X0 = 34; const Y0 = 176; const U = 28;
    const px = (x) => X0 + x * U; const py = (y) => Y0 - y * U;
    for (let i = 0; i <= 8; i++) {
      svg('line', { x1: px(i), x2: px(i), y1: py(-1), y2: py(6), class: 'ia-grade' }, s);
      svg('text', { x: px(i), y: Y0 + 14, class: 'ia-legenda', 'text-anchor': 'middle', texto: i }, s);
    }
    for (let j = -1; j <= 6; j++) {
      svg('line', { x1: px(0), x2: px(8), y1: py(j), y2: py(j), class: 'ia-grade' }, s);
      if (j) svg('text', { x: X0 - 6, y: py(j) + 4, class: 'ia-legenda', 'text-anchor': 'end', texto: j }, s);
    }
    svg('line', { x1: px(0), x2: px(8), y1: Y0, y2: Y0, class: 'ia-traco-forte' }, s);
    svg('line', { x1: X0, x2: X0, y1: py(-1), y2: py(6), class: 'ia-traco-forte' }, s);
    const r1 = (x) => (8 - x) / 2; const r2 = (x) => 3 * x - 1;
    svg('line', { x1: px(0), y1: py(r1(0)), x2: px(8), y2: py(r1(8)), class: 'ia-reta' }, s);
    svg('line', { x1: px(0), y1: py(r2(0)), x2: px(7 / 3), y2: py(r2(7 / 3)), class: 'ia-traco-ocre' }, s);
    svg('text', { x: px(6), y: py(r1(6)) - 8, class: 'ia-legenda', texto: 'x + 2y = 8' }, s);
    svg('text', { x: px(2.3) + 4, y: py(5.6), class: 'ia-legenda', texto: '3x − y = 1' }, s);
    svg('circle', { cx: px(2), cy: py(3), r: 9, class: 'ia-tracejado-erro', fill: 'none' }, s);
    svg('text', { x: px(2) + 12, y: py(3) + 16, class: 'ia-legenda ia-legenda--erro', texto: '(2, 3)' }, s);
    const p1 = svg('circle', { r: 6, class: 'ia-ponto' }, s);
    const p2 = svg('circle', { r: 6, class: 'ia-ponto-ocre' }, s);
    const conta = corpo.querySelector('.ia__conta');
    const v = (n) => num(n, 2);
    deslizante(corpo, {
      rotulo: 'x =', min: 0, max: 2.25, passo: 0.25, valor: 1, formatar: (x) => num(x, 2),
      aoMudar(x) {
        attrs(p1, { cx: px(x), cy: py(r1(x)) });
        attrs(p2, { cx: px(x), cy: py(r2(x)) });
        conta.innerHTML = md(`Na reta \\(x + 2y = 8\\): (${v(x)}; ${v(r1(x))}). Na reta \\(3x - y = 1\\): (${v(x)}; ${v(r2(x))}).${x === 2
          ? ' Em **x = 2**, a primeira passa por (2, 3) ✓, mas a segunda passa por **(2, 5)** ✗. O ponto (2, 3) não é solução da segunda equação: o ChatGPT errou (C).'
          : ' As retas se cruzam perto de (1,43; 3,29), e não em (2, 3).'}`);
      },
    });
  },
};
