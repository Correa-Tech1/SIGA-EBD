import { createClient } from "@/lib/supabase/server";

export interface PessoaPublica {
  id: string;
  nome: string;
}

export interface HistoricoPresenca {
  aula_id: string;
  data: string;
  status: "presente" | "ausente";
}

// `pessoas_publicas` é a VIEW (id, nome só) criada em 0002_rls.sql
// especificamente pra isto: o anon não tem select na tabela `pessoas`
// inteira (tem telefone), então a lista "escolha seu nome" vem daqui.
export async function listarPessoasPublicas(): Promise<PessoaPublica[]> {
  const supabase = createClient();
  const { data } = await supabase.from("pessoas_publicas").select("id, nome").order("nome");
  return (data ?? []) as PessoaPublica[];
}

// RPC `historico_de_presenca` (security definer, 0002_rls.sql): devolve só
// as linhas do pessoa_id pedido, nunca a tabela `presencas` inteira — a
// "identificação leve" documentada lá (a pessoa escolhe o próprio nome
// numa lista pública, não é uma senha de verdade).
export async function buscarHistorico(pessoaId: string): Promise<HistoricoPresenca[]> {
  const supabase = createClient();
  const { data } = await supabase.rpc("historico_de_presenca", { p_pessoa_id: pessoaId });
  return ((data ?? []) as HistoricoPresenca[]).sort((a, b) => (a.data < b.data ? 1 : -1));
}
