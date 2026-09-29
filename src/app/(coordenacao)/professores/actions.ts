"use server";

import { revalidatePath } from "next/cache";
import { exigirCoordenacao } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cifrarSenha } from "@/lib/auth/senha-visivel";

export interface EstadoCriarProfessor {
  erro?: string;
  sucesso?: string;
  senhaGerada?: string;
}

function gerarSenhaProvisoria(): string {
  // Simples de propósito: uma senha provisória legível, que o professor
  // troca (ou não) depois. A coordenação sempre pode resetar de novo — não
  // existe fluxo de "esqueci a senha" por e-mail (decisão registrada na
  // Proposta de Arquitetura: contas são 100% administradas por você).
  const palavras = ["ebd", "graca", "luz", "vida", "fe", "paz"];
  const palavra = palavras[Math.floor(Math.random() * palavras.length)];
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `${palavra}${numero}`;
}

function emailSintetico(usuario: string) {
  return `${usuario.trim().toLowerCase()}@login.interno.siga-ebd`;
}

export async function criarProfessor(
  _estadoAnterior: EstadoCriarProfessor,
  formData: FormData
): Promise<EstadoCriarProfessor> {
  // Passo 1 — SEMPRE primeiro: confirma que quem está chamando é
  // coordenação, usando o cliente de SESSÃO (respeita RLS). Só depois disso
  // o admin client (service_role, ignora RLS) entra em cena. Nunca inverter
  // essa ordem — ver o aviso em src/lib/supabase/admin.ts.
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const usuario = String(formData.get("usuario") ?? "").trim();

  if (!nome || !usuario) {
    return { erro: "Preencha nome e usuário." };
  }
  if (!/^[a-z0-9._-]+$/i.test(usuario)) {
    return { erro: "Usuário deve conter só letras, números, ponto, hífen ou underline." };
  }

  const senhaInformada = String(formData.get("senha") ?? "").trim();
  if (senhaInformada && senhaInformada.length < 6) {
    return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  }
  const senha = senhaInformada || gerarSenhaProvisoria();
  const turmaIds = formData.getAll("turmaId").map(String).filter(Boolean);
  const professorTipo = String(formData.get("professorTipo") ?? "regular") === "convidado" ? "convidado" : "regular";
  const admin = createAdminClient();

  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email: emailSintetico(usuario),
    password: senha,
    email_confirm: true,
  });

  if (userError) {
    const jaExiste = userError.message.toLowerCase().includes("already");
    return {
      erro: jaExiste
        ? `Já existe uma conta com o usuário "${usuario}".`
        : `Falha ao criar conta: ${userError.message}`,
    };
  }

  const { data: pessoaCriada, error: pessoaError } = await admin
    .from("pessoas")
    .insert({
      auth_user_id: userData.user.id,
      nome,
      tipo: "membro",
      role: "professor",
      professor_tipo: professorTipo,
      senha_cifrada: cifrarSenha(senha),
    })
    .select("id")
    .single();

  if (pessoaError || !pessoaCriada) {
    // Limpa o usuário órfão no Auth pra não deixar lixo pela metade.
    await admin.auth.admin.deleteUser(userData.user.id);
    return { erro: `Falha ao registrar professor: ${pessoaError?.message ?? "sem retorno"}` };
  }

  // Turma do professor = vínculo próprio (não é escala: escala é aula marcada).
  if (turmaIds.length > 0) {
    const { error: vinculoError } = await admin
      .from("professor_turmas")
      .insert(turmaIds.map((turmaId) => ({ turma_id: turmaId, pessoa_id: pessoaCriada.id })));
    if (vinculoError) {
      revalidatePath("/professores");
      return {
        erro: `Conta criada (senha ${senha}), mas falhou ao vincular a turma: ${vinculoError.message}. Vincule em “Editar”.`,
      };
    }
  }

  revalidatePath("/professores");
  revalidatePath("/escalas");
  return {
    sucesso: `Conta criada para ${nome}.`,
    senhaGerada: senha,
  };
}

export interface EstadoResetarSenha {
  erro?: string;
  senhaGerada?: string;
}

