// Definições compartilhadas da Mesa de Preparo (servidor e cliente).
export const ETAPAS = [
  { chave: "abertura", nome: "Pergunta de abertura", dica: "A pergunta que abre a aula e cria a tensão." },
  { chave: "texto", nome: "Texto bíblico", dica: "Referência e versão. O texto lido em voz alta." },
  { chave: "tese", nome: "Tese da aula", dica: "Uma frase: o que a turma leva ao sair?" },
  { chave: "desenvolvimento", nome: "Desenvolvimento", dica: "Os 2 ou 3 movimentos da aula." },
  { chave: "aplicacao", nome: "Aplicação", dica: "O que muda na vida desta turma na segunda-feira." },
  { chave: "pergunta", nome: "Pergunta que fica", dica: "A pergunta que cerca, sem resposta pronta." },
] as const;

export type ChaveEtapa = (typeof ETAPAS)[number]["chave"];
export type EstadoEtapas = Partial<Record<ChaveEtapa, { texto: string; pronto: boolean }>>;

export const ATALHOS: { rotulo: string; pedido: string }[] = [
  {
    rotulo: "Achar a pergunta que cerca",
    pedido:
      "Com base no que já tenho no roteiro, me ajude a achar UMA pergunta que cerca — construída a partir da lógica de quem ouve, sem resposta pronta. Dê 3 opções e diga qual eu deveria usar.",
  },
  {
    rotulo: "Testar minha tese",
    pedido:
      "Teste a tese que escrevi no roteiro: ela cabe em uma frase? Está afirmando algo que a turma pode discordar? Aponte o ponto mais fraco e proponha uma versão mais afiada.",
  },
  {
    rotulo: "Que objeção a turma faria?",
    pedido:
      "Que objeção honesta esta turma faria a esta aula? Dê as 2 ou 3 mais prováveis, com a pergunta que eu poderia devolver a cada uma.",
  },
  {
    rotulo: "Encaixar em 40 minutos",
    pedido:
      "Encaixe o roteiro atual em 40 minutos: quanto tempo para cada etapa e o que cortar se o tempo apertar.",
  },
  {
    rotulo: "Aplicação para esta turma",
    pedido:
      "Sugira uma aplicação concreta para esta turma (ocupação real, situação real, hábito concreto), na linha do ordo amoris: reordenar o amor, não abandonar a coisa.",
  },
  {
    rotulo: "Resumir o capítulo do livro",
    pedido:
      "Consulte a Biblioteca, ache o livro-base deste módulo e me resuma o trecho mais útil para esta aula. Cite o título do livro e não invente o que não leu.",
  },
];

export const PEDIDO_SLIDES =
  "Gere os slides (PowerPoint) desta aula a partir do meu roteiro. O primeiro slide é a capa com o título da aula. Se faltar alguma etapa, avise o que precisa ser completado.";

// Próximos domingos a partir de hoje (inclusive), em ISO (yyyy-mm-dd).
export function proximosDomingos(hoje: string, qtd: number): string[] {
  const d = new Date(hoje + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7));
  const saida: string[] = [];
  for (let i = 0; i < qtd; i++) {
    saida.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return saida;
}

export function fmtDomingo(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function contarProntas(e: EstadoEtapas): number {
  return ETAPAS.filter((x) => e[x.chave]?.pronto).length;
}

export function textoRoteiro(e: EstadoEtapas): string {
  return ETAPAS.map((x) => {
    const v = e[x.chave];
    const estado = v?.pronto ? "pronta" : v?.texto?.trim() ? "em andamento" : "a fazer";
    return `- ${x.nome} (${estado}): ${v?.texto?.trim() || "(vazio)"}`;
  }).join("\n");
}
