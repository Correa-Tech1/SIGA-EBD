"use client";

import { useFormState, useFormStatus } from "react-dom";
import { atualizarTipoProfessor, type EstadoTurmasProfessor } from "./actions";

const estadoInicial: EstadoTurmasProfessor = {};

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60"
    >
      {pending ? "Salvando…" : "Salvar tipo"}
    </button>
  );
}

export function TipoProfessorForm({ pessoaId, tipo }: { pessoaId: string; tipo: "regular" | "convidado" }) {
  const [estado, acao] = useFormState(atualizarTipoProfessor, estadoInicial);
  return (
    <form action={acao}>
      <input type="hidden" name="pessoaId" value={pessoaId} />
      <div className="mb-2 text-xs text-text-secondary">TIPO</div>
      <div className="mb-3 flex gap-4">
        {(["regular", "convidado"] as const).map((t) => (
          <label key={t} className="flex items-center gap-2 text-sm">
            <input type="radio" name="professorTipo" value={t} defaultChecked={tipo === t} className="h-4 w-4 accent-primary" />
            {t === "regular" ? "Regular" : "Convidado"}
          </label>
        ))}
      </div>
      <Botao />
      {estado.erro && <p className="mt-2 text-xs text-danger">{estado.erro}</p>}
      {estado.sucesso && <p className="mt-2 text-xs text-success">{estado.sucesso}</p>}
    </form>
  );
}