export async function resetarSenha(
  _estadoAnterior: EstadoResetarSenha,
  formData: FormData
): Promise<EstadoResetarSenha> {
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }

  const authUserId = String(formData.get("authUserId") ?? "");
  if (!authUserId) {
    return { erro: "Professor inválido." };
  }

  const senhaInformada = String(formData.get("senha") ?? "").trim();
  if (senhaInformada && senhaInformada.length < 6) {
    return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  }
  const senha = senhaInformada || gerarSenhaProvisoria();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(authUserId, { password: senha });

  if (error) {
    return { erro: `Falha ao resetar senha: ${error.message}` };
  }
  await admin.from("pessoas").update({ senha_cifrada: cifrarSenha(senha) }).eq("auth_user_id", authUserId);
  revalidatePath("/professores");

  return { senhaGerada: senha };
}

export interface EstadoTurmasProfessor {
  erro?: string;
  sucesso?: string;
}

// Define em quais turmas o professor dá aula. Marcou → cria a escala
// regular (se ainda não houver nenhuma nessa turma). Desmarcou → remove as
// escalas dele naquela turma (o vínculo acaba).
export async function atualizarTurmasProfessor(
  _estadoAnterior: EstadoTurmasProfessor,
  formData: FormData
): Promise<EstadoTurmasProfessor> {
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }

  const pessoaId = String(formData.get("pessoaId") ?? "");
  const marcadas = new Set(formData.getAll("turmaId").map(String).filter(Boolean));
  if (!pessoaId) return { erro: "Professor inválido." };

  const supabase = createClient();
  const { data: atuais, error: erroLeitura } = await supabase
    .from("professor_turmas")
    .select("turma_id")
    .eq("pessoa_id", pessoaId);
  if (erroLeitura) return { erro: `Falha ao ler turmas: ${erroLeitura.message}` };

  const jaTem = new Set((atuais ?? []).map((e) => e.turma_id));
  const adicionar = [...marcadas].filter((t) => !jaTem.has(t));
  const remover = [...jaTem].filter((t) => !marcadas.has(t));

  if (adicionar.length > 0) {
    const { error } = await supabase
      .from("professor_turmas")
      .insert(adicionar.map((turmaId) => ({ turma_id: turmaId, pessoa_id: pessoaId })));
    if (error) return { erro: `Falha ao vincular turma: ${error.message}` };
  }
  if (remover.length > 0) {
    const { error } = await supabase
      .from("professor_turmas")
      .delete()
      .eq("pessoa_id", pessoaId)
      .in("turma_id", remover);
    if (error) return { erro: `Falha ao desvincular turma: ${error.message}` };
  }

  revalidatePath("/professores");
  revalidatePath("/escalas");
  revalidatePath("/minha-turma");
  return { sucesso: "Turmas atualizadas." };
}

export async function atualizarTipoProfessor(
  _estadoAnterior: EstadoTurmasProfessor,
  formData: FormData
): Promise<EstadoTurmasProfessor> {
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }
  const pessoaId = String(formData.get("pessoaId") ?? "");
  const bruto = String(formData.get("professorTipo") ?? "");
  if (!pessoaId) return { erro: "Professor inválido." };
  const supabase = createClient();
  // "nenhum" só vale para quem é coordenação (deixa de aparecer na escala como professor)
  let tipo: "regular" | "convidado" | null = bruto === "convidado" ? "convidado" : "regular";
  if (bruto === "nenhum") {
    const { data: alvo } = await supabase.from("pessoas").select("role").eq("id", pessoaId).maybeSingle();
    if (alvo?.role !== "coordenacao") return { erro: "Professor cadastrado não pode ficar sem tipo." };
    tipo = null;
  }
  const { error } = await supabase.from("pessoas").update({ professor_tipo: tipo }).eq("id", pessoaId);
  if (error) return { erro: `Falha ao salvar: ${error.message}` };
  revalidatePath("/professores");
  revalidatePath("/escalas");
  revalidatePath("/coordenacao");
  return { sucesso: "Tipo atualizado." };
}
