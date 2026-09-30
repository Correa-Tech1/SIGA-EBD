import type { ReactNode } from "react";

// Símbolos da Biblioteca: um por tipo de arquivo (cor + desenho + extensão) e
// um por prateleira. SVG inline, sem dependência externa.
export interface VisualTipo {
  rotulo: string; // "PDF", "PPT"…
  nome: string; // "Documento PDF"
  cor: string; // cor forte (ícone/etiqueta)
  fundo: string; // tom claro da capa
  glifo: "pagina" | "slides" | "audio" | "video" | "imagem" | "planilha" | "livro";
}

const TIPOS: Record<string, VisualTipo> = {
  pdf: { rotulo: "PDF", nome: "Documento PDF", cor: "#C62828", fundo: "#FDECEA", glifo: "pagina" },
  doc: { rotulo: "DOC", nome: "Documento Word", cor: "#1E5AA8", fundo: "#E8F0FB", glifo: "pagina" },
  docx: { rotulo: "DOC", nome: "Documento Word", cor: "#1E5AA8", fundo: "#E8F0FB", glifo: "pagina" },
  ppt: { rotulo: "PPT", nome: "Slides", cor: "#D35400", fundo: "#FDEEE1", glifo: "slides" },
  pptx: { rotulo: "PPT", nome: "Slides", cor: "#D35400", fundo: "#FDEEE1", glifo: "slides" },
  xlsx: { rotulo: "XLS", nome: "Planilha", cor: "#1B6B3A", fundo: "#E3F3E9", glifo: "planilha" },
  epub: { rotulo: "EPUB", nome: "Livro digital", cor: "#6A3FA0", fundo: "#F0EAF8", glifo: "livro" },
  mp3: { rotulo: "MP3", nome: "Áudio", cor: "#7B3FA0", fundo: "#F3EAF8", glifo: "audio" },
  mp4: { rotulo: "MP4", nome: "Vídeo", cor: "#0E7C86", fundo: "#E0F2F3", glifo: "video" },
  youtube: { rotulo: "YOUTUBE", nome: "Vídeo (link)", cor: "#C62828", fundo: "#FDECEA", glifo: "video" },
  vimeo: { rotulo: "VIMEO", nome: "Vídeo (link)", cor: "#0E7C86", fundo: "#E0F2F3", glifo: "video" },
  jpg: { rotulo: "JPG", nome: "Imagem", cor: "#2E7D32", fundo: "#E6F3E7", glifo: "imagem" },
  jpeg: { rotulo: "JPG", nome: "Imagem", cor: "#2E7D32", fundo: "#E6F3E7", glifo: "imagem" },
  png: { rotulo: "PNG", nome: "Imagem", cor: "#2E7D32", fundo: "#E6F3E7", glifo: "imagem" },
};

export function tipoVisual(tipo: string): VisualTipo {
  return (
    TIPOS[tipo.toLowerCase()] ?? { rotulo: tipo.toUpperCase().slice(0, 5) || "ARQ", nome: "Arquivo", cor: "#5B6B76", fundo: "#ECEFF1", glifo: "pagina" }
  );
}

const traco = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Svg({ tamanho, children }: { tamanho: number; children: ReactNode }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden {...traco}>
      {children}
    </svg>
  );
}

export function IconeArquivo({ tipo, tamanho = 40 }: { tipo: string; tamanho?: number }) {
  const { glifo } = tipoVisual(tipo);
  switch (glifo) {
    case "slides":
      return (
        <Svg tamanho={tamanho}>
          <rect x="3" y="4" width="18" height="12" rx="1.5" />
          <path d="M12 16v4M8 20h8M7 13v-3M11 13V8M15 13v-2" />
        </Svg>
      );
    case "audio":
      return (
        <Svg tamanho={tamanho}>
          <path d="M9 18V6l10-2v12" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="16.5" cy="16" r="2.5" />
        </Svg>
      );
    case "video":
      return (
        <Svg tamanho={tamanho}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M10 9.5v5l4.5-2.5z" />
        </Svg>
      );
    case "imagem":
      return (
        <Svg tamanho={tamanho}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M21 16l-5-5-8 9" />
        </Svg>
      );
    case "planilha":
      return (
        <Svg tamanho={tamanho}>
          <rect x="4" y="4" width="16" height="16" rx="1.5" />
          <path d="M4 10h16M4 15h16M10 4v16" />
        </Svg>
      );
    case "livro":
      return <IconePrateleira id="livro" tamanho={tamanho} />;
    default:
      return (
        <Svg tamanho={tamanho}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5M9 13h6M9 17h6" />
        </Svg>
      );
  }
}

export type IdPrateleira = "livro" | "institucional" | "apoio_professor" | "aula";

export function IconePrateleira({ id, tamanho = 28 }: { id: IdPrateleira; tamanho?: number }) {
  switch (id) {
    case "livro":
      return (
        <Svg tamanho={tamanho}>
          <path d="M2 5.5C4.5 4 8 4 12 6c4-2 7.5-2 10-.5V19c-2.5-1.5-6-1.5-10 .5-4-2-7.5-2-10-.5z" />
          <path d="M12 6v13.5" />
        </Svg>
      );
    case "institucional":
      return (
        <Svg tamanho={tamanho}>
          <path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />
        </Svg>
      );
    case "apoio_professor":
      return (
        <Svg tamanho={tamanho}>
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
        </Svg>
      );
    default:
      return (
        <Svg tamanho={tamanho}>
          <rect x="3" y="4" width="18" height="12" rx="1.5" />
          <path d="M12 16v4M8 20h8M9 10l2 2 4-4" />
        </Svg>
      );
  }
}
