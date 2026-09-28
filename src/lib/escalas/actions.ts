"use server";

// Escala (quem dá aula quando) é decisão só da coordenação — o RLS
// (0002_rls.sql) só tem policy de escrita coordenação pra `escalas`, então
// todo action aqui exige isso. Avisos são diferentes: professor também
// pode postar (na própria turma, ou geral), mas só a coordenação apaga —
// de novo, refletindo exatamente o que já está no banco, não inventando
// regra nova no código.
import { revalidatePath } from "next/cache";
import { exigirCoordenacao, exigirProfessorOuCoordenacao } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface EstadoForm {
  erro?: string;
  sucesso?: string;
}

export async function criarEscala(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }

  const turmaId = String(formData.get("turmaId") ?? "");
  const pessoaId = String(formData.get("pessoaId") ?? "");
  const data = String(formData.get("data") ?? "");
  const tipo = String(formData.get("tipo") ?? "regular");

  if (!turmaId || !pessoaId || !data) {
    return { erro: "Escolha a pessoa e a data." };
  }
  if (!["regular", "convidado", "substituicao"].includes(tipo)) {
    return { erro: "Tipo de escala inválido." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("escalas").insert({
    turma_id: turmaId,
    pessoa_id: pessoaId,
    data,
    tipo: tipo as "regular" | "convidado" | "substituicao",
  });

  if (error) return { erro: `Falha ao escalar: ${error.message}` };

  revalidatePath("/escalas");
  revalidatePath("/minha-turma");
  return { sucesso: "Escala criada." };
}

export async function removerEscala(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }

  const escalaId = String(formData.get("escalaId") ?? "");
  if (!escalaId) return { erro: "Escala inválida." };

  const supabase = createClient();
  const { error } = await supabase.from("escalas").delete().eq("id", escalaId);
  if (error) return { erro: `Falha ao remover: ${error.message}` };

  revalidatePath("/escalas");
  revalidatePath("/minha-turma");
  return { sucesso: "Escala removida." };
}

export async function criarAviso(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  let sessao;
  try {
    sessao = await exigirProfessorOuCoordenacao();
  } catch {
    return { erro: "Ação restrita a professores e coordenação." };
  }

  const turmaId = String(formData.get("turmaId") ?? "").trim();
  const conteudo = String(formData.get("conteudo") ?? "").trim();

  if (!conteudo) return { erro: "Escreva o aviso." };

  const supabase = createClient();
  const { error } = await supabase.from("avisos").insert({
    turma_id: turmaId || null,
    autor_id: sessao.pessoaId,
    conteudo,
  });

  if (error) {
    return {
      erro: `Falha ao publicar aviso (confira se esta turma é a sua): ${error.message}`,
    };
  }

  revalidatePath("/escalas");
  revalidatePath("/minha-turma");
  revalidatePath("/aba-aluno");
  return { sucesso: "Aviso publicado." };
}

export async function apagarAviso(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }

  const avisoId = String(formData.get("avisoId") ?? "");
  if (!avisoId) return { erro: "Aviso inválido." };

  const supabase = createClient();
  const { error } = await supabase.from("avisos").delete().eq("id", avisoId);
  if (error) return { erro: `Falha ao apagar: ${error.message}` };

  revalidatePath("/escalas");
  revalidatePath("/minha-turma");
  revalidatePath("/aba-aluno");
  return { sucesso: "Aviso removido." };
}
