"use client";

import { useFormState, useFormStatus } from "react-dom";
import { atualizarTurmasProfessor, type EstadoTurmasProfessor } from "./actions";

const estadoInicial: EstadoTurmasProfessor = {};

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60"
    >
      {pending ? "Salvando…" : "Salvar turmas"}
    </button>
  );
}

export function TurmasProfessorForm({
  pessoaId,
  turmas,
  marcadas,
}: {
  pessoaId: string;
  turmas: { id: string; nome: string }[];
  marcadas: string[];
}) {
  const [estado, acao] = useFormState(atualizarTurmasProfessor, estadoInicial);
  return (
    <form action={acao}>
      <input type="hidden" name="pessoaId" value={pessoaId} />
      <div className="mb-2 text-xs text-text-secondary">TURMA(S)</div>
      <div className="mb-3 flex flex-wrap gap-4">
        {turmas.map((t) => (
          <label key={t.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="turmaId"
              value={t.id}
              defaultChecked={marcadas.includes(t.id)}
              className="h-4 w-4 accent-primary"
            />
            {t.nome}
          </label>
        ))}
      </div>
      <Botao />
      {estado.erro && <p className="mt-2 text-xs text-danger">{estado.erro}</p>}
      {estado.sucesso && <p className="mt-2 text-xs text-success">{estado.sucesso}</p>}
    </form>
  );
}
