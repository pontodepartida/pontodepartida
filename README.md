# Ponto de Partida

App web de estudos com questões de provas antigas do processo seletivo do IFSP (cursos técnicos integrados ao ensino médio). O aluno responde uma questão por vez e, ao confirmar, vê três explicações: o raciocínio para resolver, por que as outras alternativas estão erradas e a base teórica.

Site estático (HTML, CSS e JavaScript, sem etapa de build), pensado para o GitHub Pages. Fontes e bibliotecas ficam dentro do projeto, em `vendor/`.

## Rodar localmente

O app carrega os arquivos JSON com `fetch`, então precisa de um servidor (abrir o `index.html` direto no navegador não funciona).

```sh
python -m http.server 8000
```

Depois, abra <http://localhost:8000>.

## Estrutura

```
index.html            página única
css/estilo.css        tokens e componentes do design
js/app.js             telas, rotas, progresso, diálogos e teclado
js/texto.js           Markdown + fórmulas KaTeX
js/azulejos.js        faixa de azulejos do cabeçalho
js/armazenamento.js   localStorage com alternativa em memória
js/interativos.js     registro dos componentes interativos
js/interativos/       kit.js (peças comuns), comuns.js (usados por mais de uma prova) e os componentes de cada prova
vendor/               fontes Bricolage Grotesque, Source Sans 3 e IBM Plex Mono (Google Fonts, licença OFL), KaTeX 0.16.11 e marked 12.0.2
dados/provas.json     lista de provas (a ordem aqui é a ordem no app)
dados/temas.json      lista fixa de temas por matéria
dados/frases.json     frases sobre educação (destaque da home e sorteio do resultado)
dados/<prova>.json    uma prova por arquivo
dados/teoria/         biblioteca de teoria: um arquivo por tema (as questões só guardam referências)
img/<prova>/          imagens recortadas de cada prova
REVISAR.md            discordâncias e observações sobre os gabaritos
ferramentas/          validar-dados.mjs: confere os dados antes de publicar
```

## Adicionar uma prova

1. Crie `dados/ps-AAAA-N-x.json` (veja o formato abaixo) e as imagens em `img/AAAA-N-x/`. Quando os cadernos de um ano têm as mesmas questões em outra ordem (como os Tipos 1 e 2 de 2026), cadastre só um, sem a letra: `ps-2026-1`.
2. Acrescente a prova em `dados/provas.json`:

```json
{ "id": "ps-2024-1-b", "nome": "PS 2024.1 – Prova B", "arquivo": "ps-2024-1-b.json" }
```

O `id` aparece no endereço (`#/ps-2024-1-b/5`) e é a chave do progresso salvo no navegador. Não mude o `id` de uma prova já publicada, senão o progresso dos alunos se perde.

## Formato de cada questão

```json
{
  "numero": 17,
  "materia": "Matemática",
  "conteudo": "Teorema de Pitágoras",
  "enunciado": "...",
  "imagens": ["img/2024-1-a/q17.png"],
  "alternativas": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correta": "B",
  "anulada": false,
  "porQueErradas": { "A": "...", "C": "...", "D": "..." },
  "teoria": ["teorema-de-pitagoras", "raizes-e-radicais"],
  "essencial": ["...", "..."],
  "raciocinio": "...",
  "interativo": null
}
```

- **Número de alternativas:** as provas até 2025 têm 4 (A–D); a partir de 2026, 5 (A–E). As duas formas funcionam, mas todas as questões de uma mesma prova precisam ter o mesmo número (o verificador confere). No teclado, o aluno pode usar as letras A–E.
- **Questão anulada:** `"anulada": true` e `"correta": null`. Ela conta como acerto para todos e nunca aparece como erro. Em `porQueErradas`, comente todas as alternativas.
- **`conteudo`** é o tema da questão e aparece na lista “Para revisar” do resultado. Ele precisa ser um dos temas fixos de [dados/temas.json](dados/temas.json) (15 de Português e 14 de Matemática), para que as provas usem os mesmos nomes. Isso é **obrigatório**: rode `node ferramentas/validar-dados.mjs` antes de publicar. Ele falha se algum tema estiver fora da lista e também confere alternativas, gabarito, explicações, imagens e a biblioteca de teoria. Para criar um tema novo, acrescente-o primeiro em `temas.json`.
- **`imagens`** lista as imagens usadas na questão (para referência). Onde cada imagem aparece é definido pelo próprio texto (veja abaixo).
- **`teoria`** é a lista de temas da biblioteca (`dados/teoria/<id>.json`) que a questão usa: **no máximo 2**, os mais importantes. Na “Base teórica”, eles viram os botões de “Quer se aprofundar?”. Veja “Biblioteca de teoria” abaixo.
- **`essencial`** é o resumo da teoria escrito para esta questão (veja “As três explicações”).
- **`interativo`:** opcional. Use `{ "tipo": "nome", ...configurações }` e registre uma função com o mesmo nome em `js/interativos.js`. O componente aparece logo abaixo dos textos de apoio, **antes** de o aluno responder (cuidado para não entregar a resposta).

