// Ponto único de "quem está logado e com que papel". Layouts e Server
// Actions chamam isto em vez de reimplementar a checagem cada um do seu
// jeito — um lugar para ajustar se a regra de papéis mudar.
import { createClient } from "@/lib/supabase/server";

export type PessoaRole = "coordenacao" | "professor" | null;

export interface SessaoAtual {
  autenticado: boolean;
  pessoaId: string | null;
  nome: string | null;
  role: PessoaRole;
}

export async function getSessaoAtual(): Promise<SessaoAtual> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { autenticado: false, pessoaId: null, nome: null, role: null };
  }

  const { data: pessoa } = await supabase
    .from("pessoas")
    .select("id, nome, role")
    .eq("auth_user_id", user.id)
    .single();

  if (!pessoa) {
    // Tem conta no Supabase Auth mas não tem linha em `pessoas` — estado
    // inconsistente (não deveria acontecer fora de um bootstrap malfeito).
    return { autenticado: true, pessoaId: null, nome: null, role: null };
  }

  return {
    autenticado: true,
    pessoaId: pessoa.id,
    nome: pessoa.nome,
    role: pessoa.role as PessoaRole,
  };
}

export async function exigirCoordenacao(): Promise<SessaoAtual> {
  const sessao = await getSessaoAtual();
  if (sessao.role !== "coordenacao") {
    throw new Error("Ação restrita à coordenação.");
  }
  return sessao;
}

export async function exigirProfessorOuCoordenacao(): Promise<SessaoAtual> {
  const sessao = await getSessaoAtual();
  if (sessao.role !== "professor" && sessao.role !== "coordenacao") {
    throw new Error("Ação restrita a professores e coordenação.");
  }
  return sessao;
}
