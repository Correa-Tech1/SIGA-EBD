"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirProfessorOuCoordenacao } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { registrarMaterial } from "@/lib/biblioteca/actions";

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

// Publica na Biblioteca (Aulas → Slides) um arquivo que o Auxílio gerou.
// Copia do bucket privado 'auxilio' para o público 'materiais' e registra.
export async function publicarGeradoNaBiblioteca(entrada: {
  caminho: string;
  nome: string;
  turmaId: string;
}): Promise<{ erro?: string; sucesso?: string }> {
  let sessao;
  try {
    sessao = await exigirProfessorOuCoordenacao();
  } catch {
    return { erro: "Ação restrita a professores e coordenação." };
  }
  if (!sessao.pessoaId || !entrada.caminho.startsWith(`${sessao.pessoaId}/`) || entrada.caminho.includes("..")) {
    return { erro: "Arquivo inválido." };
  }
  if (!entrada.turmaId) return { erro: "Escolha a turma." };

  const supabase = createClient();
  const { data: blob, error: erroBaixar } = await supabase.storage.from("auxilio").download(entrada.caminho);
  if (erroBaixar || !blob) return { erro: `Não encontrei o arquivo: ${erroBaixar?.message ?? "sem retorno"}` };

  const nomeSeguro = entrada.nome
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.\-]+/g, "_");
  const destino = `aulas/${sessao.pessoaId}/${Date.now()}-${nomeSeguro}`;
  const { error: erroEnviar } = await supabase.storage.from("materiais").upload(destino, blob, {
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
  if (erroEnviar) return { erro: `Falha ao publicar: ${erroEnviar.message}` };

  const r = await registrarMaterial({
    categoria: "aula",
    titulo: entrada.nome.replace(/\.pptx$/i, ""),
    tipo: "pptx",
    caminho: destino,
    turmaId: entrada.turmaId, // "unificada" é aceito por registrarMaterial
    papel: "slides",
  });
  return r.erro ? { erro: r.erro } : { sucesso: "Publicado na Biblioteca, em Aulas → Slides." };
}
