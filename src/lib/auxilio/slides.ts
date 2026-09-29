// Gerador de slides (PPTX editável) no estilo visual das aulas da EBD, tirado
// da "Lição 8 — Aprendendo de Cor": fundo azul-marinho/creme, títulos em
// Cambria, rótulos em Calibri dourado, cartões com filete. Tudo sai como
// texto e formas nativas do PowerPoint — o professor edita à vontade.
import PptxGenJS from "pptxgenjs";

export const PALETA = {
  marinho: "1B2B3F",
  azul: "1F3864",
  creme: "FBF6EC",
  ouro: "D9A054",
  ouroEscuro: "8A6D3B",
  ferrugem: "9C4221",
  branco: "FFFFFF",
  texto: "22262E",
  cinza: "6B7280",
  bordaClara: "E4D9C3",
} as const;

export type Layout =
  | "capa"
  | "pergunta"
  | "imagem"
  | "destaque"
  | "cards"
  | "colunas"
  | "tese"
  | "versiculo"
  | "sequencia"
  | "frase"
  | "fechamento";

export interface SlideSpec {
  layout: Layout;
  tema?: "escuro" | "claro";
  kicker?: string;
  titulo?: string;
  subtitulo?: string;
  rodape?: string;
  texto?: string;
  linha1?: string;
  linha2?: string;
  nota?: string;
  legenda?: string;
  referencia?: string;
  pergunta?: string;
  citacao?: string;
  fecho?: string;
  cards?: { titulo: string; texto?: string }[];
  colunas?: { rotulo: string; linhas: string[] }[];
  passos?: { titulo: string; legenda?: string }[];
  linhas?: string[];
}

export interface DeckSpec {
  titulo_arquivo: string;
  slides: SlideSpec[];
}

type Cores = {
  fundo: string;
  titulo: string;
  destaque: string;
  kicker: string;
  corpo: string;
  suave: string;
  cardFundo: string;
  cardBorda: string;
  cardTitulo: string;
};

function cores(tema: "escuro" | "claro", azul = false): Cores {
  if (tema === "escuro") {
    return {
      fundo: azul ? PALETA.azul : PALETA.marinho,
      titulo: PALETA.branco,
      destaque: PALETA.ouro,
      kicker: PALETA.ouro,
      corpo: PALETA.branco,
      suave: PALETA.ouro,
      cardFundo: PALETA.azul,
      cardBorda: PALETA.ouroEscuro,
      cardTitulo: PALETA.ouro,
    };
  }
  return {
    fundo: PALETA.creme,
    titulo: PALETA.azul,
    destaque: PALETA.ferrugem,
    kicker: PALETA.ouroEscuro,
    corpo: PALETA.texto,
    suave: PALETA.cinza,
    cardFundo: PALETA.branco,
    cardBorda: PALETA.bordaClara,
    cardTitulo: PALETA.ferrugem,
  };
}

// Marcação simples nos textos: **destaque** (negrito na cor de destaque) e ^14^ (número de versículo sobrescrito).
function runs(texto: string, base: { fontFace: string; fontSize: number; color: string; bold?: boolean; italic?: boolean }, destaque: string) {
  const partes: PptxGenJS.TextProps[] = [];
  const re = /\*\*(.+?)\*\*|\^(\d+(?:[-–]\d+)?)\^/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    if (m.index > ultimo) partes.push({ text: texto.slice(ultimo, m.index), options: { ...base } });
    if (m[1] !== undefined) partes.push({ text: m[1], options: { ...base, bold: true, color: destaque } });
    else partes.push({ text: m[2] + " ", options: { ...base, superscript: true, bold: true, color: destaque } });
    ultimo = re.lastIndex;
  }
  if (ultimo < texto.length) partes.push({ text: texto.slice(ultimo), options: { ...base } });
  return partes;
}

const TITULO = "Cambria";
const CORPO = "Calibri";

