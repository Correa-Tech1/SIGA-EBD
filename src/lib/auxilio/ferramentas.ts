// Ferramentas que o Auxílio pode chamar sozinho durante a conversa:
// consultar e ler a Biblioteca. Tudo roda com a sessão de quem está logado
// (RLS), nunca com a service_role.
import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { blocosDoArquivo, extensaoDe, type BlocoArquivo } from "./arquivos";

export const FERRAMENTAS: Anthropic.Tool[] = [
  {
    name: "listar_biblioteca",
    description:
      "Lista os materiais da Biblioteca da EBD (livros, materiais institucionais e aulas publicadas pelos professores). Use para descobrir o que existe antes de ler. Retorna id, título, categoria e tipo de cada material.",
    input_schema: {
      type: "object",
      properties: {
        categoria: { type: "string", enum: ["livro", "institucional", "aula"], description: "Filtrar por prateleira (opcional)." },
        busca: { type: "string", description: "Trecho do título (opcional)." },
      },
    },
  },
  {
    name: "ler_material",
    description:
      "Lê o conteúdo de um material da Biblioteca pelo id (PDF, DOCX, PPTX ou imagem). Chame listar_biblioteca antes para obter o id. Leia só o que for realmente necessário: livros grandes são caros.",
    input_schema: {
      type: "object",
      properties: { id: { type: "string", description: "id do material" } },
      required: ["id"],
    },
  },
];

const LIMITE_LEITURA = 12 * 1024 * 1024; // 12 MB por leitura

export async function executarFerramenta(
  nome: string,
  entrada: Record<string, unknown>
): Promise<string | BlocoArquivo[]> {
  const supabase = createClient();

  if (nome === "listar_biblioteca") {
    let q = supabase
      .from("materiais")
      .select("id, titulo, categoria, tipo_arquivo, turma_id")
      .order("criado_em", { ascending: false })
      .limit(80);
    if (typeof entrada.categoria === "string") q = q.eq("categoria", entrada.categoria as "livro" | "institucional" | "aula");
    if (typeof entrada.busca === "string" && entrada.busca.trim()) q = q.ilike("titulo", `%${entrada.busca.trim()}%`);
    const { data, error } = await q;
    if (error) return `Erro ao listar: ${error.message}`;
    if (!data || data.length === 0) return "Nenhum material encontrado.";
    return data.map((m) => `${m.id} | ${m.categoria} | .${m.tipo_arquivo} | ${m.titulo}`).join("\n");
  }

  if (nome === "ler_material") {
    const id = typeof entrada.id === "string" ? entrada.id : "";
    const { data: m } = await supabase
      .from("materiais")
      .select("titulo, tipo_arquivo, caminho_arquivo")
      .eq("id", id)
      .maybeSingle();
    if (!m) return "Material não encontrado.";
    const ext = extensaoDe(`x.${m.tipo_arquivo}`);
    if (!["pdf", "docx", "pptx", "png", "jpg", "jpeg"].includes(ext)) {
      return `O formato .${ext} não pode ser lido pelo Auxílio.`;
    }
    const { data: blob, error } = await supabase.storage.from("materiais").download(m.caminho_arquivo);
    if (error || !blob) return `Não consegui baixar o arquivo: ${error?.message ?? "sem retorno"}`;
    if (blob.size > LIMITE_LEITURA) {
      return `"${m.titulo}" tem ${(blob.size / 1048576).toFixed(1)} MB, acima do limite de leitura (12 MB). Peça ao professor um trecho ou capítulo em arquivo menor.`;
    }
    try {
      return await blocosDoArquivo(`${m.titulo}.${ext}`, new Uint8Array(await blob.arrayBuffer()));
    } catch (e) {
      return `Falha ao ler o arquivo: ${e instanceof Error ? e.message : "erro"}`;
    }
  }

  return `Ferramenta desconhecida: ${nome}`;
}
