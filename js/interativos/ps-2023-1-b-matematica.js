// Interativos das explicações da PS 2023.1 – Prova B, Matemática (Q16 a Q30).

import { caixa, svg, attrs, deslizante, num, md } from './kit.js';

export const matematica = {
  // Q17: salário proporcional às horas.
  '23b-q17-salario'(el) {
    const corpo = caixa(el, 'Mais horas, mais salário', 'Suponha R$ 50 por hora. Mude as horas e veja o ponto andar no gráfico.');
    corpo.innerHTML = '<div class="ia__figura"></div><p class="ia__conta" aria-live="polite"></p>';
    const s = svg('svg', { viewBox: '0 0 260 200', class: 'ia__svg', role: 'img', 'aria-label': 'Gráfico do salário em função das horas' }, corpo.querySelector('.ia__figura'));
    const X0 = 30; const Y0 = 180;
    svg('line', { x1: X0, y1: Y0, x2: 250, y2: Y0, class: 'ia-traco-forte' }, s);
    svg('line', { x1: X0, y1: Y0, x2: X0, y2: 10, class: 'ia-traco-forte' }, s);
    svg('line', { x1: X0, y1: Y0, x2: 240, y2: 20, class: 'ia-reta' }, s);
    svg('text', { x: 250, y: 196, class: 'ia-legenda', 'text-anchor': 'end', texto: 'horas' }, s);
    svg('text', { x: X0 + 4, y: 18, class: 'ia-legenda', texto: 'salário' }, s);
    svg('circle', { cx: X0, cy: Y0, r: 4, class: 'ia-ponto' }, s);
    const p = svg('circle', { r: 7, class: 'ia-ponto-ocre' }, s);
    const conta = corpo.querySelector('.ia__conta');
    deslizante(corpo, {
      rotulo: 'Horas', min: 0, max: 40, passo: 5, valor: 20,
      aoMudar(h) {
        attrs(p, { cx: X0 + (h / 40) * 210, cy: Y0 - (h / 40) * 160 });
        conta.innerHTML = md(`${h} h × R$ 50 = **R$ ${num(h * 50)}**. ${h === 0 ? 'Zero horas, zero salário: a reta **parte da origem**.' : 'Dobrou as horas, dobra o salário: uma **reta crescente que passa pela origem** (A).'}`);
      },
    });
  },
};
