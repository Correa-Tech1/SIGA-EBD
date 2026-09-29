import { createClient } from "@/lib/supabase/server";

export interface Escala {
  id: string;
  turma_id: string;
  pessoa_id: string;
  data: string;
  tipo: "regular" | "convidado" | "substituicao";
}

export interface EscalaComNome extends Escala {
  pessoa_nome: string;
}

export interface Aviso {
  id: string;
  turma_id: string | null;
  autor_id: string | null;
  conteudo: string;
  criado_em: string;
}

export interface AvisoComAutor extends Aviso {
  autor_nome: string;
}

export interface PessoaSimples {
  id: string;
  nome: string;
}

export interface ProfessorOpcao {
  id: string;
  nome: string;
  tipo: "regular" | "convidado";
  daTurma: boolean;
}

// Só quem foi cadastrado na aba Professores pode ser escalado. Os da turma
// vêm primeiro (`daTurma`), os demais ficam disponíveis (convidado/substituição).
export async function listarProfessoresParaEscala(turmaId: string): Promise<ProfessorOpcao[]> {
  const supabase = createClient();
  const [{ data: professores }, { data: vinculos }] = await Promise.all([
    supabase.from("pessoas").select("id, nome, professor_tipo").eq("role", "professor").order("nome"),
    supabase.from("professor_turmas").select("pessoa_id").eq("turma_id", turmaId),
  ]);
  const daTurma = new Set((vinculos ?? []).map((v) => v.pessoa_id));
  return (professores ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    tipo: p.professor_tipo === "convidado" ? "convidado" : "regular",
    daTurma: daTurma.has(p.id),
  }));
}

export async function listarPessoas(): Promise<PessoaSimples[]> {
  const supabase = createClient();
  const { data } = await supabase.from("pessoas").select("id, nome").order("nome");
  return (data ?? []) as PessoaSimples[];
}

// Duas queries em vez de embed (mesmo motivo documentado em
// lib/frequencia/queries.ts: nosso Database type não tem metadado de
// Relationships pra tipar joins com segurança).
export async function listarEscalas(turmaId: string): Promise<EscalaComNome[]> {
  const supabase = createClient();
  const { data: escalas } = await supabase
    .from("escalas")
    .select("id, turma_id, pessoa_id, data, tipo")
    .eq("turma_id", turmaId)
    .order("data", { ascending: false });

  const linhas = (escalas ?? []) as Escala[];
  if (linhas.length === 0) return [];

  const { data: pessoas } = await supabase
    .from("pessoas")
    .select("id, nome")
    .in("id", linhas.map((e) => e.pessoa_id));
  const nomesPorId = new Map((pessoas ?? []).map((p) => [p.id, p.nome]));

  return linhas.map((e) => ({ ...e, pessoa_nome: nomesPorId.get(e.pessoa_id) ?? "(sem nome)" }));
}

// Escala de UMA pessoa específica (usado em "Minha escala" do professor) —
// mesma tabela, filtrando por pessoa_id em vez de turma_id.
export async function listarMinhaEscala(pessoaId: string): Promise<Escala[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("escalas")
    .select("id, turma_id, pessoa_id, data, tipo")
    .eq("pessoa_id", pessoaId)
    .order("data", { ascending: false });
  return (data ?? []) as Escala[];
}

// Avisos de uma turma + os gerais (turma_id nulo) juntos — é assim que
// aparecem no mural pra quem está naquela turma.
export async function listarAvisos(turmaId: string | null): Promise<AvisoComAutor[]> {
  const supabase = createClient();
  const query = supabase
    .from("avisos")
    .select("id, turma_id, autor_id, conteudo, criado_em")
    .order("criado_em", { ascending: false });

  const { data } = turmaId
    ? await query.or(`turma_id.eq.${turmaId},turma_id.is.null`)
    : await query.is("turma_id", null);

  const linhas = (data ?? []) as Aviso[];
  if (linhas.length === 0) return [];

  const autorIds = [...new Set(linhas.map((a) => a.autor_id).filter((id): id is string => !!id))];
  const { data: pessoas } =
    autorIds.length > 0
      ? await supabase.from("pessoas").select("id, nome").in("id", autorIds)
      : { data: [] as { id: string; nome: string }[] };
  const nomesPorId = new Map((pessoas ?? []).map((p) => [p.id, p.nome]));

  return linhas.map((a) => ({
    ...a,
    autor_nome: (a.autor_id && nomesPorId.get(a.autor_id)) || "Coordenação",
  }));
}