### As três explicações

As seções aparecem nesta ordem: **Raciocínio para resolver** (aberta), **Por que as outras estão erradas** e **Base teórica** (recolhidas). Se o aluno abrir ou fechar uma seção, a escolha vale até ele fechar a aba. Cada seção tem uma função e não repete as outras:

- **`raciocinio`:** o passo a passo desta questão, com os números e trechos dela. **Até 120 palavras.** Quando precisa de um conceito, remete ao tema com “(veja: *Título do tema*)”, usando o título exato do arquivo; cada tema listado em `teoria` deve ser citado assim pelo menos uma vez. Termina com no máximo uma **Dica de prova** (até 30 palavras, fora do limite de 120), e só se ela for útil e diferente das dicas já dadas em questões do mesmo tema.
- **`porQueErradas`:** uma frase por alternativa errada, apontando o erro específico (conta errada, conceito confundido, leitura equivocada). **Até 25 palavras.** Não reexplica a teoria.
- **Base teórica**, em duas camadas:
  - **`essencial`:** de 2 a 4 tópicos curtos (**até 25 palavras cada**), só com o conceito que esta questão usa, escritos para ela. Pode trazer um exemplo do próprio texto da questão.
  - **`teoria`:** até 2 referências à biblioteca. Embaixo do essencial, “Quer se aprofundar?” mostra um botão por tema, que abre o tema completo (com os vídeos) num painel por cima da questão. A teoria completa nunca é escrita dentro da questão.

As palavras são contadas como no verificador: cada fórmula `\\( … \\)` vale uma palavra, e imagens e interativos não contam.

As explicações seguem sempre o gabarito oficial do IFSP e não questionam a banca nem o enunciado.

### Biblioteca de teoria

Cada tema fica em `dados/teoria/<id>.json` e é escrito **uma única vez**:

```json
{
  "id": "principio-multiplicativo",
  "titulo": "Princípio multiplicativo",
  "materia": "Matemática",
  "grupo": "Contagem, probabilidade e estatística",
  "texto": "definição, exemplos e, quando ajuda, uma tabela ou um esquema (Markdown + fórmulas)",
  "videos": [{ "titulo": "...", "url": "https://..." }]
}
```

- O nome do arquivo é o `id`, que é o que as questões citam em `"teoria"`.
- **`grupo`** é um dos temas fixos de [dados/temas.json](dados/temas.json), da mesma matéria. Na página **Teoria**, os temas aparecem reunidos por grupo, na ordem de `temas.json`. Use o `conteudo` das questões que mais citam o tema.
- A página Teoria lista os temas citados pelas questões (o verificador garante que todos são citados), então não há índice para manter.
- Se uma questão precisa de algo que o tema ainda não cobre, complete o **arquivo do tema**, e não a questão.
- Os vídeos ficam no tema e aparecem no fim dele, no painel do tema completo.
- O app carrega os temas sob demanda, quando a questão é aberta.
- O verificador confere se todo tema citado existe, se todo tema é usado por alguma questão e se os campos estão preenchidos.

### Interativos nas explicações

