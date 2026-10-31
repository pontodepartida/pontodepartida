import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASTAS = ['css', 'js', 'vendor', 'dados', 'img/icones'];
const AVULSOS = ['index.html', 'manifest.webmanifest'];
const EXTENSOES = /\.(html|css|js|json|webmanifest|woff2|png)$/;

function listar(pasta) {
  return readdirSync(join(RAIZ, pasta)).flatMap((nome) => {
    const rel = pasta + '/' + nome;
    return statSync(join(RAIZ, rel)).isDirectory() ? listar(rel) : [rel];
  });
}

const arquivos = [...AVULSOS, ...PASTAS.flatMap(listar).filter(a => EXTENSOES.test(a))].sort();

const hash = createHash('sha256');
let bytes = 0;
for (const a of arquivos) {
  const conteudo = readFileSync(join(RAIZ, a));
  bytes += conteudo.length;
  hash.update(a).update(conteudo);
}
const versao = hash.digest('hex').slice(0, 12);

const lista = arquivos.map(a => `  '${a === 'index.html' ? './' : a}',`).join('\n');
const caminhoSw = join(RAIZ, 'sw.js');
const sw = readFileSync(caminhoSw, 'utf8')
  .replace(/const VERSAO = '[^']*';/, `const VERSAO = '${versao}';`)
  .replace(/const ESSENCIAIS = \[[\s\S]*?\];/, `const ESSENCIAIS = [\n${lista}\n];`);
writeFileSync(caminhoSw, sw);

console.log(`sw.js: versão ${versao}, ${arquivos.length} arquivos, ${(bytes / 1024 / 1024).toFixed(1)} MB para uso sem internet.`);
