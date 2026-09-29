"use client";

export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
    >
      Imprimir / salvar em PDF
    </button>
  );
}
