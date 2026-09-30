// Calendário-Mestre e teses do Plano de Ensino do 2º semestre de 2026 (Homens e
// Mulheres). Fonte: Plano_de_Ensino_2S2026.pdf. No próximo semestre, troque este
// arquivo pelos dados do novo plano.
export type TipoDia = "normal" | "unificada" | "circulo" | "sem_aula";

export interface DiaPlano {
  numero: number | null; // null = domingo sem aula
  data: string; // YYYY-MM-DD
  tipo: TipoDia;
  rotulo?: string; // "Círculo + Graça", "respiro"…
  homens?: string;
  mulheres?: string;
}

const d = (mes: string, dia: string) => `2026-${mes}-${dia}`;

export const CALENDARIO: DiaPlano[] = [
  { numero: 1, data: d("08", "02"), tipo: "unificada", homens: "O Coração Desordenado", mulheres: "O Coração Desordenado" },
  { numero: 2, data: d("08", "09"), tipo: "normal", homens: "Adorar É Humano", mulheres: "Maravilhoso Desperdício" },
  { numero: 3, data: d("08", "16"), tipo: "normal", homens: "As Liturgias Seculares", mulheres: "Aplaudida ou Criticada: A Mesma Armadilha" },
  { numero: 4, data: d("08", "23"), tipo: "normal", homens: "O Espírito o Encontra Onde Você Estiver", mulheres: "Vivendo uma História que Não Planejamos" },
  { numero: null, data: d("08", "30"), tipo: "sem_aula" },
  { numero: 5, data: d("09", "06"), tipo: "normal", homens: "Em Que História Você Está Inserido?", mulheres: "Descoberto" },
  { numero: 6, data: d("09", "13"), tipo: "normal", homens: "As Liturgias do Lar", mulheres: "Onde Você Coloca os Olhos" },
  { numero: 7, data: d("09", "20"), tipo: "circulo", homens: "A Ilusão da Independência", mulheres: "A Ilusão da Independência" },
  { numero: 8, data: d("09", "27"), tipo: "normal", homens: "Aprendendo de Cor", mulheres: "Fazer Muito, Ser Pouco?" },
  { numero: 9, data: d("10", "04"), tipo: "normal", homens: "Liturgias Vocacionais", mulheres: "Deus é Por Nós" },
  { numero: 10, data: d("10", "11"), tipo: "circulo", homens: "Fechamento — O Veredito", mulheres: "O Caminho Escondido — Veredito" },
  { numero: null, data: d("10", "18"), tipo: "sem_aula", rotulo: "respiro entre os módulos" },
  { numero: 11, data: d("10", "25"), tipo: "unificada", homens: "A Escavadeira de Deus", mulheres: "A Escavadeira de Deus" },
  { numero: 12, data: d("11", "01"), tipo: "normal", homens: "Devoção", mulheres: "Autoliderança" },
  { numero: 13, data: d("11", "08"), tipo: "normal", homens: "Integridade", mulheres: "Fortalezas" },
  { numero: 14, data: d("11", "15"), tipo: "normal", homens: "Liderança", mulheres: "Comunidade" },
  { numero: 15, data: d("11", "22"), tipo: "unificada", homens: "Vocação", mulheres: "Vocação" },
  { numero: 16, data: d("11", "29"), tipo: "normal", homens: "Casamento", mulheres: "Tempo" },
  { numero: 17, data: d("12", "06"), tipo: "normal", homens: "Paternidade", mulheres: "Obsessão Divina" },
  { numero: 18, data: d("12", "13"), tipo: "circulo", rotulo: "Círculo + Graça", homens: "Fechamento", mulheres: "Fechamento" },
];

const CIRCULO = "O mundo pede que você prove seu valor ocupando um papel; Cristo já decidiu seu valor antes de qualquer papel existir.";
const CORACAO =
  "O problema não é falta de informação nem fraqueza — é um coração que ama a coisa errada, ou ama a coisa certa fora de ordem.";

