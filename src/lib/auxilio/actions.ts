"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirProfessorOuCoordenacao } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface EstadoForm {
  erro?: string;
  sucesso?: string;
}

// Cria o rascunho vazio (a conversa em si roda em src/app/api/auxilio/route.ts,
// que é quem realmente fala com a Anthropic). Fica no cliente de SESSÃO —
// RLS (`rascunhos_dono_all`) já garante que só o dono lê/edita/apaga depois.
export async function criarRascunho(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  let sessao;
  try {
    sessao = await exigirProfessorOuCoordenacao();
  } catch {
    return { erro: "Ação restrita a professores e coordenação." };
  }
  if (!sessao.pessoaId) {
    return { erro: "Conta sem pessoa vinculada — fale com a coordenação." };
  }

  const aulaId = String(formData.get("aulaId") ?? "").trim() || null;
  const supabase = createClient();

  let moduloId: string | null = null;
  if (aulaId) {
    const { data: aula } = await supabase
      .from("aulas")
      .select("modulo_id")
      .eq("id", aulaId)
      .maybeSingle();
    moduloId = aula?.modulo_id ?? null;
  }

  const { data, error } = await supabase
    .from("rascunhos")
    .insert({
      pessoa_id: sessao.pessoaId,
      modulo_id: moduloId,
      aula_id: aulaId,
      titulo: "Novo rascunho",
      conteudo: { historico: [] },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { erro: `Falha ao criar rascunho: ${error?.message ?? "erro desconhecido"}` };
  }

  revalidatePath("/auxilio");
  redirect(`/auxilio?rascunho=${data.id}`);
}

export async function apagarRascunho(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  try {
    await exigirProfessorOuCoordenacao();
  } catch {
    return { erro: "Ação restrita a professores e coordenação." };
  }

  const rascunhoId = String(formData.get("rascunhoId") ?? "");
  if (!rascunhoId) return { erro: "Rascunho inválido." };

  const supabase = createClient();
  const { error } = await supabase.from("rascunhos").delete().eq("id", rascunhoId);
  if (error) return { erro: `Falha ao apagar: ${error.message}` };

  revalidatePath("/auxilio");
  return { sucesso: "Rascunho apagado." };
}
