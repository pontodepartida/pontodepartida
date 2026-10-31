// Confere os arquivos de dados antes de publicar.
// Uso: node ferramentas/validar-dados.mjs

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { interativos } from '../js/interativos.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const lerJSON = (rel) => JSON.parse(readFileSync(join(RAIZ, rel), 'utf8'));
const LETRAS = ['A', 'B', 'C', 'D', 'E'];

const LIMITE = { errada: 25, essencial: 25, raciocinio: 120, dica: 30 };
const MAX_TEMAS = 2;

function palavras(texto) {
  const t = String(texto || '')
    .replace(/<div data-interativo[^>]*><\/div>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g, ' F ')
    .replace(/<[^>]+>/g, ' ');
  return t.split(/\s+/).filter(p => /[\p{L}\p{N}]/u.test(p)).length;
}

function partesRaciocinio(r) {
  const partes = { corpo: [], dicas: [] };
  for (const bloco of String(r || '').split(/\n\s*\n/)) {
    const b = bloco.trim();
    if (/^\*\*Dica de prova/.test(b)) partes.dicas.push(b);
    else partes.corpo.push(b);
  }
  return { corpo: partes.corpo.join('\n\n'), dicas: partes.dicas };
}

const erros = [];
const temas = lerJSON('dados/temas.json');
const materias = Object.keys(temas).filter(k => !k.startsWith('_'));

for (const m of materias) {
  const repetidos = temas[m].filter((t, i) => temas[m].indexOf(t) !== i);
  if (repetidos.length) erros.push(`temas.json: tema repetido em ${m}: ${repetidos.join(', ')}`);
}

const teoria = new Map();
for (const arq of readdirSync(join(RAIZ, 'dados/teoria')).filter(a => a.endsWith('.json'))) {
  const id = arq.replace(/\.json$/, '');
  let t;
  try { t = lerJSON('dados/teoria/' + arq); } catch (e) { erros.push(`teoria/${arq}: JSON inválido (${e.message})`); continue; }
  teoria.set(id, t);
  if (t.id !== id) erros.push(`teoria/${arq}: "id" deve ser "${id}"`);
  if (!materias.includes(t.materia)) erros.push(`teoria/${arq}: matéria "${t.materia}" não existe em temas.json`);
  else if (!temas[t.materia].includes(t.grupo)) erros.push(`teoria/${arq}: grupo "${t.grupo}" não está na lista de ${t.materia} em temas.json`);
  for (const c of ['titulo', 'texto']) {
    if (typeof t[c] !== 'string' || !t[c].trim()) erros.push(`teoria/${arq}: campo "${c}" vazio ou ausente`);
  }
  if (!Array.isArray(t.videos)) erros.push(`teoria/${arq}: "videos" deve ser uma lista (pode ser vazia)`);
  for (const v of t.videos || []) {
    if (!v || !v.titulo || !/^https:\/\//.test(v.url || '')) erros.push(`teoria/${arq}: vídeo precisa de "titulo" e "url" com https://`);
  }
  for (const m of String(t.texto || '').matchAll(/data-interativo="([^"]+)"/g)) {
    if (!interativos[m[1]]) erros.push(`teoria/${arq}: interativo "${m[1]}" não existe em js/interativos.js`);
  }
}
const temasUsados = new Set();

const { provas } = lerJSON('dados/provas.json');
const ids = new Set();

