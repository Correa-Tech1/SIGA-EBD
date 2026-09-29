// Dados da aba Coordenação: professores (aulas dadas, uso da plataforma) e
// prontidão de domingo. A frequência em si vem de carregarRelatorio().
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarTurmas } from "@/lib/estrutura/queries";

export interface LinhaProfessor {
  id: string;
  nome: string;
  tipo: "regular" | "convidado";
  turmas: string[];
  porMes: number[]; // 12 posições: aulas escaladas (dadas + futuras) em cada mês do ano
  dadas: number; // escalas até hoje
  agendadas: number; // escalas depois de hoje
  ultimoAcesso: string | null;
  preparos: number;
  etapasProntas: number;
  slides: number;
  ultimaAtividade: string | null;
}

export interface TurmaProfessores {
  turmaId: string;
  turma: string;
  professores: { id: string; nome: string; tipo: "regular" | "convidado"; aulas: number }[];
  totalAulas: number;
}

export interface Prontidao {
  data: string;
  itens: { turmaId: string; pessoa: string; prontas: number; total: number; slides: boolean }[];
}

export async function carregarProfessores(hoje: string, proximoDomingo: string) {
  const supabase = createClient();
  const ano = hoje.slice(0, 4);
  const [turmas, { data: professores }, { data: escalas }, { data: vinculos }, prep] = await Promise.all([
    listarTurmas(),
    supabase.from("pessoas").select("id, nome, auth_user_id, professor_tipo").or("role.eq.professor,professor_tipo.not.is.null").order("nome"),
    supabase.from("escalas").select("pessoa_id, turma_id, data").gte("data", `${ano}-01-01`).lte("data", `${ano}-12-31`),
    supabase.from("professor_turmas").select("pessoa_id, turma_id"),
    supabase
      .from("preparos")
      .select("pessoa_id, turma_id, data, etapas_prontas, etapas_total, slides_gerados, atualizado_em"),
  ]);
  const preparos = prep.error ? null : prep.data ?? [];

  // uma escala por pessoa+turma+data
  const unicas = new Map<string, { pessoa_id: string; turma_id: string; data: string }>();
  for (const e of escalas ?? []) unicas.set(`${e.pessoa_id}|${e.turma_id}|${e.data}`, e);

  const admin = createAdminClient();
  const acessos = new Map<string, string | null>();
  await Promise.all(
    (professores ?? [])
      .filter((p) => p.auth_user_id)
      .map(async (p) => {
        const { data } = await admin.auth.admin.getUserById(p.auth_user_id as string);
        acessos.set(p.id, data.user?.last_sign_in_at ?? null);
      })
  );

  const nomeTurma = (id: string) => turmas.find((t) => t.id === id)?.nome ?? "Turma";
  const linhas: LinhaProfessor[] = (professores ?? []).map((p) => {
    const minhas = [...unicas.values()].filter((e) => e.pessoa_id === p.id);
    const porMes = Array(12).fill(0) as number[];
    for (const e of minhas) porMes[Number(e.data.slice(5, 7)) - 1] += 1;
    const meusPrep = (preparos ?? []).filter((x) => x.pessoa_id === p.id);
    return {
      id: p.id,
      nome: p.nome,
      tipo: p.professor_tipo === "convidado" ? "convidado" : "regular",
      turmas: (vinculos ?? []).filter((v) => v.pessoa_id === p.id).map((v) => nomeTurma(v.turma_id)),
      porMes,
      dadas: minhas.filter((e) => e.data <= hoje).length,
      agendadas: minhas.filter((e) => e.data > hoje).length,
      ultimoAcesso: acessos.get(p.id) ?? null,
      preparos: meusPrep.length,
      etapasProntas: meusPrep.reduce((s, x) => s + x.etapas_prontas, 0),
      slides: meusPrep.filter((x) => x.slides_gerados).length,
      ultimaAtividade: meusPrep.map((x) => x.atualizado_em).sort().pop() ?? null,
    };
  });

  const porTurma: TurmaProfessores[] = turmas.map((t) => {
    const contagem = new Map<string, number>();
    for (const e of unicas.values()) {
      if (e.turma_id !== t.id || e.data > hoje) continue;
      contagem.set(e.pessoa_id, (contagem.get(e.pessoa_id) ?? 0) + 1);
    }
    const lista = [...contagem.entries()]
      .map(([id, aulas]) => {
        const l = linhas.find((x) => x.id === id);
        return { id, nome: l?.nome ?? "(professor removido)", tipo: l?.tipo ?? ("regular" as const), aulas };
      })
      .sort((a, b) => b.aulas - a.aulas);
    return { turmaId: t.id, turma: t.nome, professores: lista, totalAulas: lista.reduce((s, x) => s + x.aulas, 0) };
  });

  const prontidao: Prontidao | null = preparos
    ? {
        data: proximoDomingo,
        itens: preparos
          .filter((x) => x.data === proximoDomingo)
          .map((x) => ({
            turmaId: x.turma_id,
            pessoa: linhas.find((l) => l.id === x.pessoa_id)?.nome ?? "Professor",
            prontas: x.etapas_prontas,
            total: x.etapas_total,
            slides: x.slides_gerados,
          })),
      }
    : null;

  return { ano, linhas, porTurma, prontidao, turmas };
}
