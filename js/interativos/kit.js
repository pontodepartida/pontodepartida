// Peças comuns dos componentes interativos das explicações.

import { rico } from '../texto.js';

export const semAnimacao = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const esperar =(ms) => new Promise((r) => setTimeout(r, semAnimacao() ? 0 : ms));

export const num = (n, casas) => Number(n).toLocaleString('pt-BR', {
  minimumFractionDigits: casas ?? 0,
  maximumFractionDigits: casas ?? 2,
});

export const entre = (a, b, p) => a + (b - a) * p;

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const md = (src) => rico(src).replace(/^<p>([\s\S]*)<\/p>\s*$/, '$1');

const NS = 'http://www.w3.org/2000/svg';
export function svg(tag, attrs = {}, pai) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'texto') n.textContent = v;
    else n.setAttribute(k, v);
  }
  if (pai) pai.appendChild(n);
  return n;
}

export function attrs(n, a) {
  for (const [k, v] of Object.entries(a)) n.setAttribute(k, v);
}

export function caixa(el, titulo, dica) {
  el.innerHTML = `<div class="ia">
    <div class="ia__topo"><span class="ia__titulo">${esc(titulo)}</span></div>
    ${dica ? `<p class="ia__dica">${md(dica)}</p>` : ''}
    <div class="ia__corpo"></div>
  </div>`;
  return el.querySelector('.ia__corpo');
}

export function deslizante(pai, { rotulo, min, max, passo = 1, valor, aoMudar, formatar = String }) {
  const id = 'ia-' + Math.random().toString(36).slice(2, 8);
  const caixaDesl = document.createElement('div');
  caixaDesl.className = 'ia__deslizante';
  caixaDesl.innerHTML = `<label for="${id}">${esc(rotulo)}</label>
    <input id="${id}" type="range" min="${min}" max="${max}" step="${passo}" value="${valor}">
    <output for="${id}"></output>`;
  pai.appendChild(caixaDesl);
  const input = caixaDesl.querySelector('input');
  const saida = caixaDesl.querySelector('output');
  const mudar = () => { saida.textContent = formatar(Number(input.value)); aoMudar(Number(input.value)); };
  input.addEventListener('input', mudar);
  mudar();
  return input;
}
