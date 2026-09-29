"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirProfessorOuCoordenacao } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ETAPAS, contarProntas, fmtDomingo, type EstadoEtapas } from "@/lib/auxilio/mesa";

function voltarComErro(msg: string): never {
  redirect(`/auxilio?erro=${encodeURIComponent(msg)}`);
}

// Abre (ou cria) o preparo de uma turma num domingo. Cada preparo tem o seu
// rascunho privado (roteiro + conversa) e uma linha de andamento em `preparos`.
export async function abrirPreparo(formData: FormData): Promise<void> {
  let sessao;
  try {
    sessao = await exigirProfessorOuCoordenacao();
  } catch {
    return voltarComErro("Ação restrita a professores e coordenação.");
  }
  if (!sessao.pessoaId) return voltarComErro("Conta sem pessoa vinculada — fale com a coordenação.");

  const turmaId = String(formData.get("turmaId") ?? "");
  const data = String(formData.get("data") ?? "");
  if (!turmaId || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return voltarComErro("Aula inválida.");

  const supabase = createClient();
  const { data: existente, error: erroBusca } = await supabase
    .from("preparos")
    .select("id")
    .eq("pessoa_id", sessao.pessoaId)
    .eq("turma_id", turmaId)
    .eq("data", data)
    .maybeSingle();
  if (erroBusca) return voltarComErro("A Mesa de Preparo ainda não foi ativada no banco (falta rodar o SQL 0010).");
  if (existente) redirect(`/auxilio?preparo=${existente.id}`);

  const { data: modulos } = await supabase
    .from("modulos")
    .select("id, numero, data_inicio, data_fim")
    .eq("turma_id", turmaId)
    .order("numero");
  const lista = modulos ?? [];
  const daData = lista.find((m) => m.data_inicio && m.data_fim && m.data_inicio <= data && data <= m.data_fim);
  const modulo = daData ?? lista[lista.length - 1] ?? null;

  const titulo = `Aula de ${fmtDomingo(data)}`;
  const { data: rascunho, error: erroRascunho } = await supabase
    .from("rascunhos")
    .insert({
      pessoa_id: sessao.pessoaId,
      modulo_id: modulo?.id ?? null,
      titulo,
      conteudo: { historico: [], etapas: {} },
    })
    .select("id")
    .single();
  if (erroRascunho || !rascunho) return voltarComErro(`Falha ao criar o preparo: ${erroRascunho?.message ?? "erro"}`);

  const { data: preparo, error } = await supabase
    .from("preparos")
    .insert({ pessoa_id: sessao.pessoaId, turma_id: turmaId, data, titulo, rascunho_id: rascunho.id })
    .select("id")
    .single();
  if (error || !preparo) {
    await supabase.from("rascunhos").delete().eq("id", rascunho.id);
    return voltarComErro(`Falha ao criar o preparo: ${error?.message ?? "erro"}`);
  }

  revalidatePath("/auxilio");
  redirect(`/auxilio?preparo=${preparo.id}`);
}

export async function salvarEtapa(
  preparoId: string,
  chave: string,
  texto: string,
  pronto: boolean
): Promise<{ erro?: string; prontas?: number }> {
  try {
    await exigirProfessorOuCoordenacao();
  } catch {
    return { erro: "Ação restrita a professores e coordenação." };
  }
  if (!ETAPAS.some((e) => e.chave === chave)) return { erro: "Etapa inválida." };

  const supabase = createClient();
  const { data: preparo } = await supabase.from("preparos").select("id, rascunho_id").eq("id", preparoId).maybeSingle();
  if (!preparo?.rascunho_id) return { erro: "Preparo não encontrado." };

  const { data: rascunho } = await supabase
    .from("rascunhos")
    .select("conteudo")
    .eq("id", preparo.rascunho_id)
    .maybeSingle();
  if (!rascunho) return { erro: "Rascunho não encontrado." };

  const conteudo = (rascunho.conteudo ?? {}) as { etapas?: EstadoEtapas } & Record<string, unknown>;
  const etapas: EstadoEtapas = { ...(conteudo.etapas ?? {}), [chave]: { texto: texto.slice(0, 6000), pronto } };
  const { error } = await supabase
    .from("rascunhos")
    .update({ conteudo: { ...conteudo, etapas } })
    .eq("id", preparo.rascunho_id);
  if (error) return { erro: `Falha ao salvar: ${error.message}` };

  const prontas = contarProntas(etapas);
  await supabase.from("preparos").update({ etapas_prontas: prontas }).eq("id", preparoId);
  revalidatePath("/dashboard");
  return { prontas };
}

export async function renomearPreparo(preparoId: string, titulo: string): Promise<{ erro?: string }> {
  try {
    await exigirProfessorOuCoordenacao();
  } catch {
    return { erro: "Ação restrita a professores e coordenação." };
  }
  const limpo = titulo.trim().slice(0, 80);
  if (!limpo) return { erro: "Dê um título." };
  const supabase = createClient();
  const { error } = await supabase.from("preparos").update({ titulo: limpo }).eq("id", preparoId);
  if (error) return { erro: error.message };
  revalidatePath("/auxilio");
  return {};
}
