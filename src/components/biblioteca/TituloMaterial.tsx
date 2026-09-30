"use client";

import { useState, useTransition, type ReactNode } from "react";
import { moverMaterial, renomearMaterial } from "@/lib/biblioteca/actions";
import { ROTULO_PRATELEIRA, type Prateleira } from "./UploadBiblioteca";

export interface ConfigMover {
  prateleiras: Prateleira[];
  turmas: { id: string; nome: string }[];
}
export interface LocalAtual {
  categoria: Prateleira;
  turmaId: string | null;
  papel: "slides" | "apoio" | null;
}

// Título do material com link para abrir e, se permitido, “renomear” no lugar.
export function TituloMaterial({
  materialId,
  titulo,
  href,
  icone,
  detalhe,
  editavel,
  mover,
  atual: local,
  variante = "lista",
}: {
  variante?: "lista" | "cartao";
  mover?: ConfigMover;
  atual?: LocalAtual;
  materialId: string;
  titulo: string;
  href: string;
  icone: ReactNode;
  detalhe?: string;
  editavel: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(titulo);
  const [atual, setAtual] = useState(titulo);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [movendo, setMovendo] = useState(false);
  const [destino, setDestino] = useState<Prateleira>(local?.categoria ?? "aula");
  const [turmaDestino, setTurmaDestino] = useState(local?.turmaId ?? (local?.categoria === "aula" ? "unificada" : ""));
  const [papelDestino, setPapelDestino] = useState<"slides" | "apoio">(local?.papel ?? "slides");
  const [msgMover, setMsgMover] = useState<string | null>(null);

  function confirmarMover() {
    iniciar(async () => {
      const r = await moverMaterial(materialId, {
        categoria: destino,
        turmaId: destino === "aula" ? turmaDestino : null,
        papel: destino === "aula" ? papelDestino : null,
      });
      if (r.erro) return setMsgMover(r.erro);
      setMsgMover(null);
      setMovendo(false);
    });
  }

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

  const acoes = editavel && (
    <div className={`flex shrink-0 gap-3 text-xs ${variante === "cartao" ? "mt-2" : ""}`}>
      <button type="button" onClick={() => setEditando(true)} className="text-primary hover:underline">
        renomear
      </button>
      {mover && (
        <button type="button" onClick={() => setMovendo((v) => !v)} className="text-primary hover:underline">
          mover
        </button>
      )}
    </div>
  );

  return (
    <div className="min-w-0 flex-1">
    {variante === "cartao" ? (
      <>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          title={atual}
          className="line-clamp-3 break-words font-display text-[15px] font-semibold leading-snug text-text-primary hover:text-primary"
        >
          {atual}
        </a>
        {detalhe && <div className="mt-1 text-xs text-text-secondary">{detalhe}</div>}
        {acoes}
      </>
    ) : (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <a href={href} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-sm text-primary hover:underline">
        <span>{icone}</span>
        <span className="min-w-0 break-words">
          {atual}
          {detalhe && <span className="block text-xs font-normal text-text-secondary">{detalhe}</span>}
        </span>
      </a>
      {acoes}
    </div>
    )}
    {movendo && mover && (
      <div className="mt-2 flex flex-wrap items-end gap-2 rounded-lg bg-bg p-2 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-text-secondary">PRATELEIRA</span>
          <select value={destino} onChange={(e) => setDestino(e.target.value as Prateleira)} className="rounded border border-border bg-surface px-2 py-1">
            {mover.prateleiras.map((p) => (
              <option key={p} value={p}>{ROTULO_PRATELEIRA[p]}</option>
            ))}
          </select>
        </label>
        {destino === "aula" && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-text-secondary">TURMA</span>
              <select value={turmaDestino} onChange={(e) => setTurmaDestino(e.target.value)} className="rounded border border-border bg-surface px-2 py-1">
                {mover.turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
                <option value="unificada">Unificada (Homens + Mulheres)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-text-secondary">TIPO</span>
              <select value={papelDestino} onChange={(e) => setPapelDestino(e.target.value as "slides" | "apoio")} className="rounded border border-border bg-surface px-2 py-1">
                <option value="slides">Slides da aula</option>
                <option value="apoio">Material de apoio</option>
              </select>
            </label>
          </>
        )}
        <button type="button" onClick={confirmarMover} disabled={pendente} className="rounded-lg bg-primary px-3 py-1.5 font-medium text-white disabled:opacity-60">
          {pendente ? "Movendo…" : "Mover"}
        </button>
        <button type="button" onClick={() => { setMovendo(false); setMsgMover(null); }} className="text-text-secondary hover:underline">cancelar</button>
        {msgMover && <p className="w-full text-danger">{msgMover}</p>}
      </div>
    )}
    </div>
  );
}
