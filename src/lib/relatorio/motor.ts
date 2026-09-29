// Motor do Relatório de Frequência — função PURA (sem banco, sem React).
// Recebe pessoas, turmas, datas com chamada e presenças e devolve todos os
// números do relatório. Fica separado das telas para poder ser testado contra
// o relatório de referência (PDF de 23/09/2026) e reaproveitado no Início, na
// Frequência e na página imprimível.
//
// Metodologia (a mesma do relatório de referência):
//  • Frequência de cada pessoa = nº de aulas em que esteve presente:
//    1 aula (só uma vez) · 2–3 (esporádico) · 4 ou mais (frequente).
//  • Metades do semestre: a 1ª metade são as primeiras floor(n/2) datas e a 2ª
//    as últimas floor(n/2) (com número ímpar de aulas, a data do meio fica de
//    fora da comparação de totais — é assim no relatório de referência).
//    Já o PADRÃO de cada pessoa (nas duas metades / começou depois / começou
//    e parou) usa 'primeiras ceil(n/2)' × 'últimas floor(n/2)': a data do meio
//    conta como primeira metade.
//  • Quem frequentou mais de uma turma entra na análise só da turma onde
//    esteve mais vezes (empate: a primeira da lista); a presença por data
//    (média por aula, picos, metades) conta todo mundo que estava na sala.
//  • Padrão de presença: "duas metades", "só uma vez", "começou depois"
//    (só na 2ª metade) e "começou e parou" (só na 1ª metade).
//  • Idade: calculada pela data de nascimento na data de referência.
//  • Público de referência: homens membros adultos (Homens), mulheres membros
//    adultas (Mulheres), membros de 45+ (Panorama Bíblico).

export type Tipo = "membro" | "visitante";
export type Genero = "M" | "F";

export interface EntradaPessoa {
  id: string;
  nome: string;
  tipo: Tipo;
  genero: Genero | null;
  nascimento: string | null; // YYYY-MM-DD
}
export interface EntradaTurma {
  id: string;
  nome: string;
  titulo: string | null;
}
export interface EntradaAula {
  id: string;
  turmaId: string;
  data: string; // YYYY-MM-DD — só datas COM chamada
}
export interface EntradaPresenca {
  aulaId: string;
  pessoaId: string; // só status 'presente'
}

export const FAIXAS = ["18-25", "26-35", "36-45", "46-55", "56-65", "66+"] as const;
export type Faixa = (typeof FAIXAS)[number];

export interface PontoData {
  data: string;
  presentes: number;
}
export interface LinhaPessoa {
  id: string;
  nome: string;
  idade: number | null;
  membro: boolean;
  frequencia: number;
}
export interface Pico {
  valor: number;
  datas: string[];
}
export interface RelatorioTurma {
  turma: EntradaTurma;
  datas: PontoData[]; // ordem cronológica
  pessoas: LinhaPessoa[]; // menos frequente → mais frequente, depois nome
  distintas: number;
  membros: number;
  visitantes: number;
  idadeMedia: number | null;
  frequentes: number;
  esporadicos: number;
  umaVez: number;
  mediaPorAula: number;
  primeiraMetade: { datas: string[]; total: number };
  segundaMetade: { datas: string[]; total: number };
  variacaoPct: number | null;
  padroes: {
    duasMetades: string[];
    umaVez: string[];
    comecouDepois: string[];
    comecouEParou: string[];
  };
  saldo: number;
  idadePorGrupo: { frequentes: number | null; esporadicos: number | null; umaVez: number | null };
  picoMaior: Pico | null;
  picoMenor: Pico | null;
  referencia: { rotulo: string; total: number } | null;
  participacaoPct: number | null;
  frequentesAbaixoReferencia: string[]; // frequentes fora do público de referência (ex.: < 45 no Panorama)
}
export interface LinhaFaixa {
  faixa: Faixa;
  membros: number;
  passaram: number;
  taxa: number | null;
  frequentes: number;
}
export interface RelatorioGeral {
  hoje: string;
  inicio: string | null;
  fim: string | null;
  aulas: number; // datas distintas com chamada
  turmas: RelatorioTurma[];
  distintas: number;
  membros: number;
  visitantes: number;
  umaVez: number;
  esporadicos: number;
  frequentes: number;
  igreja: {
    membros: number;
    adultos: number;
    passaram: number;
    frequentes: number;
    idadeConhecida: number; // pessoas da EBD com idade cruzada
  };
  faixas: LinhaFaixa[];
}

export function idadeEm(nascimento: string | null, hoje: string): number | null {
  if (!nascimento) return null;
  const [a, m, d] = nascimento.split("-").map(Number);
  const [ha, hm, hd] = hoje.split("-").map(Number);
  if (!a || !m || !d) return null;
  let idade = ha - a;
  if (hm < m || (hm === m && hd < d)) idade -= 1;
  return idade;
}

