import { createClient } from "@/lib/supabase/server";

// "Conteúdo do Semestre" — a camada VARIÁVEL do system prompt, montada por
// rascunho a partir de qual aula/módulo ele está associado (ver
// src/lib/auxilio/metodologia.ts pra a camada FIXA). Sem aula/módulo
// nenhum, o rascunho é uma conversa livre sobre método.
export async function montarContextoConteudo(
  aulaId: string | null,
  moduloId: string | null
): Promise<string> {
  if (!aulaId && !moduloId) {
    return "Nenhuma aula ou módulo associado a este rascunho ainda — converse livremente sobre a metodologia.";
  }

  const supabase = createClient();

  let aula: { data: string; titulo: string | null; modulo_id: string } | null = null;
  if (aulaId) {
    const { data } = await supabase
      .from("aulas")
      .select("data, titulo, modulo_id")
      .eq("id", aulaId)
      .maybeSingle();
    aula = data;
  }

  const moduloIdEfetivo = moduloId ?? aula?.modulo_id ?? null;
  let modulo: { turma_id: string; numero: 1 | 2; tema: string | null; livro_base: string | null } | null = null;
  if (moduloIdEfetivo) {
    const { data } = await supabase
      .from("modulos")
      .select("turma_id, numero, tema, livro_base")
      .eq("id", moduloIdEfetivo)
      .maybeSingle();
    modulo = data;
  }

  let turma: { nome: string; titulo: string | null } | null = null;
  if (modulo?.turma_id) {
    const { data } = await supabase
      .from("turmas")
      .select("nome, titulo")
      .eq("id", modulo.turma_id)
      .maybeSingle();
    turma = data;
  }

  const linhas: string[] = [];
  if (turma) linhas.push(`Turma: ${turma.nome}${turma.titulo ? ` — ${turma.titulo}` : ""}`);
  if (modulo) {
    linhas.push(
      `Módulo ${modulo.numero}${modulo.tema ? `: ${modulo.tema}` : ""}${
        modulo.livro_base ? ` (livro base: ${modulo.livro_base})` : ""
      }`
    );
  }
  if (aula) linhas.push(`Aula: ${aula.data}${aula.titulo ? ` — ${aula.titulo}` : ""}`);

  return linhas.length > 0 ? linhas.join("\n") : "Conteúdo do semestre não encontrado.";
}
