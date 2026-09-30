// Cruza QUEM deu a aula (escalas) com QUANTOS vieram (chamadas). Puro, sem banco.
// Serve para enxergar padrões: a turma enche mais com certo professor? Quem
// vem na aula dele volta no domingo seguinte?
import type { RelatorioGeral } from "@/lib/relatorio/motor";

export interface EscalaSimples {
  pessoa_id: string;
  turma_id: string;
  data: string;
}

export interface AulaProf {
  data: string;
  presentes: number;
  seguinte: number | null; // presentes no próximo domingo com chamada
}

export interface LinhaProfFreq {
  professorId: string;
  nome: string;
  turmaId: string;
  turma: string;
  aulas: AulaProf[];
  media: number; // média de presentes nas aulas dele
  mediaTurma: number; // média da turma no semestre
  diferenca: number; // media - mediaTurma
  mediaSeguinte: number | null; // média de presentes no domingo seguinte às aulas dele
  amostraSeguinte: number;
}

const arred = (n: number) => Math.round(n * 10) / 10;

export function frequenciaPorProfessor(
  r: RelatorioGeral,
  escalas: EscalaSimples[],
  nomes: Map<string, string>
): LinhaProfFreq[] {
  const saida: LinhaProfFreq[] = [];
  for (const t of r.turmas) {
    const datas = t.datas; // cronológico, só datas com chamada
    if (datas.length === 0) continue;
    const porPessoa = new Map<string, AulaProf[]>();
    for (const e of escalas) {
      if (e.turma_id !== t.turma.id) continue;
      const i = datas.findIndex((d) => d.data === e.data);
      if (i < 0) continue; // escalado, mas sem chamada naquela data
      const lista = porPessoa.get(e.pessoa_id) ?? [];
      lista.push({ data: e.data, presentes: datas[i].presentes, seguinte: datas[i + 1]?.presentes ?? null });
      porPessoa.set(e.pessoa_id, lista);
    }
    for (const [pessoaId, aulas] of porPessoa) {
      aulas.sort((a, b) => a.data.localeCompare(b.data));
      const media = aulas.reduce((s, a) => s + a.presentes, 0) / aulas.length;
      const seg = aulas.filter((a) => a.seguinte !== null);
      saida.push({
        professorId: pessoaId,
        nome: nomes.get(pessoaId) ?? "(professor removido)",
        turmaId: t.turma.id,
        turma: t.turma.nome,
        aulas,
        media: arred(media),
        mediaTurma: arred(t.mediaPorAula),
        diferenca: arred(media - t.mediaPorAula),
        mediaSeguinte: seg.length ? arred(seg.reduce((s, a) => s + (a.seguinte as number), 0) / seg.length) : null,
        amostraSeguinte: seg.length,
      });
    }
  }
  return saida.sort((a, b) => a.turma.localeCompare(b.turma) || b.media - a.media);
}