export function faixaDaIdade(idade: number): Faixa | null {
  if (idade < 18) return null;
  if (idade <= 25) return "18-25";
  if (idade <= 35) return "26-35";
  if (idade <= 45) return "36-45";
  if (idade <= 55) return "46-55";
  if (idade <= 65) return "56-65";
  return "66+";
}

function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

function picos(datas: PontoData[]): { maior: Pico | null; menor: Pico | null } {
  if (datas.length === 0) return { maior: null, menor: null };
  const max = Math.max(...datas.map((d) => d.presentes));
  const min = Math.min(...datas.map((d) => d.presentes));
  return {
    maior: { valor: max, datas: datas.filter((d) => d.presentes === max).map((d) => d.data) },
    menor: { valor: min, datas: datas.filter((d) => d.presentes === min).map((d) => d.data) },
  };
}

export function montarRelatorio(entrada: {
  turmas: EntradaTurma[];
  aulas: EntradaAula[];
  presencas: EntradaPresenca[];
  pessoas: EntradaPessoa[];
  hoje: string; // YYYY-MM-DD, data de referência das idades
}): RelatorioGeral {
  const { turmas, aulas, presencas, pessoas, hoje } = entrada;
  const pessoaPorId = new Map(pessoas.map((p) => [p.id, p]));
  const aulaPorId = new Map(aulas.map((a) => [a.id, a]));
  const idade = (id: string) => idadeEm(pessoaPorId.get(id)?.nascimento ?? null, hoje);

  // presenças por turma e por pessoa
  const porTurma = new Map<string, Map<string, Set<string>>>(); // turma → pessoa → datas
  const totalPorPessoa = new Map<string, number>(); // após a atribuição: aulas na turma de origem
  const contagemPorTurma = new Map<string, Map<string, number>>(); // pessoa → turma → aulas
  for (const pr of presencas) {
    const aula = aulaPorId.get(pr.aulaId);
    if (!aula || !pessoaPorId.has(pr.pessoaId)) continue;
    const mapa = porTurma.get(aula.turmaId) ?? new Map<string, Set<string>>();
    const datas = mapa.get(pr.pessoaId) ?? new Set<string>();
    if (!datas.has(aula.data)) {
      const c = contagemPorTurma.get(pr.pessoaId) ?? new Map<string, number>();
      c.set(aula.turmaId, (c.get(aula.turmaId) ?? 0) + 1);
      contagemPorTurma.set(pr.pessoaId, c);
    }
    datas.add(aula.data);
    mapa.set(pr.pessoaId, datas);
    porTurma.set(aula.turmaId, mapa);
  }
  // turma de origem = onde a pessoa esteve mais vezes
  const turmaDeOrigem = new Map<string, string>();
  for (const [pessoaId, c] of contagemPorTurma) {
    let melhor: string | null = null;
    for (const t of turmas) {
      if ((c.get(t.id) ?? 0) > (melhor ? c.get(melhor) ?? 0 : 0)) melhor = t.id;
    }
    if (melhor) {
      turmaDeOrigem.set(pessoaId, melhor);
      totalPorPessoa.set(pessoaId, c.get(melhor) ?? 0);
    }
  }

  const membrosAdultos = pessoas.filter((p) => p.tipo === "membro" && (idade(p.id) ?? 0) >= 18);
  const adultosHomens = membrosAdultos.filter((p) => p.genero === "M").length;
  const adultasMulheres = membrosAdultos.filter((p) => p.genero === "F").length;
  const membros45 = membrosAdultos.filter((p) => (idade(p.id) ?? 0) >= 45).length;

  const relTurmas: RelatorioTurma[] = turmas.map((turma) => {
    const aulasDaTurma = aulas.filter((a) => a.turmaId === turma.id);
    const datasOrdenadas = [...new Set(aulasDaTurma.map((a) => a.data))].sort();
    const mapa = porTurma.get(turma.id) ?? new Map<string, Set<string>>();

    const datas: PontoData[] = datasOrdenadas.map((d) => ({
      data: d,
      presentes: [...mapa.values()].filter((s) => s.has(d)).length,
    }));
    const n = datasOrdenadas.length;
    const corte = Math.floor(n / 2);
    const dp = datasOrdenadas.slice(0, corte);
    const ds = corte === 0 ? [] : datasOrdenadas.slice(n - corte);
    const padraoPrimeira = datasOrdenadas.slice(0, n - corte);
    const soma = (ds_: string[]) => datas.filter((x) => ds_.includes(x.data)).reduce((s, x) => s + x.presentes, 0);
    const totalP = soma(dp);
    const totalS = soma(ds);

    const linhas: LinhaPessoa[] = [];
    const padroes = { duasMetades: [] as string[], umaVez: [] as string[], comecouDepois: [] as string[], comecouEParou: [] as string[] };
    for (const [pessoaId, setDatas] of mapa) {
      if (turmaDeOrigem.get(pessoaId) !== turma.id) continue;
      const p = pessoaPorId.get(pessoaId)!;
      const freq = setDatas.size;
      linhas.push({ id: p.id, nome: p.nome, idade: idade(p.id), membro: p.tipo === "membro", frequencia: freq });
      if (freq === 1) padroes.umaVez.push(p.nome);
      else {
        const naPrimeira = padraoPrimeira.some((d) => setDatas.has(d));
        const naSegunda = ds.some((d) => setDatas.has(d));
        if (naPrimeira && naSegunda) padroes.duasMetades.push(p.nome);
        else if (naSegunda) padroes.comecouDepois.push(p.nome);
        else if (naPrimeira) padroes.comecouEParou.push(p.nome);
        else padroes.duasMetades.push(p.nome);
      }
    }
    linhas.sort((a, b) => a.frequencia - b.frequencia || a.nome.localeCompare(b.nome, "pt-BR"));
    for (const k of Object.keys(padroes) as (keyof typeof padroes)[]) {
      padroes[k].sort((a, b) => a.localeCompare(b, "pt-BR"));
    }

    const grupo = (f: (l: LinhaPessoa) => boolean) =>
      media(linhas.filter(f).map((l) => l.idade).filter((i): i is number => i !== null));
    const frequentes = linhas.filter((l) => l.frequencia >= 4);
    const nome = turma.nome.toLowerCase();
    let referencia: RelatorioTurma["referencia"] = null;
    let dentro: (l: LinhaPessoa) => boolean = () => true;
    if (nome.includes("homens")) referencia = { rotulo: "homens membros adultos", total: adultosHomens };
    else if (nome.includes("mulheres")) referencia = { rotulo: "mulheres membros adultas", total: adultasMulheres };
    else if (nome.includes("panorama")) {
      referencia = { rotulo: "membros de 45 anos ou mais", total: membros45 };
      dentro = (l) => (l.idade ?? 45) >= 45;
    }

    return {
      turma,
      datas,
      pessoas: linhas,
      distintas: linhas.length,
      membros: linhas.filter((l) => l.membro).length,
      visitantes: linhas.filter((l) => !l.membro).length,
      idadeMedia: media(linhas.map((l) => l.idade).filter((i): i is number => i !== null)),
      frequentes: frequentes.length,
      esporadicos: linhas.filter((l) => l.frequencia >= 2 && l.frequencia <= 3).length,
      umaVez: linhas.filter((l) => l.frequencia === 1).length,
      mediaPorAula: n === 0 ? 0 : datas.reduce((s, x) => s + x.presentes, 0) / n,
      primeiraMetade: { datas: dp, total: totalP },
      segundaMetade: { datas: ds, total: totalS },
      variacaoPct: dp.length > 0 && totalP > 0 ? ((totalS - totalP) / totalP) * 100 : null,
      padroes,
      saldo: padroes.comecouDepois.length - padroes.comecouEParou.length,
      idadePorGrupo: {
        frequentes: grupo((l) => l.frequencia >= 4),
        esporadicos: grupo((l) => l.frequencia >= 2 && l.frequencia <= 3),
        umaVez: grupo((l) => l.frequencia === 1),
      },
      picoMaior: picos(datas).maior,
      picoMenor: picos(datas).menor,
      referencia,
      participacaoPct:
        referencia && referencia.total > 0 ? (frequentes.length / referencia.total) * 100 : null,
      frequentesAbaixoReferencia: frequentes.filter((l) => !dentro(l)).map((l) => `${l.nome}, ${l.idade} anos`),
    };
  });

  // ---- visão geral (todas as turmas) ----
  const idsEbd = [...totalPorPessoa.keys()];
  const membrosEbd = idsEbd.filter((id) => pessoaPorId.get(id)!.tipo === "membro");
  const todasDatas = [...new Set(aulas.map((a) => a.data))].sort();

  const faixas: LinhaFaixa[] = FAIXAS.map((faixa) => {
    const daFaixa = membrosAdultos.filter((p) => faixaDaIdade(idade(p.id) ?? 0) === faixa);
    const passaram = daFaixa.filter((p) => (totalPorPessoa.get(p.id) ?? 0) >= 1).length;
    return {
      faixa,
      membros: daFaixa.length,
      passaram,
      taxa: daFaixa.length > 0 ? (passaram / daFaixa.length) * 100 : null,
      frequentes: daFaixa.filter((p) => (totalPorPessoa.get(p.id) ?? 0) >= 4).length,
    };
  });

  return {
    hoje,
    inicio: todasDatas[0] ?? null,
    fim: todasDatas[todasDatas.length - 1] ?? null,
    aulas: todasDatas.length,
    turmas: relTurmas,
    distintas: idsEbd.length,
    membros: membrosEbd.length,
    visitantes: idsEbd.length - membrosEbd.length,
    umaVez: idsEbd.filter((id) => totalPorPessoa.get(id) === 1).length,
    esporadicos: idsEbd.filter((id) => (totalPorPessoa.get(id) ?? 0) >= 2 && (totalPorPessoa.get(id) ?? 0) <= 3).length,
    frequentes: idsEbd.filter((id) => (totalPorPessoa.get(id) ?? 0) >= 4).length,
    igreja: {
      membros: pessoas.filter((p) => p.tipo === "membro").length,
      adultos: membrosAdultos.length,
      passaram: membrosEbd.length,
      frequentes: membrosEbd.filter((id) => (totalPorPessoa.get(id) ?? 0) >= 4).length,
      idadeConhecida: idsEbd.filter((id) => idade(id) !== null).length,
    },
    faixas,
  };
}