// Módulo 1: tese de cada lição. Módulo 2: capítulos-base agrupados (o plano não traz tese).
const TESE: Record<"homens" | "mulheres", Record<number, { tese?: string; base?: string }>> = {
  homens: {
    1: { tese: CORACAO },
    2: { tese: "Você não é definido pelo que sabe ou crê, mas pelo que ama de fato." },
    3: { tese: "Práticas culturais comuns discipulam o coração para amores sem escolha consciente." },
    4: { tese: "A adoração cristã histórica é contraformação — coloca sob a ação de Deus, não da própria performance." },
    5: { tese: "O culto implanta o crente dentro da história bíblica, verso a verso." },
    6: { tese: "A família tem suas próprias liturgias, intencionais ou não." },
    7: { tese: CIRCULO },
    8: { tese: "Os filhos aprendem por prática muito antes de aprender por explicação." },
    9: { tese: "A vocação também é liturgia — ou forma para o Reino, ou forma para outra coisa." },
    10: { tese: "Cada homem nomeia, para si mesmo, o amor desordenado que mais o domina hoje." },
    11: { base: "Ponte pneumatológica — o Espírito Santo como quem abre o que só Ele consegue abrir." },
    12: { base: "Devoção + Oração + Louvor (Hughes)" },
    13: { base: "Pureza + Integridade + Língua + Mente + Testemunho (Hughes)" },
    14: { base: "Amizade + Liderança (Hughes)" },
    15: { base: "Ministério + Igreja + Trabalho + Contribuição (Hughes)" },
    16: { base: "Disciplina no casamento (Hughes)" },
    17: { base: "Disciplina na paternidade (Hughes)" },
    18: { base: "Graça da Disciplina — nenhuma disciplina é mérito, todas são resposta à graça." },
  },
  mulheres: {
    1: { tese: CORACAO },
    2: { tese: "Seu valor diante de Deus não está no que produz ou mostra, mas em quem você é a sós com Ele." },
    3: { tese: "Buscar a palavra final sobre quem você é na plateia certa ou errada — ou na crítica alheia — é a mesma armadilha." },
    4: { tese: "Deus usa os invernos da vida para revelar uma grandeza medida pela intimidade, não pelas conquistas." },
    5: { tese: "A vulnerabilidade diante de Deus abre uma intimidade que a imagem perfeita jamais gera." },
    6: { tese: "Treinamos os olhos para admirar Deus ou para invejar os outros — na fartura e na seca, isso decide de quem somos." },
    7: { tese: CIRCULO },
    8: { tese: "Fazer muito por Deus, e obedecer no comum, não é o mesmo que ser amiga de Deus." },
    9: { tese: "É no lugar secreto, sem plateia, que Deus cura as feridas mais antigas." },
    10: { tese: "Ser vista por Deus, mesmo quando ninguém entende a história, já é suficiente." },
    11: { base: "Ponte pneumatológica — o Espírito Santo como quem abre o que só Ele consegue abrir." },
    12: { base: "Autoliderança: Organizando a Base + Life Hacks (Hayashi)" },
    13: { base: "Derrubando Fortalezas (Hayashi)" },
    14: { base: "Princípios, Comunidade e Cultura (Hayashi)" },
    15: { base: "Por Que Estamos Vivas? (Hayashi)" },
    16: { base: "Quanto Tempo o Tempo Tem? + Navegando as Temporadas (Hayashi)" },
    17: { base: "Obsessão Divina: a Potência da Revelação do Propósito (Hayashi)" },
    18: { base: "A mesma graça que fecha o módulo dos Homens — nenhuma prática é mérito." },
  },
};

export interface InfoAula {
  numero: number;
  data: string;
  tipo: TipoDia;
  titulo: string;
  tese?: string;
  base?: string;
  rotulo?: string;
}

function chaveTurma(nome: string): "homens" | "mulheres" | null {
  const n = nome.toLowerCase();
  return n.includes("homens") ? "homens" : n.includes("mulheres") ? "mulheres" : null;
}

// Lição prevista no Plano de Ensino para uma turma numa data (null = fora do plano).
export function infoDaAula(turmaNome: string, data: string): InfoAula | null {
  const chave = chaveTurma(turmaNome);
  const dia = CALENDARIO.find((x) => x.data === data);
  if (!chave || !dia || dia.numero === null) return null;
  const extra = TESE[chave][dia.numero] ?? {};
  return {
    numero: dia.numero,
    data,
    tipo: dia.tipo,
    titulo: (chave === "homens" ? dia.homens : dia.mulheres) ?? `Lição ${dia.numero}`,
    tese: extra.tese,
    base: extra.base,
    rotulo: dia.rotulo,
  };
}

export function temPlano(turmaNome: string): boolean {
  return chaveTurma(turmaNome) !== null;
}

export function moduloDaLicao(numero: number): 1 | 2 {
  return numero <= 10 ? 1 : 2;
}