for (const item of provas) {
  if (ids.has(item.id)) erros.push(`provas.json: id repetido "${item.id}"`);
  ids.add(item.id);
  if (!existsSync(join(RAIZ, 'dados', item.arquivo))) {
    erros.push(`provas.json: arquivo dados/${item.arquivo} não existe`);
    continue;
  }
  const prova = lerJSON('dados/' + item.arquivo);
  const gabarito = prova.questoes.map(q => q.anulada ? '*' : q.correta).join('');
  if (item.gabarito !== gabarito) erros.push(`provas.json: o gabarito de "${item.id}" está desatualizado (rode node ferramentas/gerar-sw.mjs)`);
  const onde = (q) => `${item.arquivo}, questão ${q.numero}`;

  prova.questoes.forEach((q, i) => {
    if (q.numero !== i + 1) erros.push(`${item.arquivo}: a ${i + 1}ª questão tem número ${q.numero}`);

    if (!materias.includes(q.materia)) {
      erros.push(`${onde(q)}: matéria "${q.materia}" não existe em temas.json`);
    } else if (!temas[q.materia].includes(q.conteudo)) {
      erros.push(`${onde(q)}: tema "${q.conteudo}" não está na lista de ${q.materia} em temas.json`);
    }

    const alts = Object.keys(q.alternativas || {});
    const letras = LETRAS.slice(0, alts.length);
    if (alts.join() !== letras.join() || alts.length < 4) erros.push(`${onde(q)}: alternativas devem ser A–D ou A–E`);
    if (prova.questoes[0] && alts.length !== Object.keys(prova.questoes[0].alternativas || {}).length) {
      erros.push(`${onde(q)}: todas as questões da prova devem ter o mesmo número de alternativas`);
    }

    if (q.anulada) {
      if (q.correta !== null) erros.push(`${onde(q)}: questão anulada deve ter "correta": null`);
    } else {
      if (!letras.includes(q.correta)) erros.push(`${onde(q)}: "correta" deve ser uma das letras ${letras.join(', ')}`);
      const esperadas = letras.filter(l => l !== q.correta);
      const tem = Object.keys(q.porQueErradas || {}).sort();
      if (tem.join() !== esperadas.join()) erros.push(`${onde(q)}: "porQueErradas" deve explicar ${esperadas.join(', ')}`);
    }

    for (const campo of ['enunciado', 'raciocinio']) {
      if (!String(q[campo] || '').trim()) erros.push(`${onde(q)}: campo "${campo}" vazio`);
    }

    for (const [l, t] of Object.entries(q.porQueErradas || {})) {
      const n = palavras(t);
      if (n > LIMITE.errada) erros.push(`${onde(q)}: a explicação da alternativa ${l} tem ${n} palavras (máximo ${LIMITE.errada})`);
    }

    if (!Array.isArray(q.essencial) || q.essencial.length < 2 || q.essencial.length > 4) {
      erros.push(`${onde(q)}: "essencial" deve ter de 2 a 4 tópicos`);
    } else {
      q.essencial.forEach((t, i) => {
        const n = palavras(t);
        if (!n) erros.push(`${onde(q)}: tópico ${i + 1} de "essencial" vazio`);
        if (n > LIMITE.essencial) erros.push(`${onde(q)}: tópico ${i + 1} de "essencial" tem ${n} palavras (máximo ${LIMITE.essencial})`);
      });
    }

    const { corpo, dicas } = partesRaciocinio(q.raciocinio);
    const nCorpo = palavras(corpo);
    if (nCorpo > LIMITE.raciocinio) erros.push(`${onde(q)}: o raciocínio tem ${nCorpo} palavras (máximo ${LIMITE.raciocinio}, sem contar a dica)`);
    if (dicas.length > 1) erros.push(`${onde(q)}: o raciocínio tem ${dicas.length} dicas de prova (máximo 1)`);
    for (const d of dicas) {
      const n = palavras(d);
      if (n > LIMITE.dica) erros.push(`${onde(q)}: a dica de prova tem ${n} palavras (máximo ${LIMITE.dica})`);
    }

    if (!Array.isArray(q.teoria) || !q.teoria.length) {
      erros.push(`${onde(q)}: "teoria" deve ser uma lista de temas de dados/teoria/`);
    } else {
      if (q.teoria.length > MAX_TEMAS) erros.push(`${onde(q)}: "teoria" tem ${q.teoria.length} temas (máximo ${MAX_TEMAS})`);
      for (const id of q.teoria) {
        temasUsados.add(id);
        if (!teoria.has(id)) erros.push(`${onde(q)}: tema de teoria "${id}" não existe em dados/teoria/`);
      }
      const titulos = q.teoria.map(id => teoria.get(id)?.titulo).filter(Boolean);
      const citados = [...String(q.raciocinio || '').matchAll(/veja:? ([^)]*)\)/g)]
        .flatMap(m => [...m[1].matchAll(/\*([^*]+)\*/g)].map(x => x[1]));
      for (const c of citados) {
        if (!titulos.includes(c)) erros.push(`${onde(q)}: o raciocínio remete a "${c}", que não é título de um tema da questão`);
      }
      for (const t of titulos) {
        if (!citados.includes(t)) erros.push(`${onde(q)}: o tema "${t}" está em "teoria" mas o raciocínio não remete a ele`);
      }
    }
    if ('videos' in q) erros.push(`${onde(q)}: "videos" fica no arquivo do tema (dados/teoria/), não na questão`);

    for (const img of q.imagens || []) {
      if (!existsSync(join(RAIZ, img))) erros.push(`${onde(q)}: imagem ${img} não existe`);
    }

    const textos = [q.enunciado, q.raciocinio, ...Object.values(q.porQueErradas || {})].join('\n');
    const tipos = [...textos.matchAll(/data-interativo="([^"]+)"/g)].map(m => m[1]);
    if (q.interativo) tipos.push(q.interativo.tipo);
    for (const t of tipos) {
      if (!interativos[t]) erros.push(`${onde(q)}: interativo "${t}" não existe em js/interativos.js`);
    }
  });
}

for (const id of teoria.keys()) {
  if (!temasUsados.has(id)) erros.push(`teoria/${id}.json: nenhuma questão usa este tema`);
}
const listaTeoria = lerJSON('dados/provas.json').teoria || [];
if (listaTeoria.length !== temasUsados.size || listaTeoria.some(id => !temasUsados.has(id))) {
  erros.push('provas.json: a lista "teoria" está desatualizada (rode node ferramentas/gerar-sw.mjs)');
}

const frases = lerJSON('dados/frases.json');
const conferirFrase = (f, onde) => {
  for (const c of ['texto', 'autor', 'fonte']) {
    if (typeof f?.[c] !== 'string' || !f[c].trim()) erros.push(`frases.json, ${onde}: campo "${c}" vazio ou ausente`);
  }
  if (typeof f?.atribuida !== 'boolean') erros.push(`frases.json, ${onde}: "atribuida" deve ser true ou false`);
};
conferirFrase(frases.destaque, 'destaque');
if (!Array.isArray(frases.aleatorias) || !frases.aleatorias.length) erros.push('frases.json: "aleatorias" deve ter pelo menos uma frase');
else frases.aleatorias.forEach((f, i) => conferirFrase(f, `aleatória ${i + 1}`));

if (erros.length) {
  console.error(`✕ ${erros.length} problema(s) nos dados:\n` + erros.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`✓ Dados válidos: ${provas.length} prova(s), temas conferidos com dados/temas.json, ${teoria.size} tema(s) de teoria, ${frases.aleatorias.length + 1} frase(s).`);
