// Guarda o progresso no localStorage.

const PREFIXO = 'ponto-de-partida:';
const memoria = new Map();

function testar() {
  try {
    const k = PREFIXO + '__teste';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}

export const armazenamento = {
  disponivel: testar(),
  falhouAoGravar: false,

  ler(chave) {
    const k = PREFIXO + chave;
    if (this.disponivel) {
      try {
        const v = window.localStorage.getItem(k);
        if (v !== null) return v;
      } catch (e) { /* cai para a memória */ }
    }
    return memoria.has(k) ? memoria.get(k) : null;
  },

  gravar(chave, valor) {
    const k = PREFIXO + chave;
    memoria.set(k, valor);
    if (!this.disponivel) return false;
    try {
      window.localStorage.setItem(k, valor);
      return true;
    } catch (e) {
      this.falhouAoGravar = true;
      return false;
    }
  },

  apagar(chave) {
    const k = PREFIXO + chave;
    memoria.delete(k);
    if (!this.disponivel) return;
    try { window.localStorage.removeItem(k); } catch (e) { /* nada a fazer */ }
  },

  lerJSON(chave, padrao) {
    const v = this.ler(chave);
    if (v === null) return padrao;
    try { return JSON.parse(v); } catch (e) { return padrao; }
  },

  gravarJSON(chave, valor) {
    return this.gravar(chave, JSON.stringify(valor));
  },

  // Chaves salvas (sem o prefixo), do navegador e da memória.
  chaves() {
    const lista = new Set();
    if (this.disponivel) {
      try {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith(PREFIXO)) lista.add(k.slice(PREFIXO.length));
        }
      } catch (e) { /* fica só a memória */ }
    }
    for (const k of memoria.keys()) lista.add(k.slice(PREFIXO.length));
    return [...lista];
  },
};


const memoriaSessao = new Map();
export const sessao = {
  ler(chave) {
    try {
      const v = window.sessionStorage.getItem(PREFIXO + chave);
      if (v !== null) return v;
    } catch (e) { /* cai para a memória */ }
    return memoriaSessao.has(chave) ? memoriaSessao.get(chave) : null;
  },
  gravar(chave, valor) {
    memoriaSessao.set(chave, valor);
    try { window.sessionStorage.setItem(PREFIXO + chave, valor); } catch (e) { /* ignora */ }
  },
  apagar(chave) {
    memoriaSessao.delete(chave);
    try { window.sessionStorage.removeItem(PREFIXO + chave); } catch (e) { /* ignora */ }
  },
  lerJSON(chave, padrao) {
    const v = this.ler(chave);
    if (v === null) return padrao;
    try { return JSON.parse(v); } catch (e) { return padrao; }
  },
  gravarJSON(chave, valor) {
    this.gravar(chave, JSON.stringify(valor));
  },
};
