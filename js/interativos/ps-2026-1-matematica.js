// Interativos das explicações da PS 2026.1, Matemática (Q16 a Q30).

import { caixa, svg, attrs, deslizante, num, md } from './kit.js';

export const matematica = {
  // Q20: grandezas inversamente proporcionais.
  '26-q20-inversa'(el) {
    const corpo = caixa(el, 'Mais espera, nota menor', 'Mude o tempo de espera. Repare que **nota × dias** dá sempre o mesmo valor.');
    corpo.innerHTML = '<div class="ia__figura"></div><p class="ia__conta" aria-live="polite"></p>';
    const s = svg('svg', { viewBox: '0 0 320 220', class: 'ia__svg', role: 'img', 'aria-label': 'Gráfico da nota em função dos dias de espera' }, corpo.querySelector('.ia__figura'));
    const X0 = 40; const Y0 = 190; const U = 46; const V = 34;
    const px = (t) => X0 + t * U; const py = (n) => Y0 - n * V;
    svg('line', { x1: X0, y1: Y0, x2: px(5.8), y2: Y0, class: 'ia-traco-forte' }, s);
    svg('line', { x1: X0, y1: Y0, x2: X0, y2: py(5.4), class: 'ia-traco-forte' }, s);
    for (let i = 1; i <= 5; i++) {
      svg('text', { x: px(i), y: Y0 + 16, class: 'ia-legenda', 'text-anchor': 'middle', texto: i }, s);
      svg('text', { x: X0 - 8, y: py(i) + 4, class: 'ia-legenda', 'text-anchor': 'end', texto: i }, s);
    }
    svg('text', { x: px(5.8), y: Y0 - 6, class: 'ia-legenda', 'text-anchor': 'end', texto: 'dias' }, s);
    svg('text', { x: X0 + 4, y: py(5.4), class: 'ia-legenda', texto: 'nota' }, s);
    let d = '';
    for (let t = 1; t <= 5.001; t += 0.05) d += `${d ? 'L' : 'M'}${px(t)} ${py(5 / t)} `;
    svg('path', { d, class: 'ia-reta', fill: 'none' }, s);
    const retangulo = svg('rect', { class: 'ia-ocre-suave', opacity: 0.7 }, s);
    const ponto = svg('circle', { r: 7, class: 'ia-ponto-ocre' }, s);
    const conta = corpo.querySelector('.ia__conta');
    deslizante(corpo, {
      rotulo: 'Dias de espera', min: 1, max: 5, passo: 0.5, valor: 2, formatar: (t) => num(t, 1),
      aoMudar(t) {
        const nota = 5 / t;
        attrs(ponto, { cx: px(t), cy: py(nota) });
        attrs(retangulo, { x: X0, y: py(nota), width: px(t) - X0, height: Y0 - py(nota) });
        const k = (v, c) => num(v, c).replace(',', '{,}');
        conta.innerHTML = md(`Nota = \\(\\dfrac{5}{${k(t, 1)}} = ${k(nota, 2)}\\) · Conferindo: \\(${k(nota, 2)} \\cdot ${k(t, 1)} = 5\\)${t === 2 ? ' → com **2 dias**, a nota é **2,5** (B).' : ''}`);
      },
    });
  },

  // Q26: todos os trios de pontos.
  '26-q26-triangulos'(el) {
    const pts = { A: [20, 75], B: [55, 160], C: [390, 82], D: [285, 12] };
    const cruzar = (p1, p2, p3, p4) => {
      const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
      const t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / d;
      return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
    };
    pts.P = cruzar(pts.A, pts.C, pts.B, pts.D);
    const trios = [];
    const nomes = Object.keys(pts);
    for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) for (let k = j + 1; k < 5; k++) trios.push(nomes[i] + nomes[j] + nomes[k]);
    const alinhados = ['ACP', 'BDP'];
    const corpo = caixa(el, 'Teste todos os trios de pontos', 'Com 5 pontos há 10 trios. Toque em cada um: será que todos formam triângulo?');
    corpo.innerHTML = `<div class="ia__figura"></div>
      <div class="ia__chips">${trios.map(t => `<button type="button" class="ia__chip" aria-pressed="false" data-t="${t}">${t}</button>`).join('')}</div>
      <p class="ia__nota rico" aria-live="polite"></p>`;
    const s = svg('svg', { viewBox: '0 0 410 180', class: 'ia__svg', role: 'img', 'aria-label': 'Quadrilátero ABCD com as diagonais' }, corpo.querySelector('.ia__figura'));
    const tri = svg('polygon', { class: 'ia-ocre-suave ia-contorno' }, s);
    svg('polygon', { points: ['A', 'B', 'C', 'D'].map(n => pts[n].join(',')).join(' '), class: 'ia-contorno', fill: 'none' }, s);
    svg('line', { x1: pts.A[0], y1: pts.A[1], x2: pts.C[0], y2: pts.C[1], class: 'ia-tracejado' }, s);
    svg('line', { x1: pts.B[0], y1: pts.B[1], x2: pts.D[0], y2: pts.D[1], class: 'ia-tracejado' }, s);
    const linha = svg('line', { class: 'ia-traco-erro' }, s);
    for (const [n, [x, y]] of Object.entries(pts)) {
      svg('circle', { cx: x, cy: y, r: 4, class: 'ia-ponto' }, s);
      svg('text', { x: x + (n === 'C' ? 6 : n === 'A' ? -14 : 4), y: y + (n === 'B' ? 16 : n === 'D' ? -2 : n === 'P' ? -8 : 5), class: 'ia-rotulo', texto: n }, s);
    }
    const nota = corpo.querySelector('.ia__nota');
    const vistos = new Set();
    corpo.addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]');
      if (!b) return;
      const t = b.dataset.t;
      vistos.add(t);
      corpo.querySelectorAll('[data-t]').forEach(c => c.setAttribute('aria-pressed', String(c === b)));
      b.classList.toggle('ia__chip--riscado', alinhados.includes(t));
      const [p, q, r] = [...t].map(n => pts[n]);
      if (alinhados.includes(t)) {
        attrs(tri, { points: '' });
        const extremos = [...t].filter(n => n !== 'P').map(n => pts[n]);
        attrs(linha, { x1: extremos[0][0], y1: extremos[0][1], x2: extremos[1][0], y2: extremos[1][1], opacity: 1 });
        nota.innerHTML = md(`**${t}: não forma triângulo!** Os três pontos estão na **mesma reta** (a diagonal). ${vistos.size === 10 ? 'Conclusão: 10 − 2 = **8 triângulos** (C).' : ''}`);
      } else {
        attrs(linha, { opacity: 0 });
        attrs(tri, { points: [p, q, r].map(v => v.join(',')).join(' ') });
        const validos = [...vistos].filter(x => !alinhados.includes(x)).length;
        nota.innerHTML = md(`**${t}** forma triângulo. ${vistos.size === 10 ? 'Conclusão: 10 − 2 = **8 triângulos** (C).' : `Triângulos encontrados: ${validos}.`}`);
      }
    });
  },

  // Q30: posições possíveis para a casa rosa.
  '26-q30-casas'(el) {
    const cores = { amarela: '#E9C23A', azul: '#3B6FD8', branca: '#FFFFFF', marrom: '#8A5A33', rosa: '#E78AB4' };
    const validas = [];
    const restam = ['amarela', 'azul', 'branca', 'rosa'];
    const permutar = (lista, feito = []) => {
      if (!lista.length) {
        const c = [...feito, 'marrom'];
        const pos = (x) => c.indexOf(x);
        const entre = pos('branca') > Math.min(pos('rosa'), pos('azul')) && pos('branca') < Math.max(pos('rosa'), pos('azul'));
        if (pos('amarela') !== 0 && entre) validas.push(c);
        return;
      }
      lista.forEach((x, i) => permutar(lista.filter((_, j) => j !== i), [...feito, x]));
    };
    permutar(restam);
    const motivos = {
      2: 'A branca precisa ficar entre a rosa e a azul. Com a rosa na 2, o único jeito é branca na 3 e azul na 4, e aí a **amarela sobra para o topo** (casa 1), o que é proibido.',
      5: 'A casa 5 (a mais baixa) já é da **marrom**.',
    };
    const corpo = caixa(el, 'Onde pode ficar a casa rosa?', 'Toque numa casa (1 = topo da ladeira) para ver se existe uma arrumação válida com a rosa ali. Toque de novo para ver outra arrumação.');
    corpo.innerHTML = `<div class="ia__figura"></div>
      <div class="ia__chips" role="radiogroup" aria-label="Posição da casa rosa">${[1, 2, 3, 4, 5].map(p =>
        `<button type="button" class="ia__chip" role="radio" aria-checked="false" data-p="${p}">Casa ${p}</button>`).join('')}</div>
      <p class="ia__veredito" aria-live="polite"></p>`;
    const s = svg('svg', { viewBox: '0 0 330 190', class: 'ia__svg', role: 'img', 'aria-label': 'Cinco casas numa ladeira' }, corpo.querySelector('.ia__figura'));
    const chao = (i) => 64 + i * 26;
    svg('path', { d: [0, 1, 2, 3, 4].map(i => `${i ? 'L' : 'M'}${14 + i * 62} ${chao(i)} L${70 + i * 62} ${chao(i)}`).join(' ') + ' L324 ' + chao(4), class: 'ia-traco-forte', fill: 'none' }, s);
    const casas = [0, 1, 2, 3, 4].map(i => {
      const x = 20 + i * 62; const y = chao(i) - 44;
      const g = svg('g', {}, s);
      const corpoCasa = svg('rect', { x, y: y + 14, width: 40, height: 30, stroke: '#0E1A44', 'stroke-width': 1.5 }, g);
      svg('path', { d: `M${x - 4} ${y + 16} L${x + 20} ${y} L${x + 44} ${y + 16} Z`, class: 'ia-escuro' }, g);
      svg('text', { x: x + 20, y: y + 36, class: 'ia-legenda', 'text-anchor': 'middle', texto: i + 1 }, g);
      return corpoCasa;
    });
    const veredito = corpo.querySelector('.ia__veredito');
    const pintar = (arr) => casas.forEach((c, i) => attrs(c, { fill: arr ? cores[arr[i]] : '#EEF0F7' }));
    pintar(null);
    const achadas = new Set();
    let ultima = 0; let vez = 0;
    corpo.addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]');
      if (!b) return;
      const p = Number(b.dataset.p);
      vez = p === ultima ? vez + 1 : 0;
      ultima = p;
      corpo.querySelectorAll('[data-p]').forEach(c => c.setAttribute('aria-checked', String(c === b)));
      const opcoes = validas.filter(a => a[p - 1] === 'rosa');
      const arr = opcoes.length ? opcoes[vez % opcoes.length] : null;
      pintar(arr);
      if (arr) achadas.add(p);
      const lista = [...achadas].sort().join(', ');
      veredito.className = 'ia__veredito ia__veredito--' + (arr ? 'certo' : 'erro');
      veredito.innerHTML = '<span>' + md(arr
        ? `**Funciona** (${opcoes.length} ${opcoes.length > 1 ? 'arrumações' : 'arrumação'} com a rosa aqui): ${arr.map((c, i) => `${i + 1} ${c}`).join(', ')}. Posições que já funcionaram: **${lista}**.${achadas.size === 3 ? ' São **3 possibilidades** (C).' : ''}`
        : `**Não funciona.** ${motivos[p]}`) + '</span>';
    });
  },
};
