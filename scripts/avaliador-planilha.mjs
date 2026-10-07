// Avaliador de fórmulas do Excel (subconjunto usado pelas planilhas WAIS-III/WISC-IV da psicóloga).
// Lê o JSON gerado por scripts/exportar-para-colar.ps1 (células, fórmulas, fórmulas compartilhadas e tipos) e avalia as
// fórmulas OFFLINE, com os mesmos valores de entrada, reproduzindo a semântica do Excel (comparações entre tipos,
// células em branco, LOOKUP por busca binária, DATEDIF...). Serve de GABARITO para os módulos wais3.ts / wisc4.ts.
//
// Não executa macros nem abre o Excel: só interpreta o texto das fórmulas.

// ---------- valores ----------
export class Err {
  constructor(codigo) { this.codigo = codigo; }
  toString() { return this.codigo; }
}
export const NA = new Err("#N/A"), VALOR = new Err("#VALUE!"), DIV0 = new Err("#DIV/0!"), REF = new Err("#REF!"), NOME = new Err("#NAME?"), NUM = new Err("#NUM!");
const ERROS = { "#N/A": NA, "#VALUE!": VALOR, "#DIV/0!": DIV0, "#REF!": REF, "#NAME?": NOME, "#NUM!": NUM };
export class Mat {
  constructor(linhas, colunas, dados) { this.linhas = linhas; this.colunas = colunas; this.dados = dados; } // dados[r][c]
  plano() { return this.dados.flat(); }
}
const ehErro = (v) => v instanceof Err;
const ehMat = (v) => v instanceof Mat;

// ---------- endereços ----------
export function colParaNumero(letras) { let n = 0; for (const ch of letras) n = n * 26 + ch.charCodeAt(0) - 64; return n; }
export function numeroParaCol(n) { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
export function parseEndereco(a) { const m = /^\$?([A-Z]+)\$?(\d+)$/.exec(a); return m ? { c: colParaNumero(m[1]), r: Number(m[2]) } : null; }

// ---------- tokenizer + parser ----------
const RE_REF = /^(?:(?:'((?:[^']|'')+)'|([A-Za-z_][A-Za-z0-9_.]*))!)?(\$?[A-Z]{1,3}\$?\d+)(?::(\$?[A-Z]{1,3}\$?\d+))?/;

