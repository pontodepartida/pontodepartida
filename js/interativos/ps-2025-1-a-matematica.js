// Interativos das explicações da PS 2025.1 – Prova A, Matemática (Q16 a Q30).

import { caixa, svg, attrs, deslizante, num, md } from './kit.js';

const kx = (v, c) => num(v, c).replace(',', '{,}');

export const matematica = {
  // Q17: torres que não se atacam.
  '25a-q17-torres'(el) {
    const corpo = caixa(el, 'Coloque a torre branca', 'Toque numa casa. As casas riscadas são as que a torre ataca: a torre preta **não** pode ficar nelas.');
    corpo.innerHTML = '<div class="ia__tabuleiro" role="grid" aria-label="Tabuleiro 4 por 4"></div><p class="ia__nota rico" aria-live="polite"></p>';
    const tab = corpo.querySelector('.ia__tabuleiro');
    const nota = corpo.querySelector('.ia__nota');
    for (let i = 0; i < 16; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ia__casa' + ((Math.floor(i / 4) + i) % 2 ? ' ia__casa--escura' : '');
      b.dataset.i = i;
      b.setAttribute('aria-label', `Linha ${Math.floor(i / 4) + 1}, coluna ${(i % 4) + 1}`);
      tab.appendChild(b);
    }
    tab.addEventListener('click', (e) => {
      const b = e.target.closest('.ia__casa');
      if (!b) return;
      const i = Number(b.dataset.i);
      const [l, c] = [Math.floor(i / 4), i % 4];
      let livres = 0;
      tab.querySelectorAll('.ia__casa').forEach((x) => {
        const j = Number(x.dataset.i);
        const [l2, c2] = [Math.floor(j / 4), j % 4];
        const torre = j === i;
        const atacada = !torre && (l2 === l || c2 === c);
        x.textContent = torre ? '♖' : atacada ? '' : '♜';
        x.classList.toggle('ia--atacada', atacada);
        x.classList.toggle('ia--torre', torre);
        if (!torre && !atacada) livres++;
      });
      nota.innerHTML = md(`A torre branca ocupa 1 casa e ataca **6** (3 na linha + 3 na coluna). Sobram \\(16 - 1 - 6 = ${livres}\\) casas para a preta. Isso vale para **qualquer** casa! Total: \\(16 \\cdot 9 = 144\\) (C).`);
    });
  },

  // Q20: aumentar e depois dar 50% de desconto.
  '25a-q20-gasolina'(el) {
    const P0 = 5.6;
    const corpo = caixa(el, 'Aumenta e depois corta pela metade', 'Escolha o aumento antes da Black Friday e compare o preço final com o inicial (R$ 5,60).');
    corpo.innerHTML = `<div class="ia__linha-barra"><span class="ia__linha-rotulo">Inicial</span><span class="ia__barra ia__barra--ref"><span style="width:${(P0 / 12.4) * 100}%"></span></span><span class="ia__ranking-valor">R$ 5,60</span></div>
      <div class="ia__linha-barra"><span class="ia__linha-rotulo">Aumentado</span><span class="ia__barra"><span class="ia-b1"></span></span><span class="ia__ranking-valor ia-v1"></span></div>
      <div class="ia__linha-barra"><span class="ia__linha-rotulo">Com −50%</span><span class="ia__barra ia__barra--alvo"><span class="ia-b2"></span><i style="left:${(P0 / 12.4) * 100}%"></i></span><span class="ia__ranking-valor ia-v2"></span></div>
      <p class="ia__veredito" aria-live="polite"></p>`;
    const [b1, b2, v1, v2] = ['.ia-b1', '.ia-b2', '.ia-v1', '.ia-v2'].map(s => corpo.querySelector(s));
    const vered = corpo.querySelector('.ia__veredito');
    deslizante(corpo, {
      rotulo: 'Aumento', min: 0, max: 120, passo: 10, valor: 40, formatar: (a) => a + '%',
      aoMudar(a) {
        const p1 = P0 * (1 + a / 100); const p2 = p1 / 2;
        b1.style.width = (p1 / 12.4) * 100 + '%'; b2.style.width = (p2 / 12.4) * 100 + '%';
        v1.textContent = 'R$ ' + num(p1, 2); v2.textContent = 'R$ ' + num(p2, 2);
        const dif = Math.round((p2 / P0 - 1) * 100);
        const igual = Math.abs(p2 - P0) < 0.001;
        vered.className = 'ia__veredito ia__veredito--' + (igual ? 'certo' : 'neutro');
        vered.innerHTML = '<span>' + md(igual
          ? '🎯 **Aumento de 100%** (o preço dobra) e depois metade: volta **exatamente** a R$ 5,60. Resposta **D**.'
          : `Preço final ${dif < 0 ? `**${-dif}% menor**` : `**${dif}% maior**`} que o inicial. Para voltar ao mesmo valor, o aumento precisa **dobrar** o preço.`) + '</span>';
      },
    });
  },

  // Q21: pontos da reta 2x − 2y = 4.
  '25a-q21-reta'(el) {
    const corpo = caixa(el, 'Ande sobre a reta', 'Escolha um valor de x. O ponto (x, y) precisa satisfazer \\(2x - 2y = 4\\), ou seja, \\(y = x - 2\\).');
    corpo.innerHTML = '<div class="ia__figura"></div><p class="ia__conta" aria-live="polite"></p>';
    const s = svg('svg', { viewBox: '0 0 260 260', class: 'ia__svg', role: 'img', 'aria-label': 'Gráfico da reta y = x − 2' }, corpo.querySelector('.ia__figura'));
    const U = 40; const O = { x: 110, y: 110 };
    const px = (x) => O.x + x * U; const py = (y) => O.y - y * U;
    for (let i = -2; i <= 3; i++) {
      svg('line', { x1: px(i), x2: px(i), y1: 10, y2: 250, class: 'ia-grade' }, s);
      svg('line', { y1: py(i), y2: py(i), x1: 10, x2: 250, class: 'ia-grade' }, s);
    }
    svg('line', { x1: 10, x2: 250, y1: O.y, y2: O.y, class: 'ia-traco-forte' }, s);
    svg('line', { y1: 10, y2: 250, x1: O.x, x2: O.x, class: 'ia-traco-forte' }, s);
    [-2, -1, 1, 2, 3].forEach(i => svg('text', { x: px(i), y: O.y + 15, class: 'ia-legenda', 'text-anchor': 'middle', texto: i }, s));
    [-3, -2, -1, 1, 2].forEach(i => svg('text', { x: O.x - 8, y: py(i) + 4, class: 'ia-legenda', 'text-anchor': 'end', texto: i }, s));
    svg('line', { x1: px(-1), y1: py(-3), x2: px(3.5), y2: py(1.5), class: 'ia-reta' }, s);
    [[2, 0], [0, -2]].forEach(([x, y]) => svg('circle', { cx: px(x), cy: py(y), r: 5, class: 'ia-ponto' }, s));
    const p = svg('circle', { r: 7, class: 'ia-ponto-ocre' }, s);
    const conta = corpo.querySelector('.ia__conta');
    deslizante(corpo, {
      rotulo: 'x =', min: -0.5, max: 3, passo: 0.5, valor: 0, formatar: (x) => num(x, 1),
      aoMudar(x) {
        const y = x - 2;
        attrs(p, { cx: px(x), cy: py(y) });
        conta.innerHTML = md(`\\(x = ${kx(x, 1)}\\) → \\(y = ${kx(x, 1)} - 2 = ${kx(y, 1)}\\).${x === 0 ? ' Corta o **eixo y em −2**.' : x === 2 ? ' Corta o **eixo x em 2**.' : ''} Só o gráfico **D** passa por (0, −2) e (2, 0).`);
      },
    });
  },

  // Q29: velocidade × tempo.
  '25a-q29-velocidade'(el) {
    const corpo = caixa(el, 'Mais rápido, menos tempo', 'O percurso é sempre o mesmo: \\(60 \\cdot 4 = 240\\) km. Mude a velocidade.');
    corpo.innerHTML = '<div class="ia__linha-barra"><span class="ia__linha-rotulo">Tempo</span><span class="ia__barra"><span></span></span><span class="ia__ranking-valor"></span></div><p class="ia__conta" aria-live="polite"></p>';
    const barra = corpo.querySelector('.ia__barra span');
    const valor = corpo.querySelector('.ia__ranking-valor');
    const conta = corpo.querySelector('.ia__conta');
    deslizante(corpo, {
      rotulo: 'Velocidade', min: 40, max: 120, passo: 20, valor: 60, formatar: (v) => v + ' km/h',
      aoMudar(v) {
        const t = 240 / v;
        barra.style.width = (t / 6) * 100 + '%';
        valor.textContent = num(t, 1) + ' h';
        conta.innerHTML = md(`\\(240 \\div ${v} = ${kx(t, 1)}\\) h. ${v === 80 ? 'Com **80 km/h**: **3 horas** (B).' : 'Velocidade e tempo são **inversamente** proporcionais: o produto é sempre 240.'}`);
      },
    });
  },
};