// ---------- formatação e texto ----------
export function fmtNum(n: number | null, casas = 1): string {
  return n === null ? "N/D" : n.toFixed(casas).replace(".", ",");
}
export function fmtPct(n: number | null, sinal = false): string {
  if (n === null) return "—";
  const s = n.toFixed(1).replace(".", ",");
  return `${sinal && n > 0 ? "+" : ""}${s}%`;
}
export function fmtDataCurta(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
export function fmtDataLonga(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
export function listaTexto(itens: string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

export function textoEntradaSaida(t: RelatorioTurma): string {
  const p = t.padroes;
  const partes: string[] = [];
  partes.push(`${p.duasMetades.length} estiveram presentes nas duas metades do semestre`);
  if (p.umaVez.length) partes.push(`${p.umaVez.length} vieram só uma vez`);
  if (p.comecouDepois.length) partes.push(`${p.comecouDepois.length} começaram depois (${listaTexto(p.comecouDepois)})`);
  if (p.comecouEParou.length) partes.push(`${p.comecouEParou.length} começaram e pararam (${listaTexto(p.comecouEParou)})`);
  const saldo =
    t.saldo === 0
      ? "0 (estável)"
      : `${t.saldo > 0 ? "+" : "-"}${Math.abs(t.saldo)} ${Math.abs(t.saldo) === 1 ? "pessoa" : "pessoas"}`;
  return `${listaTexto(partes)}. Saldo entre quem começou depois e quem parou: ${saldo}.`;
}

export function textoPicos(t: RelatorioTurma): string {
  if (!t.picoMaior || !t.picoMenor) return "";
  const d = (p: Pico) => listaTexto(p.datas.map(fmtDataCurta));
  const cada = (p: Pico) => (p.datas.length > 1 ? ` (${p.valor} cada)` : ` (${p.valor})`);
  return `Maior presença em ${d(t.picoMaior)}${cada(t.picoMaior)}. Menor presença em ${d(t.picoMenor)}${cada(t.picoMenor)}.`;
}

export function textoConclusaoTurma(t: RelatorioTurma): string {
  if (t.variacaoPct === null || t.primeiraMetade.datas.length === 0) {
    return "Ainda não há aulas suficientes para comparar as duas metades do semestre.";
  }
  const a = t.primeiraMetade;
  const b = t.segundaMetade;
  const per = (x: { datas: string[] }) => `${fmtDataCurta(x.datas[0])} a ${fmtDataCurta(x.datas[x.datas.length - 1])}`;
  const v = t.variacaoPct;
  const cabeca =
    v > 1 ? "a turma cresceu ao longo do semestre" : v < -1 ? "a turma perdeu presença ao longo do semestre" : "a turma se manteve estável";
  return `${cabeca} — presença total de ${a.total} na primeira metade (${per(a)}) contra ${b.total} na segunda (${per(b)}), variação de ${fmtPct(v, true)}.`;
}

export function textoIdade(t: RelatorioTurma): string | null {
  const { frequentes: f, esporadicos: e, umaVez: u } = t.idadePorGrupo;
  if (f === null || e === null || u === null) return null;
  const dif = Math.max(f, e, u) - Math.min(f, e, u);
  if (dif < 3) {
    return `Idade: a média entre os frequentes (${fmtNum(f)}) é próxima da dos esporádicos (${fmtNum(e)}) e da dos que vieram uma única vez (${fmtNum(u)}) — não há relação clara entre idade e frequência nesta turma.`;
  }
  const jovemMais = f < u;
  return `Idade: os frequentes têm média de ${fmtNum(f)} anos, contra ${fmtNum(e)} dos esporádicos e ${fmtNum(u)} dos que vieram uma única vez. ${jovemMais ? "Quanto mais jovem, maior a frequência" : "Quanto mais velho, maior a frequência"} nesta turma.`;
}
