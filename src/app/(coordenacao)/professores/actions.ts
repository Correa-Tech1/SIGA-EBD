"use server";

import { revalidatePath } from "next/cache";
import { exigirCoordenacao } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const senha = gerarSenhaProvisoria();
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

  const { error: pessoaError } = await admin.from("pessoas").insert({
    auth_user_id: userData.user.id,
    nome,
    tipo: "membro",
    role: "professor",
  });

  if (pessoaError) {
    // Limpa o usuário órfão no Auth pra não deixar lixo pela metade.
    await admin.auth.admin.deleteUser(userData.user.id);
    return { erro: `Falha ao registrar professor: ${pessoaError.message}` };
  }

  revalidatePath("/professores");
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

  const senha = gerarSenhaProvisoria();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(authUserId, { password: senha });

  if (error) {
    return { erro: `Falha ao resetar senha: ${error.message}` };
  }

  return { senhaGerada: senha };
}