export async function gerarPptx(deck: DeckSpec): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13,33 × 7,5 pol
  pptx.title = deck.titulo_arquivo;
  pptx.author = "SIGA EBD";

  for (const s of deck.slides) {
    const slide = pptx.addSlide();
    const tema = s.tema ?? (["destaque", "sequencia"].includes(s.layout) ? "claro" : "escuro");
    const c = cores(tema, s.layout === "tese");
    slide.background = { color: c.fundo };

    const kicker = () => {
      if (!s.kicker) return;
      slide.addText(s.kicker.toUpperCase(), {
        x: 0.7, y: 0.4, w: 9, h: 0.3, fontFace: CORPO, fontSize: 12, bold: true, color: c.kicker, charSpacing: 3, margin: 0,
      });
    };
    const titulo = (t?: string) => {
      if (!t) return;
      slide.addText(t, { x: 0.7, y: 0.75, w: 12, h: 0.9, fontFace: TITULO, fontSize: 38, bold: true, color: c.titulo, margin: 0, valign: "top", fit: "shrink" });
    };
    if (s.nota) slide.addNotes(s.nota);

    switch (s.layout) {
      case "capa": {
        kicker();
        slide.addText(s.titulo ?? "", { x: 1.0, y: 1.9, w: 11.3, h: 2.6, fontFace: TITULO, fontSize: 58, bold: true, color: c.titulo, align: "center", valign: "middle", fit: "shrink" });
        if (s.subtitulo)
          slide.addText(s.subtitulo, { x: 1.0, y: 4.6, w: 11.3, h: 0.9, fontFace: TITULO, fontSize: 26, italic: true, color: c.destaque, align: "center", valign: "top", fit: "shrink" });
        if (s.rodape)
          slide.addText(s.rodape, { x: 1.2, y: 6.5, w: 10.9, h: 0.4, fontFace: CORPO, fontSize: 14, color: c.suave, align: "center" });
        break;
      }
      case "pergunta": {
        kicker();
        slide.addText(s.texto ?? s.titulo ?? "", { x: 1.2, y: 1.6, w: 10.9, h: 3.8, fontFace: TITULO, fontSize: 44, bold: true, color: c.titulo, align: "center", valign: "middle", fit: "shrink" });
        if (s.rodape)
          slide.addText(s.rodape, { x: 1.2, y: 6.5, w: 10.9, h: 0.4, fontFace: CORPO, fontSize: 14, color: c.suave, align: "center" });
        break;
      }
      case "imagem": {
        slide.addShape(pptx.ShapeType.ellipse, { x: 4.67, y: 1.75, w: 4.0, h: 4.0, fill: { type: "none" }, line: { color: PALETA.ouro, width: 1, dashType: "dash" } });
        slide.addText(s.legenda ?? "cole a imagem ou o vídeo aqui", { x: 4.67, y: 3.6, w: 4.0, h: 0.4, fontFace: CORPO, fontSize: 14, italic: true, color: PALETA.ouro, align: "center" });
        break;
      }
      case "destaque": {
        kicker();
        if (s.linha1) slide.addText(s.linha1, { x: 0.9, y: 1.7, w: 11.5, h: 1.3, fontFace: TITULO, fontSize: 34, color: c.titulo, align: "center", valign: "middle", fit: "shrink" });
        slide.addText(s.linha2 ?? s.titulo ?? "", { x: 0.9, y: 3.1, w: 11.5, h: 1.9, fontFace: TITULO, fontSize: 44, bold: true, color: c.destaque, align: "center", valign: "middle", fit: "shrink" });
        if (s.texto) slide.addText(s.texto, { x: 1.3, y: 5.5, w: 10.7, h: 1.0, fontFace: TITULO, fontSize: 20, italic: true, color: c.suave, align: "center", valign: "top", fit: "shrink" });
        break;
      }
      case "frase": {
        kicker();
        slide.addText(s.linha1 ?? "", { x: 1.0, y: 1.6, w: 11.3, h: 1.6, fontFace: TITULO, fontSize: 44, bold: true, color: c.titulo, align: "center", valign: "middle", fit: "shrink" });
        if (s.linha2)
          slide.addText(s.linha2, { x: 1.0, y: 3.5, w: 11.3, h: 1.9, fontFace: TITULO, fontSize: 44, bold: true, color: c.destaque, align: "center", valign: "middle", fit: "shrink" });
        break;
      }
      case "tese": {
        kicker();
        slide.addText(s.linha1 ?? "", { x: 1.0, y: 1.8, w: 11.3, h: 1.9, fontFace: TITULO, fontSize: 38, bold: true, color: c.titulo, align: "center", valign: "middle", fit: "shrink" });
        if (s.linha2)
          slide.addText(s.linha2, { x: 1.0, y: 3.9, w: 11.3, h: 1.8, fontFace: TITULO, fontSize: 44, bold: true, color: c.destaque, align: "center", valign: "middle", fit: "shrink" });
        break;
      }
      case "cards": {
        kicker();
        titulo(s.titulo);
        const cards = (s.cards ?? []).slice(0, 5);
        const n = Math.max(cards.length, 1);
        const gap = 0.16;
        const areaW = 12.0;
        const w = (areaW - gap * (n - 1)) / n;
        const altura = n >= 4 ? 2.1 : 3.2;
        const larg = n >= 4 ? 20 : 22;
        cards.forEach((card, i) => {
          const x = 0.7 + i * (w + gap);
          slide.addShape(pptx.ShapeType.rect, { x, y: 2.05, w, h: altura, fill: { color: c.cardFundo }, line: { color: c.cardBorda, width: 1 } });
          slide.addText(card.titulo, { x: x + 0.15, y: 2.25, w: w - 0.3, h: 0.7, fontFace: TITULO, fontSize: larg + (n >= 4 ? 4 : 0), bold: true, color: c.cardTitulo, align: n >= 4 ? "center" : "left", valign: "top", fit: "shrink" });
          if (card.texto)
            slide.addText(card.texto, { x: x + 0.15, y: 3.05, w: w - 0.3, h: altura - 1.2, fontFace: CORPO, fontSize: n >= 4 ? 18 : 18, color: tema === "escuro" ? PALETA.branco : PALETA.texto, align: n >= 4 ? "center" : "left", valign: "top", fit: "shrink" });
        });
        if (s.fecho)
          slide.addText(s.fecho, { x: 0.7, y: 2.05 + altura + 0.5, w: 12, h: 1.3, fontFace: TITULO, fontSize: 30, italic: true, bold: true, color: c.destaque, align: "center", valign: "middle", fit: "shrink" });
        break;
      }
      case "colunas": {
        kicker();
        titulo(s.titulo);
        const cols = (s.colunas ?? []).slice(0, 3);
        const n = Math.max(cols.length, 1);
        const gap = 0.2;
        const w = (11.9 - gap * (n - 1)) / n;
        cols.forEach((col, i) => {
          const x = 0.7 + i * (w + gap);
          slide.addShape(pptx.ShapeType.rect, { x, y: 2.05, w, h: 4.3, fill: { color: c.cardFundo }, line: { color: c.cardBorda, width: 1 } });
          slide.addText(col.rotulo.toUpperCase(), { x: x + 0.3, y: 2.35, w: w - 0.6, h: 0.4, fontFace: CORPO, fontSize: 15, bold: true, color: c.cardTitulo, charSpacing: 2, margin: 0 });
          slide.addText(
            col.linhas.map((l) => ({ text: l, options: { breakLine: true } })),
            { x: x + 0.3, y: 3.0, w: w - 0.6, h: 3.1, fontFace: TITULO, fontSize: 26, bold: true, color: tema === "escuro" ? PALETA.branco : PALETA.texto, valign: "top", paraSpaceAfter: 8, fit: "shrink" }
          );
        });
        break;
      }
      case "versiculo": {
        kicker();
        const t = s.texto ?? "";
        const tamanho = t.length > 700 ? 17 : t.length > 450 ? 20 : t.length > 250 ? 24 : 28;
        slide.addText(runs(t, { fontFace: TITULO, fontSize: tamanho, color: tema === "escuro" ? PALETA.branco : PALETA.texto }, c.destaque), {
          x: 1.0, y: 1.2, w: 11.3, h: s.pergunta ? 4.7 : 5.5, valign: "middle", paraSpaceAfter: 6, fit: "shrink",
        });
        if (s.pergunta)
          slide.addText(s.pergunta, { x: 1.0, y: 6.1, w: 11.3, h: 0.7, fontFace: TITULO, fontSize: 22, italic: true, color: tema === "escuro" ? PALETA.ouro : PALETA.azul, fit: "shrink" });
        break;
      }
      case "sequencia": {
        kicker();
        titulo(s.titulo);
        const passos = (s.passos ?? []).slice(0, 4);
        const n = Math.max(passos.length, 1);
        const seta = 0.4;
        const w = (11.9 - seta * (n - 1)) / n;
        passos.forEach((p, i) => {
          const x = 0.9 + i * (w + seta);
          slide.addShape(pptx.ShapeType.rect, { x, y: 2.0, w, h: 2.5, fill: { color: c.cardFundo }, line: { color: c.cardBorda, width: 1 } });
          slide.addText(p.titulo, { x: x + 0.2, y: 2.3, w: w - 0.4, h: 0.8, fontFace: TITULO, fontSize: 26, bold: true, color: c.cardTitulo, align: "center", fit: "shrink" });
          if (p.legenda)
            slide.addText(p.legenda, { x: x + 0.2, y: 3.2, w: w - 0.4, h: 0.8, fontFace: CORPO, fontSize: 17, italic: true, color: c.suave, align: "center", fit: "shrink" });
          if (i < n - 1)
            slide.addText("→", { x: x + w, y: 2.7, w: seta, h: 0.6, fontFace: CORPO, fontSize: 26, color: c.kicker, align: "center", margin: 0 });
        });
        if (s.citacao)
          slide.addText(s.citacao, { x: 0.9, y: 5.0, w: 11.5, h: 1.1, fontFace: TITULO, fontSize: 22, bold: true, color: c.titulo, fit: "shrink" });
        if (s.fecho)
          slide.addText(s.fecho, { x: 0.9, y: 6.2, w: 11.5, h: 0.7, fontFace: TITULO, fontSize: 20, italic: true, color: c.titulo, fit: "shrink" });
        break;
      }
      case "fechamento": {
        const l = s.linhas ?? [];
        if (l[0]) slide.addText(l[0], { x: 1.1, y: 1.1, w: 11.1, h: 1.4, fontFace: TITULO, fontSize: 26, color: PALETA.ouro, fit: "shrink" });
        if (l[1]) slide.addText(l[1], { x: 1.1, y: 2.5, w: 11.1, h: 1.3, fontFace: TITULO, fontSize: 30, bold: true, color: PALETA.ouro, fit: "shrink" });
        if (l[2]) slide.addText(l[2], { x: 1.1, y: 4.2, w: 11.1, h: 2.2, fontFace: TITULO, fontSize: 52, bold: true, color: PALETA.branco, valign: "middle", fit: "shrink" });
        break;
      }
    }
  }

  const saida = await pptx.write({ outputType: "nodebuffer" });
  return saida as Buffer;
}
