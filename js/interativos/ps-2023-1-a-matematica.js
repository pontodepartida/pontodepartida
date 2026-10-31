// Interativos das explicações da PS 2023.1 – Prova A, Matemática (Q16 a Q30).

import { caixa, svg, attrs, deslizante, md, num } from './kit.js';

const kx = (v, c) => num(v, c).replace(',', '{,}');

export const matematica = {
  // Q18: mesma distância, outra velocidade.
  '23a-q18-viagem'(el) {
    const corpo = caixa(el, 'Mesma estrada, outra velocidade', 'Mude a velocidade da volta e compare a barra do tempo com a da ida (39 min a 80 km/h).');
    corpo.innerHTML = `<div class="ia__linha-barra"><span class="ia__linha-rotulo">Ida</span><span class="ia__barra ia__barra--ref"><span style="width:${(39 / 60) * 100}%"></span></span><span class="ia__ranking-valor">39 min</span></div>
      <div class="ia__linha-barra"><span class="ia__linha-rotulo">Volta</span><span class="ia__barra"><span class="ia-bt"></span></span><span class="ia__ranking-valor ia-vt"></span></div>
      <p class="ia__conta" aria-live="polite"></p>`;
    const barra = corpo.querySelector('.ia-bt');
    const valor = corpo.querySelector('.ia-vt');
    const conta = corpo.querySelector('.ia__conta');
    deslizante(corpo, {
      rotulo: 'Velocidade na volta', min: 60, max: 120, passo: 10, valor: 80, formatar: (v) => v + ' km/h',
      aoMudar(v) {
        const t = 52 / v * 60;
        barra.style.width = (t / 60) * 100 + '%';
        valor.textContent = num(t, 1) + ' min';
        conta.innerHTML = md(`Distância: \\(80 \\cdot \\tfrac{39}{60} = 52\\) km. Tempo: \\(\\tfrac{52}{${v}} \\cdot 60 \\approx ${kx(t, 1)}\\) min.${v === 100 ? ' A 100 km/h: cerca de **31 minutos** (C).' : ' Mais velocidade, menos tempo: o produto velocidade × tempo é sempre o mesmo.'}`);
      },
    });
  },

  // Q24: a janela de 7 dias da média móvel.
  '23a-q24-media-movel'(el) {
    const dias = [['21/08', 28000], ['22/08', 14500], ['23/08', 13000], ['24/08', 31500], ['25/08', 30500], ['26/08', 31000], ['27/08', 27000], ['28/08', 24500], ['29/08', 13500], ['30/08', 10500], ['31/08', 24500]];
    const corpo = caixa(el, 'A janela que anda', 'Escolha o dia. A faixa marca os 7 últimos dias, incluindo o escolhido, e a linha tracejada é a média deles.');
    corpo.innerHTML = '<div class="ia__figura"></div><p class="ia__conta" aria-live="polite"></p>';
    const s = svg('svg', { viewBox: '0 0 340 190', class: 'ia__svg', role: 'img', 'aria-label': 'Casos diários de 21/08 a 31/08 com a janela de 7 dias destacada' }, corpo.querySelector('.ia__figura'));
    const X0 = 40; const Y0 = 160; const DX = 28; const MAX = 35000;
    const px = (i) => X0 + i * DX; const py = (v) => Y0 - (v / MAX) * 140;
    const janela = svg('rect', { y: 10, height: Y0 - 10, class: 'ia-ocre-suave' }, s);
    for (const v of [10000, 20000, 30000]) {
      svg('line', { x1: X0 - 6, x2: px(10) + 8, y1: py(v), y2: py(v), class: 'ia-grade' }, s);
      svg('text', { x: X0 - 8, y: py(v) + 4, class: 'ia-legenda', 'text-anchor': 'end', texto: v / 1000 + ' mil' }, s);
    }
    svg('line', { x1: X0 - 6, x2: px(10) + 8, y1: Y0, y2: Y0, class: 'ia-traco-forte' }, s);
    svg('path', { d: dias.map(([, v], i) => `${i ? 'L' : 'M'}${px(i)} ${py(v)}`).join(' '), class: 'ia-reta', fill: 'none' }, s);
    dias.forEach(([d, v], i) => {
      svg('circle', { cx: px(i), cy: py(v), r: 3.5, class: 'ia-ponto' }, s);
      if (i % 2 === 0 || i === 10) svg('text', { x: px(i), y: Y0 + 16, class: 'ia-legenda', 'text-anchor': 'middle', texto: d.slice(0, 2) }, s);
    });
    const media = svg('line', { class: 'ia-tracejado-erro' }, s);
    const conta = corpo.querySelector('.ia__conta');
    deslizante(corpo, {
      rotulo: 'Dia', min: 6, max: 10, valor: 10, formatar: (i) => dias[i][0],
      aoMudar(i) {
        const ult = dias.slice(i - 6, i + 1);
        const soma = ult.reduce((a, [, v]) => a + v, 0);
        const m = soma / 7;
        attrs(janela, { x: px(i - 6) - DX / 2, width: DX * 7 });
        attrs(media, { x1: px(i - 6) - DX / 2, x2: px(i) + DX / 2, y1: py(m), y2: py(m) });
        conta.innerHTML = md(`Média móvel de ${dias[i][0]}: dias ${ult[0][0]} a ${dias[i][0]}, soma ${num(soma)} ÷ 7 ≈ **${num(Math.round(m))}** casos por dia.${i === 10 ? ' É a resposta da questão (B).' : ''}`);
      },
    });
  },
};
