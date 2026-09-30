"use client";

import { useState } from "react";
import { abrirPreparo } from "@/lib/auxilio/mesa-actions";
import { infoDaAula, temPlano } from "@/lib/calendario/plano2s2026";
import { fmtDomingo } from "@/lib/auxilio/mesa";

// O professor escolhe a turma e a data que quiser — não precisa existir
// escala nem aula "marcada". Se a data cair numa lição do Plano de Ensino,
// mostramos a lição na hora.
export function NovoPreparoForm({
  turmas,
  domingos,
}: {
  turmas: { id: string; nome: string }[];
  domingos: string[];
}) {
  const [turmaId, setTurmaId] = useState(turmas[0]?.id ?? "");
  const [data, setData] = useState(domingos[0] ?? "");

  const turma = turmas.find((t) => t.id === turmaId);
  const info = turma && data ? infoDaAula(turma.nome, data) : null;
  const semAula = turma && data && temPlano(turma.nome) && !info;

  return (
    <form action={abrirPreparo} className="rounded-xl border border-dashed border-primary/50 bg-surface p-3">
      <p className="mb-2 text-xs font-semibold tracking-wide text-primary">PREPARAR UMA AULA</p>

      <label className="block text-xs text-text-secondary" htmlFor="np-turma">
        Turma
      </label>
      <select
        id="np-turma"
        name="turmaId"
        value={turmaId}
        onChange={(e) => setTurmaId(e.target.value)}
        className="mb-2 mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm"
      >
        {turmas.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
      </select>

      <label className="block text-xs text-text-secondary" htmlFor="np-data">
        Data da aula
      </label>
      <input
        id="np-data"
        type="date"
        name="data"
        required
        value={data}
        onChange={(e) => setData(e.target.value)}
        className="mb-2 mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm"
      />

      <div className="mb-2 flex flex-wrap gap-1.5">
        {domingos.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setData(d)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              d === data ? "border-primary bg-primary text-white" : "border-border text-text-secondary hover:border-primary"
            }`}
          >
            {fmtDomingo(d)}
          </button>
        ))}
      </div>

      {info && (
        <p className="mb-2 rounded-lg bg-primary/5 px-2.5 py-2 text-xs leading-snug text-primary">
          <span className="font-semibold">Plano de Ensino · Lição {info.numero}</span>
          <br />
          {info.titulo}
          {info.tipo === "unificada" && " · aula unificada"}
          {info.tipo === "circulo" && " · Círculo"}
        </p>
      )}
      {semAula && (
        <p className="mb-2 rounded-lg bg-accent/15 px-2.5 py-2 text-xs leading-snug text-text-primary">
          Essa data não tem aula no Plano de Ensino (respiro ou fora do calendário). Você ainda pode preparar.
        </p>
      )}

      <button
        type="submit"
        disabled={!turmaId || !data}
        className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        Abrir a Mesa desta aula
      </button>
    </form>
  );
}
