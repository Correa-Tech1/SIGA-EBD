"use server";

// Upload de material (oficial ou de_aula) e remoção. Nota de arquitetura:
// os dois usam o cliente de SESSÃO (createClient), nunca o admin — tanto a
// tabela `materiais` quanto o bucket de Storage têm suas próprias policies
// de RLS (0002_rls.sql e 0005_storage_materiais.sql) que já sabem quem pode
// escrever onde. Se o upload ou o insert falhar por falta de permissão, é o
// BANCO recusando, não uma checagem que este arquivo teria que reimplementar.
import { revalidatePath } from "next/cache";
import { exigirCoordenacao, exigirProfessorOuCoordenacao } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface EstadoForm {
  erro?: string;
  sucesso?: string;
}

const TIPOS_ACEITOS = new Set(["pdf", "docx", "pptx", "doc", "ppt", "mp3", "mp4", "jpg", "jpeg", "png"]);
const TAMANHO_MAX_BYTES = 25 * 1024 * 1024; // 25MB — suficiente pra slide/estudo, sem deixar o bucket disparar de custo.

function extensao(nomeArquivo: string): string {
  return (nomeArquivo.split(".").pop() ?? "").toLowerCase();
}

function nomeArquivoSeguro(nomeOriginal: string): string {
  const limpo = nomeOriginal
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.\-]+/g, "_");
  return `${Date.now()}-${limpo}`;
}

function validarArquivo(arquivo: File | null): string | null {
  if (!arquivo || arquivo.size === 0) return "Escolha um arquivo.";
  if (arquivo.size > TAMANHO_MAX_BYTES) return "Arquivo maior que 25MB.";
  if (!TIPOS_ACEITOS.has(extensao(arquivo.name))) {
    return `Tipo de arquivo ".${extensao(arquivo.name)}" não é aceito.`;
  }
  return null;
}

export async function enviarMaterialOficial(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }

  const moduloId = String(formData.get("moduloId") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const arquivo = formData.get("arquivo") as File | null;

  if (!moduloId || !titulo) return { erro: "Escolha o módulo e informe um título." };
  const erroArquivo = validarArquivo(arquivo);
  if (erroArquivo) return { erro: erroArquivo };

  const caminho = `oficial/${moduloId}/${nomeArquivoSeguro(arquivo!.name)}`;
  const supabase = createClient();

  const { error: erroUpload } = await supabase.storage
    .from("materiais")
    .upload(caminho, arquivo!, { contentType: arquivo!.type || undefined });
  if (erroUpload) return { erro: `Falha ao enviar arquivo: ${erroUpload.message}` };

  const { error: erroInsert } = await supabase.from("materiais").insert({
    origem: "oficial",
    modulo_id: moduloId,
    titulo,
    tipo_arquivo: extensao(arquivo!.name),
    caminho_arquivo: caminho,
  });

  if (erroInsert) {
    await supabase.storage.from("materiais").remove([caminho]);
    return { erro: `Falha ao registrar material: ${erroInsert.message}` };
  }

  revalidatePath("/biblioteca");
  revalidatePath("/aba-aluno");
  return { sucesso: `"${titulo}" publicado na Biblioteca.` };
}

export async function enviarMaterialDeAula(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  let sessao;
  try {
    sessao = await exigirProfessorOuCoordenacao();
  } catch {
    return { erro: "Ação restrita a professores e coordenação." };
  }

  const aulaId = String(formData.get("aulaId") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const arquivo = formData.get("arquivo") as File | null;

  if (!aulaId || !titulo) return { erro: "Escolha a aula e informe um título." };
  const erroArquivo = validarArquivo(arquivo);
  if (erroArquivo) return { erro: erroArquivo };

  const caminho = `de_aula/${aulaId}/${nomeArquivoSeguro(arquivo!.name)}`;
  const supabase = createClient();

  const { error: erroUpload } = await supabase.storage
    .from("materiais")
    .upload(caminho, arquivo!, { contentType: arquivo!.type || undefined });
  if (erroUpload) {
    return {
      erro: `Falha ao enviar arquivo (confira se esta aula é da sua turma): ${erroUpload.message}`,
    };
  }

  const { error: erroInsert } = await supabase.from("materiais").insert({
    origem: "de_aula",
    aula_id: aulaId,
    enviado_por: sessao.pessoaId,
    titulo,
    tipo_arquivo: extensao(arquivo!.name),
    caminho_arquivo: caminho,
  });

  if (erroInsert) {
    await supabase.storage.from("materiais").remove([caminho]);
    return { erro: `Falha ao registrar material: ${erroInsert.message}` };
  }

  revalidatePath("/minha-turma");
  revalidatePath("/frequencia");
  revalidatePath("/biblioteca");
  return { sucesso: `"${titulo}" enviado.` };
}

export async function apagarMaterial(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  let sessao;
  try {
    sessao = await exigirProfessorOuCoordenacao();
  } catch {
    return { erro: "Ação restrita a professores e coordenação." };
  }

  const materialId = String(formData.get("materialId") ?? "");
  if (!materialId) return { erro: "Material inválido." };

  const supabase = createClient();
  const { data: material } = await supabase
    .from("materiais")
    .select("id, caminho_arquivo, enviado_por")
    .eq("id", materialId)
    .maybeSingle();

  if (!material) return { erro: "Material não encontrado." };
  if (sessao.role !== "coordenacao" && material.enviado_por !== sessao.pessoaId) {
    return { erro: "Você só pode apagar materiais que você mesmo enviou." };
  }

  const { error: erroDelete } = await supabase.from("materiais").delete().eq("id", materialId);
  if (erroDelete) return { erro: `Falha ao apagar: ${erroDelete.message}` };

  await supabase.storage.from("materiais").remove([material.caminho_arquivo]);

  revalidatePath("/biblioteca");
  revalidatePath("/minha-turma");
  revalidatePath("/frequencia");
  revalidatePath("/aba-aluno");
  return { sucesso: "Material removido." };
}