Use um interativo **apenas** quando manipular algo revela o raciocínio de um jeito que uma imagem ou uma tabela não revelam (contagem, probabilidade, porcentagens em sequência, gráficos de função, geometria). Não use em interpretação de texto, gramática ou definições. Cada interativo tem um único objetivo, uma frase curta dizendo o que o aluno deve observar, e funciona no celular (toque, sem depender de passar o mouse). Antes de programar um interativo novo, proponha-o em [REVISAR.md](REVISAR.md).

Os interativos que explicam a resolução ficam **dentro do raciocínio** e por isso só aparecem depois que o aluno confirma a resposta. Escreva numa linha própria, com linha em branco antes e depois:

```
<div data-interativo="q17-mediatriz"></div>
```

Atributos `data-*` extras chegam ao componente como configuração (ex.: `data-imagem="img/..."`). O nome precisa estar registrado em [js/interativos.js](js/interativos.js); o verificador acusa nomes que não existem.

- [js/interativos/kit.js](js/interativos/kit.js) tem as peças prontas: a **caixa** padrão (`caixa`, com título e a frase do que observar), o **controle deslizante** (`deslizante`) e utilidades de SVG e formatação.
- [js/interativos/comuns.js](js/interativos/comuns.js) tem os componentes usados por mais de uma prova. Hoje: `porcentagens-sequencia`, configurado pelo texto, por exemplo `<div data-interativo="porcentagens-sequencia" data-inicial="800" data-v1="-10" data-v2="-5" data-prefixo="R$ " data-conclusao="..."></div>`.
- Cada prova tem seus componentes em `js/interativos/<prova>-matematica.js`.
- As animações respeitam `prefers-reduced-motion`.

### Como escrever os textos

Todos os campos de texto aceitam Markdown e fórmulas:

| Escreva | Para |
|---|---|
| `#### Texto 1` | rótulo pequeno acima de um texto de apoio |
| `> ...` | texto de apoio dentro de uma caixa (`> ### Título` para o título centralizado) |
| `<cite>Fonte...</cite>` | referência da fonte |
| `**negrito**`, `*itálico*`, `<u>sublinhado</u>` | destaques do caderno de prova |
| `![descrição](img/... "transcrição")` | imagem clicável; a transcrição é opcional e usa ` \| ` para quebrar linha |
| `\\( ... \\)` e `\\[ ... \\]` | fórmulas em linha e em bloco (no JSON, a barra invertida é dobrada) |
| tabelas do Markdown | tabelas |
| quebra de linha simples | quebra de linha (útil para poemas) |

O **último parágrafo do enunciado** é tratado como o comando da questão: no computador, ele aparece em negrito ao lado das alternativas. Se o enunciado termina com uma imagem ou com `<cite>`, ele fica inteiro na coluna da esquerda.

## Tela cheia (só no computador)

Nas telas de questão, o botão **⛶ Tela cheia** (ou a tecla **F**) esconde o cabeçalho e o mapa e mostra a questão inteira no tamanho da tela. O app mede a área disponível e procura o maior tamanho de letra, entre 14 e 30 px, em que as duas colunas cabem sem rolagem. Esse cálculo é refeito ao mudar o tamanho da janela, ao carregar imagens e fontes e ao trocar de questão.

- Se o texto não couber nem em 14 px, o texto de apoio passa a ocupar várias colunas, como num jornal.
- Se ainda assim não couber (por exemplo, a Q7 num monitor de 1366×768), a coluna ganha rolagem e aparece o aviso “Role para ver…”.
- Depois de confirmar, **Ver explicações** abre as três seções num painel lateral.
- **Esc** ou **Sair da tela cheia** voltam ao layout normal. Ir para o resultado ou para o início também sai do modo.

## Frases sobre educação

Ficam em [dados/frases.json](dados/frases.json). A frase em `destaque` aparece fixa no topo da tela inicial. A tela de resultado sorteia uma das `aleatorias`, sem repetir a última exibida, que fica guardada no navegador. Cada frase tem `texto`, `autor`, `fonte` e `atribuida`. Na tela aparece só o autor; a `fonte` fica no arquivo, como registro. Use `"atribuida": true` quando a autoria vem de uma fonte indireta: o app mostra “atribuída a [autor]”. Para incluir frases, basta editar esse arquivo. O verificador confere se todos os campos estão preenchidos.

## Página Sobre e rodapé

