"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Mesma convenção do script de bootstrap (supabase/seed/bootstrap-coordenacao.mjs)
// e da criação de professor (professores/actions.ts): o login é por
// usuário/senha, mas o Supabase Auth exige e-mail — então convertemos o
// usuário num e-mail sintético estável, nunca exposto na tela.
function emailSintetico(usuario: string) {
  return `${usuario.trim().toLowerCase()}@login.interno.siga-ebd`;
}

export interface EstadoLogin {
  erro?: string;
}

export async function entrar(
  _estadoAnterior: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const usuario = String(formData.get("usuario") ?? "");
  const senha = String(formData.get("senha") ?? "");

  if (!usuario || !senha) {
    return { erro: "Preencha usuário e senha." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: emailSintetico(usuario),
    password: senha,
  });

  if (error) {
    // Mensagem genérica de propósito — não confirma se o usuário existe.
    return { erro: "Usuário ou senha incorretos." };
  }

  redirect("/");
}
