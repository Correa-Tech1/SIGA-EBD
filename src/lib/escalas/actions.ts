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
  const { data: professor } = await supabase
    .from("pessoas")
    .select("id")
    .eq("id", pessoaId)
    .or("role.eq.professor,professor_tipo.not.is.null")
    .maybeSingle();
  if (!professor) return { erro: "Só professores cadastrados na aba Professores podem ser escalados." };

  // Aula unificada: o mesmo professor dá aula para Homens e Mulheres juntos.
  // Grava a escala nas duas turmas (a contagem de aulas dadas conta uma só).
  let turmaIds = [turmaId];
  if (formData.get("unificada")) {
    const { data: atual } = await supabase.from("turmas").select("semestre_id").eq("id", turmaId).maybeSingle();
    const { data: irmas } = atual
      ? await supabase.from("turmas").select("id, nome").eq("semestre_id", atual.semestre_id)
      : { data: [] as { id: string; nome: string }[] };
    const alvo = (irmas ?? []).filter((t) => /homens|mulheres/i.test(t.nome));
    if (alvo.length < 2) return { erro: "Não encontrei as turmas de Homens e Mulheres deste semestre." };
    turmaIds = alvo.map((t) => t.id);
  }

  // Uma data tem um professor por turma. Se já há outro escalado (inclusive em
  // datas passadas, para registrar/corrigir o que aconteceu), ele é trocado.
  const { data: doDia } = await supabase
    .from("escalas")
    .select("id, turma_id, pessoa_id")
    .eq("data", data)
    .in("turma_id", turmaIds);
  const jaTem = new Set((doDia ?? []).filter((e) => e.pessoa_id === pessoaId).map((e) => e.turma_id));
  const trocar = (doDia ?? []).filter((e) => e.pessoa_id !== pessoaId).map((e) => e.id);
  const novas = turmaIds.filter((t) => !jaTem.has(t));
  if (novas.length === 0) return { erro: "Este professor já está escalado nessa data." };

  if (trocar.length > 0) {
    const { error: erroTroca } = await supabase.from("escalas").delete().in("id", trocar);
    if (erroTroca) return { erro: `Falha ao trocar o professor: ${erroTroca.message}` };
  }

  const { error } = await supabase.from("escalas").insert(
    novas.map((t) => ({
      turma_id: t,
      pessoa_id: pessoaId,
      data,
      tipo: tipo as "regular" | "convidado" | "substituicao",
    }))
  );

  if (error) return { erro: `Falha ao escalar: ${error.message}` };

  revalidatePath("/escalas");
  revalidatePath("/minha-turma");
  revalidatePath("/coordenacao");
  const verbo = trocar.length > 0 ? "Professor trocado" : "Escala registrada";
  return { sucesso: turmaIds.length > 1 ? `${verbo} (Homens e Mulheres).` : `${verbo}.` };
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
  // escala unificada tem uma linha por turma: remove a do mesmo professor e data em todas
  const { data: escala } = await supabase.from("escalas").select("pessoa_id, data").eq("id", escalaId).maybeSingle();
  const { error } = escala
    ? await supabase.from("escalas").delete().eq("pessoa_id", escala.pessoa_id).eq("data", escala.data)
    : await supabase.from("escalas").delete().eq("id", escalaId);
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
