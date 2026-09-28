import { createClient } from "@/lib/supabase/server";

export interface Aula {
  id: string;
  modulo_id: string;
  data: string;
  titulo: string | null;
  professor_id: string | null;
}

export interface RosterPessoa {
  matricula_id: string;
  pessoa_id: string;
  nome: string;
}

export interface PresencaExistente {
  pessoa_id: string;
  status: "presente" | "ausente";
}

export interface PessoaSimples {
  id: string;
  nome: string;
}

// IDs das turmas em que a pessoa logada dá aula. Usa a mesma function SQL
// (`minhas_turmas()`) que as policies de RLS já usam — uma fonte de verdade
// só, sem repetir a regra "professor está na escala desta turma" em dois
// lugares que podem sair de sincronia.
export async function listarMinhasTurmasIds(): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase.rpc("minhas_turmas");
  return (data ?? []) as unknown as string[];
}

export async function listarAulasDosModulos(moduloIds: string[]): Promise<Aula[]> {
  if (moduloIds.length === 0) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("aulas")
    .select("id, modulo_id, data, titulo, professor_id")
    .in("modulo_id", moduloIds)
    .order("data", { ascending: false });
  return (data ?? []) as Aula[];
}

export async function buscarAula(aulaId: string): Promise<Aula | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("aulas")
    .select("id, modulo_id, data, titulo, professor_id")
    .eq("id", aulaId)
    .maybeSingle();
  return (data as Aula | null) ?? null;
}

// Roster = quem está matriculado (ativo) na turma — a lista que vira a tela
// de chamada. Vem da tabela `matriculas` (0003), não de `presencas`: sem
// isso não existiria "lista de quem chamar" antes da primeira presença já
// ter sido lançada.
//
// Duas queries em vez de um embed (`matriculas(...pessoas(nome))`) de
// propósito: nosso Database type é escrito à mão sem metadado de
// Relationships, e o supabase-js precisa dele pra tipar embeds — sem isso
// o mesmo problema de generics colapsando pra `never` que já apareceu antes
// (ver README/histórico) voltaria.
export async function listarRoster(turmaId: string): Promise<RosterPessoa[]> {
  const supabase = createClient();

  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("id, pessoa_id")
    .eq("turma_id", turmaId)
    .eq("ativo", true);

  const linhas = matriculas ?? [];
  if (linhas.length === 0) return [];

  const { data: pessoas } = await supabase
    .from("pessoas")
    .select("id, nome")
    .in(
      "id",
      linhas.map((l) => l.pessoa_id)
    );

  const nomesPorId = new Map((pessoas ?? []).map((p) => [p.id, p.nome]));

  return linhas
    .map((linha) => ({
      matricula_id: linha.id,
      pessoa_id: linha.pessoa_id,
      nome: nomesPorId.get(linha.pessoa_id) ?? "(sem nome)",
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function listarPresencas(aulaId: string): Promise<PresencaExistente[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("presencas")
    .select("pessoa_id, status")
    .eq("aula_id", aulaId);
  return (data ?? []) as PresencaExistente[];
}

// Pessoas ainda não matriculadas nesta turma — a lista de onde a coordenação
// escolhe quem adicionar ao chamar. Duas queries simples (em vez de um NOT
// IN aninhado) porque nosso Database type é escrito à mão e não modela
// subqueries — mais claro de ler também.
export async function listarPessoasForaDaTurma(turmaId: string): Promise<PessoaSimples[]> {
  const supabase = createClient();

  const { data: matriculados } = await supabase
    .from("matriculas")
    .select("pessoa_id")
    .eq("turma_id", turmaId)
    .eq("ativo", true);

  const idsMatriculados = new Set((matriculados ?? []).map((m) => m.pessoa_id));

  const { data: pessoas } = await supabase
    .from("pessoas")
    .select("id, nome")
    .order("nome");

  return ((pessoas ?? []) as PessoaSimples[]).filter((p) => !idsMatriculados.has(p.id));
}
