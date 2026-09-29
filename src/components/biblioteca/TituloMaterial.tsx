"use client";

import { useState, useTransition } from "react";
import { renomearMaterial } from "@/lib/biblioteca/actions";

// Título do material com link para abrir e, se permitido, “renomear” no lugar.
export function TituloMaterial({
  materialId,
  titulo,
  href,
  icone,
  detalhe,
  editavel,
}: {
  materialId: string;
  titulo: string;
  href: string;
  icone: string;
  detalhe?: string;
  editavel: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(titulo);
  const [atual, setAtual] = useState(titulo);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function salvar() {
    if (valor.trim() === atual) return setEditando(false);
    iniciar(async () => {
      const r = await renomearMaterial(materialId, valor);
      if (r.erro) return setErro(r.erro);
      setAtual(valor.trim());
      setErro(null);
      setEditando(false);
    });
  }

  if (editando) {
    return (
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <input
            autoFocus
            aria-label="Novo nome do arquivo"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") salvar();
              if (e.key === "Escape") setEditando(false);
            }}
            className="min-w-[200px] flex-1 rounded-lg border border-border px-3 py-1.5 text-sm"
          />
          <button type="button" onClick={salvar} disabled={pendente} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">
            {pendente ? "Salvando…" : "Salvar"}
          </button>
          <button type="button" onClick={() => { setValor(atual); setErro(null); setEditando(false); }} className="text-xs text-text-secondary hover:underline">
            cancelar
          </button>
        </div>
        {erro && <p className="mt-1 text-xs text-danger">{erro}</p>}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <a href={href} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-sm text-primary hover:underline">
        <span>{icone}</span>
        <span className="min-w-0 break-words">
          {atual}
          {detalhe && <span className="block text-xs font-normal text-text-secondary">{detalhe}</span>}
        </span>
      </a>
      {editavel && (
        <button type="button" onClick={() => setEditando(true)} className="shrink-0 text-xs text-primary hover:underline">
          renomear
        </button>
      )}
    </div>
  );
}