function tokenizar(f) {
  const tokens = [];
  let i = 0;
  while (i < f.length) {
    const ch = f[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '"') {
      let j = i + 1, s = "";
      while (j < f.length) { if (f[j] === '"') { if (f[j + 1] === '"') { s += '"'; j += 2; continue; } break; } s += f[j++]; }
      tokens.push({ t: "str", v: s }); i = j + 1; continue;
    }
    const resto = f.slice(i);
    let m;
    if ((m = /^#(?:N\/A|VALUE!|DIV\/0!|REF!|NAME\?|NUM!)/.exec(resto))) { tokens.push({ t: "err", v: m[0] }); i += m[0].length; continue; }
    if ((m = /^\d+\.?\d*(?:[eE][+-]?\d+)?|^\.\d+/.exec(resto)) && !/^[A-Za-z_]/.test(resto)) {
      // número (cuidado: "A1" começa com letra, então não cai aqui)
      tokens.push({ t: "num", v: Number(m[0]) }); i += m[0].length; continue;
    }
    if ((m = /^(?:'(?:[^']|'')+'|[A-Za-z_][A-Za-z0-9_.]*)!#REF!/.exec(resto))) { tokens.push({ t: "err", v: "#REF!" }); i += m[0].length; continue; }
    if ((m = RE_REF.exec(resto)) && !/^[A-Za-z_][A-Za-z0-9_.]*\(/.test(resto)) {
      const aposRef = resto[m[0].length];
      if (aposRef !== "(") {
        tokens.push({ t: "ref", planilha: m[1] !== undefined ? m[1].replace(/''/g, "'") : m[2], a: m[3], b: m[4] ?? null }); i += m[0].length; continue;
      }
    }
    if ((m = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(resto))) {
      const nome = m[0];
      if (resto[nome.length] === "(") { tokens.push({ t: "fn", v: nome.toUpperCase().replace(/^_XLFN\./, "") }); i += nome.length + 1; continue; }
      if (/^(TRUE|FALSE)$/i.test(nome)) { tokens.push({ t: "bool", v: /true/i.test(nome) }); i += nome.length; continue; }
      throw new Error(`nome não suportado: ${nome} em "${f.slice(0, 80)}"`);
    }
    if ((m = /^(<>|<=|>=|=|<|>|\+|-|\*|\/|\^|&|%|\(|\)|,|:)/.exec(resto))) { tokens.push({ t: "op", v: m[0] }); i += m[0].length; continue; }
    throw new Error(`caractere inesperado "${ch}" em "${f.slice(0, 80)}"`);
  }
  return tokens;
}

const PREC = { "=": 1, "<>": 1, "<": 1, ">": 1, "<=": 1, ">=": 1, "&": 2, "+": 3, "-": 3, "*": 4, "/": 4, "^": 5 };

function parsear(texto) {
  const tokens = tokenizar(texto.replace(/^=\s*/, ""));
  let p = 0;
  const olhar = () => tokens[p];
  const comer = () => tokens[p++];
  function primario() {
    const tk = comer();
    if (!tk) throw new Error("fim inesperado");
    if (tk.t === "num") return { t: "num", v: tk.v };
    if (tk.t === "str") return { t: "str", v: tk.v };
    if (tk.t === "bool") return { t: "bool", v: tk.v };
    if (tk.t === "err") return { t: "err", v: ERROS[tk.v] };
    if (tk.t === "ref") return { t: "ref", planilha: tk.planilha, a: tk.a, b: tk.b };
    if (tk.t === "fn") {
      const args = [];
      if (olhar()?.t === "op" && olhar().v === ")") { comer(); return { t: "fn", nome: tk.v, args }; }
      for (;;) {
        const n = olhar();
        if (n?.t === "op" && (n.v === "," || n.v === ")")) args.push({ t: "vazio" });
        else args.push(expressao(0));
        const sep = comer();
        if (sep?.t === "op" && sep.v === ")") break;
        if (!(sep?.t === "op" && sep.v === ",")) throw new Error("esperava , ou )");
      }
      return { t: "fn", nome: tk.v, args };
    }
    if (tk.t === "op" && tk.v === "(") { const e = expressao(0); const f = comer(); if (!(f?.t === "op" && f.v === ")")) throw new Error("esperava )"); return e; }
    if (tk.t === "op" && (tk.v === "-" || tk.v === "+")) { const a = expressao(6); return { t: "un", op: tk.v, a }; }
    throw new Error(`token inesperado ${JSON.stringify(tk)}`);
  }
  function expressao(min) {
    let esq = primario();
    for (;;) {
      const tk = olhar();
      if (tk?.t === "op" && tk.v === "%") { comer(); esq = { t: "pct", a: esq }; continue; }
      if (!(tk?.t === "op" && PREC[tk.v] !== undefined && PREC[tk.v] >= min)) break;
      comer();
      const dir = expressao(tk.v === "^" ? PREC[tk.v] : PREC[tk.v] + 1);
      esq = { t: "bin", op: tk.v, a: esq, b: dir };
    }
    return esq;
  }
  const ast = expressao(0);
  if (p < tokens.length) throw new Error(`sobrou texto após a fórmula: ${JSON.stringify(tokens[p])}`);
  return ast;
}

// ---------- coerções e comparação ----------
function paraNumero(v) {
  if (ehErro(v)) return v;
  if (v === null) return 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return VALOR;
    const n = Number(t.replace(",", "."));
    return Number.isNaN(n) ? VALOR : n;
  }
  return VALOR;
}
function paraTexto(v) {
  if (ehErro(v)) return v;
  if (v === null) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") return String(Number(v.toPrecision(15)));
  return String(v);
}
function paraBooleano(v) {
  if (ehErro(v)) return v;
  if (v === null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") { if (/^true$/i.test(v)) return true; if (/^false$/i.test(v)) return false; return VALOR; }
  return VALOR;
}
function comparar(a, b) {
  if (a === null) a = typeof b === "string" ? "" : typeof b === "boolean" ? false : 0;
  if (b === null) b = typeof a === "string" ? "" : typeof a === "boolean" ? false : 0;
  const rank = (v) => (typeof v === "number" ? 1 : typeof v === "string" ? 2 : 3);
  const ra = rank(a), rb = rank(b);
  if (ra !== rb) return ra < rb ? -1 : 1;
  if (ra === 1) return a < b ? -1 : a > b ? 1 : 0;
  if (ra === 2) { const x = a.toLowerCase(), y = b.toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; }
  return a === b ? 0 : a ? 1 : -1;
}

// ---------- matemática ----------
function erf(x) {
  // série/fração contínua com precisão ~1e-15
  const ax = Math.abs(x);
  let r;
  if (ax < 2.5) { let soma = ax, termo = ax, n = 0; do { n++; termo *= -ax * ax / n; soma += termo / (2 * n + 1); } while (Math.abs(termo / (2 * n + 1)) > 1e-17 && n < 200); r = (2 / Math.sqrt(Math.PI)) * soma; }
  else { let f = 0; for (let k = 60; k >= 1; k--) f = k / 2 / (ax + f); r = 1 - Math.exp(-ax * ax) / Math.sqrt(Math.PI) / (ax + f); }
  return x < 0 ? -r : r;
}
export const normalAcumulada = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
function normalInversa(p) {
  if (p <= 0 || p >= 1) return NUM;
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  let x;
  if (p < 0.02425) { const q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  else if (p > 1 - 0.02425) { const q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  else { const q = p - 0.5, r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  const e = normalAcumulada(x) - p; const u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
  return x - u / (1 + x * u / 2);
}

// ---------- datas ----------
const serialParaData = (s) => new Date(Date.UTC(1899, 11, 30) + Math.floor(s) * 86400000);
function datedif(inicio, fim, unidade) {
  const a = paraNumero(inicio), b = paraNumero(fim);
  if (ehErro(a)) return a; if (ehErro(b)) return b;
  if (a > b) return NUM;
  const d1 = serialParaData(a), d2 = serialParaData(b);
  const y1 = d1.getUTCFullYear(), m1 = d1.getUTCMonth(), dd1 = d1.getUTCDate(), y2 = d2.getUTCFullYear(), m2 = d2.getUTCMonth(), dd2 = d2.getUTCDate();
  let meses = (y2 - y1) * 12 + (m2 - m1); if (dd2 < dd1) meses -= 1;
  switch (String(unidade).toLowerCase()) {
    case "y": return Math.floor(meses / 12);
    case "m": return meses;
    case "d": return Math.floor(b) - Math.floor(a);
    case "ym": return meses % 12;
    case "md": return dd2 >= dd1 ? dd2 - dd1 : dd2 + new Date(Date.UTC(y2, m2, 0)).getUTCDate() - dd1;
    case "yd": { const aniv = new Date(Date.UTC(y2, m1, dd1)); const ref = aniv > d2 ? new Date(Date.UTC(y2 - 1, m1, dd1)) : aniv; return Math.round((d2 - ref) / 86400000); }
    default: return NUM;
  }
}

// ---------- pasta de trabalho ----------
export class Planilhas {
  // dados: { "<aba>": { celulas: [{c, v, f, s, t}] } }; abas em `soValores` usam sempre o valor em cache (tabelas de normas).
  constructor(dados, soValores = []) {
    this.abas = new Map();
    this.soValores = new Set(soValores);
    this.entradas = new Map(); // "aba!A1" -> valor
    this.memo = new Map();
    this.emAvaliacao = new Set();
    for (const [nome, aba] of Object.entries(dados)) {
      if (typeof aba === "string") continue;
      const celulas = new Map(aba.celulas.map((c) => [c.c, c]));
      const mestres = new Map();
      for (const c of aba.celulas) if (c.s != null && c.f && !String(c.f).startsWith("(f")) mestres.set(String(c.s), { endereco: c.c, ast: null, texto: c.f });
      this.abas.set(nome, { celulas, mestres, asts: new Map() });
    }
  }
  entrada(aba, endereco, valor) { this.entradas.set(`${aba}!${endereco}`, valor); this.memo.clear(); }
  limparEntradas() { this.entradas.clear(); this.memo.clear(); }
  astDe(aba, celula) {
    const info = this.abas.get(aba);
    const ehDependente = celula.s != null && String(celula.f ?? "").startsWith("(f");
    if (ehDependente) {
      const mestre = info.mestres.get(String(celula.s));
      if (!mestre) throw new Error(`mestre da fórmula compartilhada ${celula.s} não encontrado em ${aba}`);
      if (!mestre.ast) mestre.ast = parsear(mestre.texto);
      const m = parseEndereco(mestre.endereco), c = parseEndereco(celula.c);
      return { ast: mestre.ast, dr: c.r - m.r, dc: c.c - m.c };
    }
    let ast = info.asts.get(celula.c);
    if (!ast) { ast = parsear(celula.f); info.asts.set(celula.c, ast); }
    return { ast, dr: 0, dc: 0 };
  }
  valorConstante(c) {
    if (c === undefined) return null;
    if (c.t === "e") return ERROS[String(c.v)] ?? NA;
    if (c.t === "s" || c.t === "str") return c.v === null || c.v === undefined ? "" : String(c.v);
    if (typeof c.v === "boolean") return c.v;
    if (c.v === null || c.v === undefined || c.v === "") return c.v === "" ? "" : null;
    const n = Number(c.v);
    return Number.isNaN(n) ? String(c.v) : n;
  }
  valor(aba, endereco) {
    const chave = `${aba}!${endereco}`;
    if (this.entradas.has(chave)) return this.entradas.get(chave);
    const info = this.abas.get(aba);
    if (!info) return REF;
    const celula = info.celulas.get(endereco);
    if (celula === undefined) return null;
    if (!celula.f || this.soValores.has(aba)) return this.valorConstante(celula);
    if (this.memo.has(chave)) return this.memo.get(chave);
    if (this.emAvaliacao.has(chave)) return new Err("#CICLO");
    this.emAvaliacao.add(chave);
    let r;
    try {
      const { ast, dr, dc } = this.astDe(aba, celula);
      const p = parseEndereco(endereco);
      r = this.avaliar(ast, { aba, c: p.c, r: p.r, dr, dc });
      if (ehMat(r)) r = r.dados[0][0];
      if (r === null) r = 0;
    } catch (e) { r = new Err(`#ERRO:${e.message}`); }
    this.emAvaliacao.delete(chave);
    this.memo.set(chave, r);
    return r;
  }
  lerRef(no, ctx) {
    const aba = no.planilha ?? ctx.aba;
    const desloca = (txt) => {
      const m = /^(\$?)([A-Z]+)(\$?)(\d+)$/.exec(txt);
      const c = m[1] ? colParaNumero(m[2]) : colParaNumero(m[2]) + ctx.dc;
      const r = m[3] ? Number(m[4]) : Number(m[4]) + ctx.dr;
      return { c, r };
    };
    const A = desloca(no.a);
    if (!no.b) return this.valor(aba, numeroParaCol(A.c) + A.r);
    const B = desloca(no.b);
    const c0 = Math.min(A.c, B.c), c1 = Math.max(A.c, B.c), r0 = Math.min(A.r, B.r), r1 = Math.max(A.r, B.r);
    const dados = [];
    for (let r = r0; r <= r1; r++) { const linha = []; for (let c = c0; c <= c1; c++) linha.push(this.valor(aba, numeroParaCol(c) + r)); dados.push(linha); }
    return new Mat(r1 - r0 + 1, c1 - c0 + 1, dados);
  }
  // geometria de uma referência (para o LOOKUP estender o vetor de resultado)
  geometria(no, ctx) {
    const desloca = (txt) => { const m = /^(\$?)([A-Z]+)(\$?)(\d+)$/.exec(txt); return { c: m[1] ? colParaNumero(m[2]) : colParaNumero(m[2]) + ctx.dc, r: m[3] ? Number(m[4]) : Number(m[4]) + ctx.dr }; };
    const A = desloca(no.a), B = no.b ? desloca(no.b) : A;
    return { aba: no.planilha ?? ctx.aba, c0: Math.min(A.c, B.c), c1: Math.max(A.c, B.c), r0: Math.min(A.r, B.r), r1: Math.max(A.r, B.r) };
  }

  avaliar(no, ctx) {
    switch (no.t) {
      case "num": case "str": case "bool": case "err": return no.v;
      case "vazio": return null;
      case "ref": return this.lerRef(no, ctx);
      case "pct": { const a = this.avaliar(no.a, ctx); const n = paraNumero(a); return ehErro(n) ? n : n / 100; }
      case "un": { const a = this.avaliar(no.a, ctx); const n = elementwise1(a, (x) => { const v = paraNumero(x); return ehErro(v) ? v : no.op === "-" ? -v : v; }); return n; }
      case "bin": return binario(no.op, this.avaliar(no.a, ctx), this.avaliar(no.b, ctx));
      case "fn": return this.funcao(no, ctx);
      default: throw new Error(`nó desconhecido ${no.t}`);
    }
  }

  funcao(no, ctx) {
    const nome = no.nome, args = no.args;
    const ev = (i) => this.avaliar(args[i], ctx);
    const escalar = (v) => (ehMat(v) ? v.dados[0][0] : v);
    switch (nome) {
      case "IF": {
        const c = paraBooleano(escalar(ev(0)));
        if (ehErro(c)) return c;
        if (c) return args.length > 1 ? ev(1) : true;
        return args.length > 2 ? ev(2) : false;
      }
      case "AND": case "OR": {
        let achou = false, resultado = nome === "AND";
        for (let i = 0; i < args.length; i++) {
          const ehReferencia = args[i].t === "ref";
          const v = ev(i);
          const itens = ehMat(v) ? v.plano() : [v];
          for (const x of itens) {
            if (ehErro(x)) return x;
            let b;
            if (typeof x === "boolean") b = x;
            else if (typeof x === "number") b = x !== 0;
            else if (ehReferencia || ehMat(v)) continue; // texto/branco em referência é ignorado
            else if (x === null) b = false;
            else { b = paraBooleano(x); if (ehErro(b)) return b; }
            achou = true;
            if (nome === "AND") resultado = resultado && b; else resultado = resultado || b;
          }
        }
        return achou ? resultado : VALOR;
      }
      case "ABS": { const n = paraNumero(escalar(ev(0))); return ehErro(n) ? n : Math.abs(n); }
      case "QUOTIENT": { const a = paraNumero(escalar(ev(0))), b = paraNumero(escalar(ev(1))); if (ehErro(a)) return a; if (ehErro(b)) return b; return b === 0 ? DIV0 : Math.trunc(a / b); }
      case "MOD": { const a = paraNumero(escalar(ev(0))), b = paraNumero(escalar(ev(1))); if (ehErro(a)) return a; if (ehErro(b)) return b; return b === 0 ? DIV0 : a - b * Math.floor(a / b); }
      case "ROUND": case "ROUNDDOWN": {
        const a = paraNumero(escalar(ev(0))), d = paraNumero(escalar(ev(1))); if (ehErro(a)) return a; if (ehErro(d)) return d;
        const f = 10 ** d; const x = a * f;
        return (nome === "ROUND" ? Math.sign(x) * Math.round(Math.abs(x) + 1e-12) : Math.trunc(x)) / f;
      }
      case "SUM": {
        let soma = 0;
        for (let i = 0; i < args.length; i++) {
          const v = ev(i); const ehReferencia = args[i].t === "ref";
          const itens = ehMat(v) ? v.plano() : [v];
          for (const x of itens) {
            if (ehErro(x)) return x;
            if (typeof x === "number") soma += x;
            else if (!ehReferencia && !ehMat(v)) { const n = paraNumero(x); if (ehErro(n)) return n; soma += n; }
          }
        }
        return soma;
      }
      case "LARGE": case "SMALL": {
        const v = ev(0); const k = paraNumero(escalar(ev(1))); if (ehErro(k)) return k;
        const nums = (ehMat(v) ? v.plano() : [v]).filter((x) => typeof x === "number");
        const err = (ehMat(v) ? v.plano() : [v]).find(ehErro); if (err) return err;
        if (nums.length === 0 || k < 1 || k > nums.length) return NUM;
        nums.sort((a, b) => (nome === "LARGE" ? b - a : a - b));
        return nums[k - 1];
      }
      case "COUNTA": { let n = 0; for (let i = 0; i < args.length; i++) { const v = ev(i); for (const x of ehMat(v) ? v.plano() : [v]) if (x !== null) n++; } return n; }
      case "COUNTIF": {
        const v = ev(0); const crit = escalar(ev(1)); if (ehErro(crit)) return crit;
        const itens = ehMat(v) ? v.plano() : [v];
        let op = "=", alvo = crit;
        if (typeof crit === "string") { const m = /^(<>|<=|>=|=|<|>)(.*)$/.exec(crit); if (m) { op = m[1]; alvo = m[2]; } }
        const alvoNum = typeof alvo === "string" && alvo.trim() !== "" && !Number.isNaN(Number(alvo)) ? Number(alvo) : null;
        let n = 0;
        for (const x of itens) {
          if (ehErro(x) || x === null) continue;
          let igual;
          if (alvoNum !== null) igual = typeof x === "number" ? x === alvoNum : typeof x === "string" ? x.toLowerCase() === String(alvo).toLowerCase() : false;
          else if (typeof alvo === "number") igual = typeof x === "number" && x === alvo;
          else igual = typeof x === "string" && x.toLowerCase() === String(alvo).toLowerCase();
          let ok;
          if (op === "=") ok = igual; else if (op === "<>") ok = !igual;
          else { const cmp = typeof x === typeof (alvoNum ?? alvo) ? comparar(x, alvoNum ?? alvo) : null; ok = cmp === null ? false : op === "<" ? cmp < 0 : op === ">" ? cmp > 0 : op === "<=" ? cmp <= 0 : cmp >= 0; }
          if (ok) n++;
        }
        return n;
      }
      case "CONCATENATE": { let s = ""; for (let i = 0; i < args.length; i++) { const t = paraTexto(escalar(ev(i))); if (ehErro(t)) return t; s += t; } return s; }
      case "DATEDIF": return datedif(escalar(ev(0)), escalar(ev(1)), escalar(ev(2)));
      case "NORM.S.DIST": { const z = paraNumero(escalar(ev(0))); if (ehErro(z)) return z; const cum = paraBooleano(escalar(ev(1))); if (ehErro(cum)) return cum; return cum ? normalAcumulada(z) : Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); }
      case "NORM.S.INV": { const p = paraNumero(escalar(ev(0))); return ehErro(p) ? p : normalInversa(p); }
      case "SINGLE": {
        const v = ev(0);
        if (!ehMat(v)) return v;
        if (v.colunas === 1 && args[0].t === "ref") { const g = this.geometria(args[0], ctx); const idx = ctx.r - g.r0; return idx >= 0 && idx < v.linhas ? v.dados[idx][0] : VALOR; }
        if (v.linhas === 1 && args[0].t === "ref") { const g = this.geometria(args[0], ctx); const idx = ctx.c - g.c0; return idx >= 0 && idx < v.colunas ? v.dados[0][idx] : VALOR; }
        return VALOR;
      }
      case "LOOKUP": return this.lookup(no, ctx);
      case "VLOOKUP": {
        const x = escalar(ev(0)); const tabela = ev(1); const col = paraNumero(escalar(ev(2))); const aprox = args.length > 3 ? paraBooleano(escalar(ev(3))) : true;
        if (ehErro(x)) return x; if (!ehMat(tabela)) return VALOR;
        const chaves = tabela.dados.map((l) => l[0]);
        const idx = buscar(chaves, x, aprox);
        if (idx < 0) return NA;
        const r = tabela.dados[idx][col - 1]; return r === undefined ? REF : r;
      }
      default: throw new Error(`função não suportada: ${nome}`);
    }
  }

  lookup(no, ctx) {
    const args = no.args;
    const x = this.avaliar(args[0], ctx);
    if (ehErro(x)) return x;
    const vetor = this.avaliar(args[1], ctx);
    if (!ehMat(vetor)) return VALOR;
    let resultado = vetor;
    if (args.length > 2) {
      resultado = this.avaliar(args[2], ctx);
      if (ehMat(resultado) && resultado.plano().length < vetor.plano().length && args[2].t === "ref") {
        // o Excel estende o vetor de resultado ao tamanho do vetor de busca, a partir da primeira célula
        const g = this.geometria(args[2], ctx);
        const n = vetor.plano().length;
        const vertical = g.c0 === g.c1;
        const fimC = vertical ? g.c0 : g.c0 + n - 1;
        const fimR = vertical ? g.r0 + n - 1 : g.r0;
        resultado = this.lerRef(
          { t: "ref", planilha: g.aba, a: `$${numeroParaCol(g.c0)}$${g.r0}`, b: `$${numeroParaCol(fimC)}$${fimR}` },
          { aba: ctx.aba, dr: 0, dc: 0 }
        );
      }
    }
    const chaves = vetor.plano();
    const idx = buscar(chaves, Array.isArray(x) ? x[0] : ehMat(x) ? x.dados[0][0] : x, true);
    if (idx < 0) return NA;
    const r = resultado.plano()[idx];
    return r === undefined ? NA : r === null ? 0 : r;
  }
}

// busca aproximada (maior valor <= x) por busca binária sobre as entradas do mesmo tipo, ignorando brancos
function buscar(chaves, x, aproximada) {
  if (x === null) x = 0;
  const tipo = typeof x;
  const lista = [];
  chaves.forEach((k, i) => { if (k !== null && !ehErro(k) && typeof k === tipo) lista.push({ k, i }); });
  if (!aproximada) { const f = lista.find((e) => comparar(e.k, x) === 0); return f ? f.i : -1; }
  let lo = 0, hi = lista.length - 1, achado = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (comparar(lista[mid].k, x) <= 0) { achado = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return achado < 0 ? -1 : lista[achado].i;
}

function elementwise1(a, f) {
  if (ehMat(a)) return new Mat(a.linhas, a.colunas, a.dados.map((l) => l.map(f)));
  return f(a);
}
function binario(op, a, b) {
  if (ehMat(a) || ehMat(b)) {
    const A = ehMat(a) ? a : null, B = ehMat(b) ? b : null;
    const linhas = Math.max(A?.linhas ?? 1, B?.linhas ?? 1), colunas = Math.max(A?.colunas ?? 1, B?.colunas ?? 1);
    const dados = [];
    for (let r = 0; r < linhas; r++) { const l = []; for (let c = 0; c < colunas; c++) l.push(binario(op, A ? A.dados[Math.min(r, A.linhas - 1)][Math.min(c, A.colunas - 1)] : a, B ? B.dados[Math.min(r, B.linhas - 1)][Math.min(c, B.colunas - 1)] : b)); dados.push(l); }
    return new Mat(linhas, colunas, dados);
  }
  if (ehErro(a)) return a;
  if (ehErro(b)) return b;
  switch (op) {
    case "&": return paraTexto(a) + paraTexto(b);
    case "=": return comparar(a, b) === 0;
    case "<>": return comparar(a, b) !== 0;
    case "<": return comparar(a, b) < 0;
    case ">": return comparar(a, b) > 0;
    case "<=": return comparar(a, b) <= 0;
    case ">=": return comparar(a, b) >= 0;
  }
  const x = paraNumero(a), y = paraNumero(b);
  if (ehErro(x)) return x;
  if (ehErro(y)) return y;
  switch (op) {
    case "+": return x + y;
    case "-": return x - y;
    case "*": return x * y;
    case "/": return y === 0 ? DIV0 : x / y;
    case "^": return Math.pow(x, y);
  }
  throw new Error(`operador desconhecido ${op}`);
}
