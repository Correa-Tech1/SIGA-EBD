"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarRascunho, apagarRascunho, type EstadoForm } from "@/lib/auxilio/actions";
import type { AulaOpcao } from "@/lib/auxilio/queries";

const estadoInicial: EstadoForm = {};

function BotaoCriar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Criando…" : "+ Novo rascunho"}
    </button>
  );
}

export function NovoRascunhoForm({ aulas }: { aulas: AulaOpcao[] }) {
  const [estado, acao] = useFormState(criarRascunho, estadoInicial);
  return (
    <form action={acao} className="rounded-xl border border-border bg-surface p-4">
      <label className="mb-1 block text-xs text-text-secondary">SOBRE QUAL AULA? (opcional)</label>
      <select
        name="aulaId"
        defaultValue=""
        className="mb-3 w-full rounded-lg border border-border px-3 py-2 text-sm"
      >
        <option value="">Conversa livre (sem aula específica)</option>
        {aulas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
      <BotaoCriar />
      {estado.erro && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {estado.erro}
        </p>
      )}
    </form>
  );
}

export function BotaoApagarRascunho({ rascunhoId }: { rascunhoId: string }) {
  const [, acao] = useFormState(apagarRascunho, estadoInicial);
  return (
    <form action={acao}>
      <input type="hidden" name="rascunhoId" value={rascunhoId} />
      <button
        type="submit"
        className="text-xs text-danger hover:underline"
        onClick={(e) => {
          if (!confirm("Apagar este rascunho e toda a conversa?")) e.preventDefault();
        }}
      >
        apagar
      </button>
    </form>
  );
}
