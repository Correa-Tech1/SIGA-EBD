import type { ReactNode } from "react";
import { IconePrateleira, type IdPrateleira } from "./IconesBiblioteca";

// Uma prateleira: cabeçalho com símbolo, grade de capas e a tábua de madeira
// embaixo, para os materiais parecerem apoiados nela.
export function Tabua() {
  return (
    <div
      className="h-3 rounded-b-md"
      style={{
        background: "linear-gradient(180deg,#A9794A 0%,#8B5E3C 55%,#6B4428 100%)",
        boxShadow: "0 6px 10px -4px rgba(60,35,15,0.45)",
      }}
      aria-hidden
    />
  );
}

export function GradeDeCapas({ vazio, compacta, children }: { vazio: boolean; compacta?: boolean; children: ReactNode }) {
  return (
    <div>
      {vazio ? (
        <div className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-[#D9CDB8] text-sm text-[#8A7A62]">
          Prateleira vazia por enquanto
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 gap-4 px-1 pb-4 pt-2 sm:grid-cols-2 ${compacta ? "" : "lg:grid-cols-3 xl:grid-cols-4"}`}
        >
          {children}
        </div>
      )}
      <Tabua />
    </div>
  );
}

export function PrateleiraMadeira({
  id,
  idVisual,
  titulo,
  descricao,
  quantidade,
  cor,
  vazio,
  semGrade,
  children,
}: {
  id: string;
  idVisual: IdPrateleira;
  titulo: string;
  descricao: string;
  quantidade: number;
  cor: string;
  vazio: boolean;
  semGrade?: boolean; // conteúdo próprio (ex.: Aulas, com várias turmas)
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-2xl border border-[#E6DCC8] bg-[#FBF7EF] p-5 shadow-sm">
      <header className="mb-4 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: cor }}>
          <IconePrateleira id={idVisual} tamanho={24} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            {titulo}{" "}
            <span className="ml-1 rounded-full bg-[#EFE6D3] px-2 py-0.5 align-middle text-xs font-semibold text-[#7A6648]">
              {quantidade}
            </span>
          </h2>
          <p className="text-xs leading-relaxed text-[#7A6648]">{descricao}</p>
        </div>
      </header>
      {semGrade ? children : <GradeDeCapas vazio={vazio}>{children}</GradeDeCapas>}
    </section>
  );
}
