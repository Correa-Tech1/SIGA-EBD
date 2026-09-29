// Ferramentas que o Auxílio pode chamar sozinho durante a conversa:
// consultar e ler a Biblioteca. Tudo roda com a sessão de quem está logado
// (RLS), nunca com a service_role.
import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { blocosDoArquivo, extensaoDe, type BlocoArquivo } from "./arquivos";
import { gerarPptx, type DeckSpec, type Layout } from "./slides";

export interface ArquivoGerado {
  nome: string;
  caminho: string; // bucket privado 'auxilio'
}

export interface ContextoFerramentas {
  pessoaId: string;
  gerados: ArquivoGerado[];
}

const LAYOUTS: Layout[] = ["capa", "pergunta", "imagem", "destaque", "cards", "colunas", "tese", "versiculo", "sequencia", "frase", "fechamento"];

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
  {
    name: "gerar_slides",
    description:
      "Gera um arquivo PowerPoint (.pptx) EDITÁVEL com os slides da aula, no estilo visual da EBD. Chame quando o professor pedir slides/apresentação e o conteúdo já estiver definido. O primeiro slide deve ser sempre uma 'capa' com o título da aula. Cada slide tem um 'layout'; preencha só os campos que o layout usa. Nos textos, **assim** vira destaque colorido e ^14^ vira número de versículo sobrescrito.",
    input_schema: {
      type: "object",
      properties: {
        titulo_arquivo: { type: "string", description: "Nome do arquivo, ex.: 'Lição 9 — Formando gente'." },
        slides: {
          type: "array",
          description: "Slides em ordem.",
          items: {
            type: "object",
            properties: {
              layout: {
                type: "string",
                enum: LAYOUTS,
                description:
                  "capa(kicker,titulo,subtitulo,rodape) · pergunta(texto,rodape?) · imagem(legenda?) — espaço para o professor colar imagem/vídeo · destaque(kicker,linha1,linha2,texto?) · cards(kicker,titulo,cards[2-5]{titulo,texto},fecho?) · colunas(kicker,titulo,colunas[2-3]{rotulo,linhas[]}) · tese(kicker,linha1,linha2) · versiculo(kicker=referência,texto,pergunta?) · sequencia(kicker,titulo,passos[2-4]{titulo,legenda},citacao?,fecho?) · frase(linha1,linha2?) · fechamento(linhas[3])",
              },
              tema: { type: "string", enum: ["escuro", "claro"], description: "Alterne escuro/claro para dar ritmo." },
              kicker: { type: "string", description: "Rótulo pequeno no topo (ex.: 'O CASO BARCELONA', 'MATEUS 5.14-16')." },
              titulo: { type: "string" },
              subtitulo: { type: "string" },
              rodape: { type: "string" },
              texto: { type: "string" },
              linha1: { type: "string" },
              linha2: { type: "string" },
              legenda: { type: "string" },
              pergunta: { type: "string" },
              citacao: { type: "string" },
              fecho: { type: "string" },
              nota: { type: "string", description: "Anotações do professor (notas do orador) — não aparecem no slide." },
              cards: { type: "array", items: { type: "object", properties: { titulo: { type: "string" }, texto: { type: "string" } }, required: ["titulo"] } },
              colunas: { type: "array", items: { type: "object", properties: { rotulo: { type: "string" }, linhas: { type: "array", items: { type: "string" } } }, required: ["rotulo", "linhas"] } },
              passos: { type: "array", items: { type: "object", properties: { titulo: { type: "string" }, legenda: { type: "string" } }, required: ["titulo"] } },
              linhas: { type: "array", items: { type: "string" } },
            },
            required: ["layout"],
          },
        },
      },
      required: ["titulo_arquivo", "slides"],
    },
  },
];

const LIMITE_LEITURA = 12 * 1024 * 1024; // 12 MB por leitura

export async function executarFerramenta(
  nome: string,
  entrada: Record<string, unknown>,
  ctx: ContextoFerramentas
): Promise<string | BlocoArquivo[]> {
  const supabase = createClient();

  if (nome === "gerar_slides") {
    const deck = entrada as unknown as DeckSpec;
    if (!deck || !Array.isArray(deck.slides) || deck.slides.length === 0) return "Nenhum slide informado.";
    if (deck.slides.length > 40) return "Máximo de 40 slides por arquivo.";
    if (deck.slides.some((sl) => !LAYOUTS.includes(sl.layout))) return "Há slide com layout inválido.";
    try {
      const buffer = await gerarPptx(deck);
      const base = String(deck.titulo_arquivo || "aula")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\- ]+/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .slice(0, 60) || "aula";
      const caminho = `${ctx.pessoaId}/gerados/${Date.now()}-${base}.pptx`;
      const { error } = await supabase.storage.from("auxilio").upload(caminho, buffer, {
        contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
      if (error) return `Não consegui salvar o arquivo: ${error.message}`;
      ctx.gerados.push({ nome: `${deck.titulo_arquivo || "aula"}.pptx`, caminho });
      return `Arquivo gerado com sucesso: "${deck.titulo_arquivo}.pptx" (${deck.slides.length} slides). O professor já pode baixá-lo abaixo da sua resposta; diga o que foi montado e o que ele precisa completar (imagens, vídeos).`;
    } catch (e) {
      return `Falha ao gerar o PowerPoint: ${e instanceof Error ? e.message : "erro"}`;
    }
  }

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
