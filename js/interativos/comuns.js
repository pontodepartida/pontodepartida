// Interativos usados por mais de uma prova. A configuração vem dos atributos
// data-* do marcador no texto da explicação.

import { caixa, deslizante, num, md } from './kit.js';

const kx = (v, c) => num(v, c).replace(',', '{,}');

export const comuns = {
  'porcentagens-sequencia'(el, cfg) {
    const inicial = Number(cfg.inicial);
    const prefixo = cfg.prefixo || '';
    const casas = prefixo ? 2 : 1;
    const valor = (v) => prefixo + num(v, casas);
    const corpo = caixa(el, 'Porcentagens em sequência', 'Mude as duas variações. Compare o valor final de verdade (multiplicando) com o que daria somar as porcentagens.');
    const limite = inicial * 1.8;
    const linha = (rotulo, cls) => `<div class="ia__linha-barra"><span class="ia__linha-rotulo">${rotulo}</span><span class="ia__barra${cls}"><span></span></span><span class="ia__ranking-valor"></span></div>`;
    corpo.innerHTML = linha('Início', ' ia__barra--ref') + linha('Depois da 1ª', '') + linha('Depois da 2ª', '') + linha('Somando %', ' ia__barra--ref')
      + '<p class="ia__veredito" aria-live="polite"></p>';
    const linhas = [...corpo.querySelectorAll('.ia__linha-barra')];
    const pintar = (i, v) => {
      linhas[i].querySelector('.ia__barra > span').style.width = Math.max(0, Math.min(1, v / limite)) * 100 + '%';
      linhas[i].querySelector('.ia__ranking-valor').textContent = valor(v);
    };
    const vered = corpo.querySelector('.ia__veredito');
    let a = Number(cfg.v1); let b = Number(cfg.v2);
    const sinal = (p) => (p > 0 ? '+' : p < 0 ? '−' : '') + Math.abs(p) + '%';
    const atualizar = () => {
      const v1 = inicial * (1 + a / 100);
      const v2 = v1 * (1 + b / 100);
      const somado = inicial * (1 + (a + b) / 100);
      [inicial, v1, v2, somado].forEach((v, i) => pintar(i, v));
      const total = (v2 / inicial - 1) * 100;
      const fator = (1 + a / 100) * (1 + b / 100);
      const original = a === Number(cfg.v1) && b === Number(cfg.v2);
      vered.className = 'ia__veredito ia__veredito--' + (original ? 'certo' : 'neutro');
      vered.innerHTML = '<span>' + md(`Fatores: \\(${kx(1 + a / 100, 2)} \\cdot ${kx(1 + b / 100, 2)} = ${kx(fator, 4)}\\), variação total de **${sinal(Math.round(total * 100) / 100).replace('.', ',')}**. Somar daria ${sinal(a + b)}.${original && cfg.conclusao ? ' ' + cfg.conclusao : ''}`) + '</span>';
    };
    deslizante(corpo, { rotulo: '1ª variação', min: -50, max: 100, passo: 1, valor: a, formatar: sinal, aoMudar: (v) => { a = v; atualizar(); } });
    deslizante(corpo, { rotulo: '2ª variação', min: -50, max: 100, passo: 1, valor: b, formatar: sinal, aoMudar: (v) => { b = v; atualizar(); } });
  },
};
