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

function validarArquivo(arquivo: File): string | null {
  if (arquivo.size === 0) return `"${arquivo.name}": arquivo vazio.`;
  if (arquivo.size > TAMANHO_MAX_BYTES) return `"${arquivo.name}": maior que 25MB.`;
  if (!TIPOS_ACEITOS.has(extensao(arquivo.name))) {
    return `"${arquivo.name}": tipo ".${extensao(arquivo.name)}" não é aceito.`;
  }
  return null;
}

// Título de cada arquivo quando vários são enviados de uma vez: usa o nome
// do próprio arquivo (sem extensão), prefixado pelo título comum se um foi
// informado — assim dá pra selecionar vários arquivos numa tacada só, sem
// precisar de um título por arquivo.
function tituloPara(nomeArquivo: string, prefixoComum: string): string {
  const semExtensao = nomeArquivo.replace(/\.[^./]+$/, "");
  return prefixoComum ? `${prefixoComum} — ${semExtensao}` : semExtensao;
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
  const prefixoComum = String(formData.get("titulo") ?? "").trim();
  const arquivos = formData.getAll("arquivos").filter((a): a is File => a instanceof File && a.size > 0);

  if (!moduloId) return { erro: "Escolha o módulo." };
  if (arquivos.length === 0) return { erro: "Escolha ao menos um arquivo." };
  for (const arquivo of arquivos) {
    const erroArquivo = validarArquivo(arquivo);
    if (erroArquivo) return { erro: erroArquivo };
  }

  const supabase = createClient();
  const enviados: string[] = [];

  for (const arquivo of arquivos) {
    const titulo = tituloPara(arquivo.name, prefixoComum);
    const caminho = `oficial/${moduloId}/${nomeArquivoSeguro(arquivo.name)}`;

    const { error: erroUpload } = await supabase.storage
      .from("materiais")
      .upload(caminho, arquivo, { contentType: arquivo.type || undefined });
    if (erroUpload) {
      return {
        erro: `Falha ao enviar "${arquivo.name}": ${erroUpload.message}${
          enviados.length ? ` (${enviados.length} arquivo(s) já publicado(s) antes deste)` : ""
        }`,
      };
    }

    const { error: erroInsert } = await supabase.from("materiais").insert({
      origem: "oficial",
      modulo_id: moduloId,
      titulo,
      tipo_arquivo: extensao(arquivo.name),
      caminho_arquivo: caminho,
    });

    if (erroInsert) {
      await supabase.storage.from("materiais").remove([caminho]);
      return { erro: `Falha ao registrar "${arquivo.name}": ${erroInsert.message}` };
    }

    enviados.push(titulo);
  }

  revalidatePath("/biblioteca");
  revalidatePath("/aba-aluno");
  return {
    sucesso:
      enviados.length === 1
        ? `"${enviados[0]}" publicado na Biblioteca.`
        : `${enviados.length} materiais publicados na Biblioteca.`,
  };
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
  const prefixoComum = String(formData.get("titulo") ?? "").trim();
  const arquivos = formData.getAll("arquivos").filter((a): a is File => a instanceof File && a.size > 0);

  if (!aulaId) return { erro: "Escolha a aula." };
  if (arquivos.length === 0) return { erro: "Escolha ao menos um arquivo." };
  for (const arquivo of arquivos) {
    const erroArquivo = validarArquivo(arquivo);
    if (erroArquivo) return { erro: erroArquivo };
  }

  const supabase = createClient();
  const enviados: string[] = [];

  for (const arquivo of arquivos) {
    const titulo = tituloPara(arquivo.name, prefixoComum);
    const caminho = `de_aula/${aulaId}/${nomeArquivoSeguro(arquivo.name)}`;

    const { error: erroUpload } = await supabase.storage
      .from("materiais")
      .upload(caminho, arquivo, { contentType: arquivo.type || undefined });
    if (erroUpload) {
      return {
        erro: `Falha ao enviar "${arquivo.name}" (confira se esta aula é da sua turma): ${erroUpload.message}`,
      };
    }

    const { error: erroInsert } = await supabase.from("materiais").insert({
      origem: "de_aula",
      aula_id: aulaId,
      enviado_por: sessao.pessoaId,
      titulo,
      tipo_arquivo: extensao(arquivo.name),
      caminho_arquivo: caminho,
    });

    if (erroInsert) {
      await supabase.storage.from("materiais").remove([caminho]);
      return { erro: `Falha ao registrar "${arquivo.name}": ${erroInsert.message}` };
    }

    enviados.push(titulo);
  }

  revalidatePath("/minha-turma");
  revalidatePath("/frequencia");
  revalidatePath("/biblioteca");
  return {
    sucesso: enviados.length === 1 ? `"${enviados[0]}" enviado.` : `${enviados.length} arquivos enviados.`,
  };
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
