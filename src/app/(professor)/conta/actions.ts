"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface EstadoConta {
  erro?: string;
  sucesso?: string;
}

// Quem está logado troca a PRÓPRIA senha (sessão do próprio usuário — não usa
// service_role). A coordenação continua podendo redefinir a de qualquer
// professor em Professores.
export async function alterarMinhaSenha(
  _anterior: EstadoConta,
  formData: FormData
): Promise<EstadoConta> {
  const nova = String(formData.get("nova") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");
  if (nova.length < 6) return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  if (nova !== confirmar) return { erro: "As duas senhas não são iguais." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Entre de novo." };

  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) return { erro: `Não foi possível trocar a senha: ${error.message}` };
  return { sucesso: "Senha alterada." };
}

export async function sair() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
