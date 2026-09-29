// Converte um arquivo (PDF, imagem, DOCX, PPTX) nos "blocos de conteúdo" que a
// API da Anthropic entende. PDF e imagem vão nativos (o modelo enxerga o
// layout); DOCX e PPTX não têm suporte nativo, então o texto é extraído aqui.
import JSZip from "jszip";
import type Anthropic from "@anthropic-ai/sdk";

export type BlocoArquivo =
  | Anthropic.TextBlockParam
  | Anthropic.ImageBlockParam
  | Anthropic.DocumentBlockParam;

export const TIPOS_ANEXO = ["pdf", "docx", "pptx", "png", "jpg", "jpeg"] as const;
export const TAMANHO_MAX_ANEXO = 20 * 1024 * 1024;

export function extensaoDe(nome: string): string {
  return (nome.split(".").pop() ?? "").toLowerCase();
}

function textoDoXml(xml: string, tag: "w:t" | "a:t", quebra: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([^<]*)</${tag}>|(${quebra})`, "g");
  let saida = "";
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    if (m[1] !== undefined) saida += m[1];
    else saida += "\n";
  }
  return saida
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function textoDeDocx(bytes: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("DOCX sem word/document.xml");
  return textoDoXml(xml, "w:t", "</w:p>");
}

export async function textoDePptx(bytes: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const slides = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/(\d+)\.xml$/)![1]) - Number(b.match(/(\d+)\.xml$/)![1]));
  const partes: string[] = [];
  for (const [i, nome] of slides.entries()) {
    const xml = await zip.file(nome)!.async("string");
    partes.push(`--- Slide ${i + 1} ---\n${textoDoXml(xml, "a:t", "</a:p>")}`);
    const notas = zip.file(nome.replace("slides/slide", "notesSlides/notesSlide"));
    if (notas) {
      const t = textoDoXml(await notas.async("string"), "a:t", "</a:p>");
      if (t) partes.push(`(anotações do slide ${i + 1}) ${t}`);
    }
  }
  return partes.join("\n\n");
}

export async function blocosDoArquivo(nome: string, bytes: Uint8Array): Promise<BlocoArquivo[]> {
  const ext = extensaoDe(nome);
  const base64 = Buffer.from(bytes).toString("base64");
  if (ext === "pdf") {
    return [
      { type: "text", text: `Arquivo anexado: ${nome}` },
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
    ];
  }
  if (ext === "png" || ext === "jpg" || ext === "jpeg") {
    return [
      { type: "text", text: `Imagem anexada: ${nome}` },
      {
        type: "image",
        source: { type: "base64", media_type: ext === "png" ? "image/png" : "image/jpeg", data: base64 },
      },
    ];
  }
  if (ext === "docx") {
    return [{ type: "text", text: `Documento Word anexado: ${nome}\n\n${await textoDeDocx(bytes)}` }];
  }
  if (ext === "pptx") {
    return [{ type: "text", text: `Apresentação PowerPoint anexada: ${nome}\n\n${await textoDePptx(bytes)}` }];
  }
  throw new Error(`Tipo .${ext} não é suportado (use PDF, DOCX, PPTX, PNG ou JPG).`);
}