A página **Sobre** (`#/sobre`) reúne cinco blocos: projeto independente, de onde vêm as provas, sobre as explicações, privacidade e contato. Os textos ficam na constante `SOBRE` de [js/app.js](js/app.js), e o e-mail, em `CONTATO`. Dá para abrir direto num bloco: `#/sobre/privacidade`, `#/sobre/contato`.

O rodapé segue o fim da tela de Início do design (rejunte de 2 px no topo, texto secundário e links azuis sublinhados) e aparece em todas as telas, menos na tela cheia. Os links são Ajuda, Sobre e Contato.

## Ajuda, passo a passo e dicas

A página **Ajuda** (`#/ajuda`) explica cada recurso do app, um bloco por assunto, com atalhos no topo. Os textos ficam na constante `AJUDA` de [js/app.js](js/app.js), e dá para abrir direto num bloco: `#/ajuda/simulado`, `#/ajuda/atalhos`. Ao mudar um comportamento do app, atualize o bloco correspondente.

As orientações aparecem **uma vez só** e sempre podem ser puladas:

- **Boas-vindas** (3 passos), no primeiro acesso. Chave `boas-vindas`.
- **Primeiro simulado:** as regras vêm em 3 passos (tempo, gabarito no fim, sem pausa) antes de começar. Depois disso, começar um simulado pede só uma confirmação curta. Chave `intro-simulado`, gravada só quando o aluno começa de fato.
- **Dicas** numa faixa discreta no topo da tela, que somem em “Entendi”: na primeira questão (só no celular: ▦ e Aa) e na primeira revisão. Chaves `dica:questao` e `dica:revisao`; os textos ficam em `DICAS`.

O passo a passo usa `abrirPassos()`, que serve para qualquer sequência curta de passos.

## Progresso do aluno

As respostas ficam no `localStorage` do navegador, numa chave por prova (`ponto-de-partida:prova:<id>`). Se o navegador bloquear o armazenamento (janela anônima, configuração de privacidade), o app continua funcionando em memória e avisa na tela inicial que nada será salvo.

Na tela inicial, **↓ Exportar progresso** baixa um arquivo `.json` com as respostas do estudo, os resultados dos simulados e o tamanho da letra de cada prova. **↑ Importar**, no outro navegador, troca o progresso de lá pelo do arquivo (depois de pedir confirmação).

O **tamanho da letra** (botão **Aa** nas telas de questão) vale só para a prova aberta e fica salvo em `ponto-de-partida:letra:<id>`. Na tela cheia, o app continua escolhendo a letra sozinho.

## Simulado

Na tela inicial, a chave **Estudar / ◷ Simulado** troca os cartões de “Todas as provas”. No modo Simulado, cada prova tem 3 horas, sem gabarito nem explicação até o fim. A resposta é gravada ao tocar na alternativa e pode ser trocada até terminar. Cada questão pode ser **marcada para revisar** (⚑ no mapa). Quando faltam 20 minutos, aparece o aviso para conferir e transcrever as respostas, e no zero o simulado é encerrado sozinho.

- **Não existe simulado pela metade.** O andamento fica no `sessionStorage` da aba (`simulado-andamento:<id>`): recarregar a página mantém, mas fechar a aba ou sair da prova (pelo ←, por um link ou pelo voltar do navegador) apaga. Antes de sair, o app pergunta.
- **O tempo conta pelo relógio**, desde o começo: ele não pausa com a aba em segundo plano nem ao recarregar.
- Só o **resultado do último simulado** de cada prova fica salvo (`ponto-de-partida:simulado:<id>`). Ele não mexe no progresso do modo estudo.
- O resultado lista as 30 questões; cada linha abre a revisão com as explicações, igual ao modo estudo.
- Rotas: `#/<id>/simulado/<n>`, `#/<id>/simulado/resultado`, `#/<id>/simulado/revisao/<n>`.

## Página Teoria

`#/teoria` reúne todos os temas da biblioteca, com uma aba por matéria e busca (sem acento, pelo título ou pelo grupo). Dentro de cada aba, os temas aparecem reunidos pelo campo `grupo`, na ordem de [dados/temas.json](dados/temas.json). Cada tema abre numa página própria, `#/teoria/<id>`, com o texto completo e os vídeos.
