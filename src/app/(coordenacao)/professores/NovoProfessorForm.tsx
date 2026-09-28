"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarProfessor, type EstadoCriarProfessor } from "./actions";

const estadoInicial: EstadoCriarProfessor = {};

function BotaoCriar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Criando…" : "Criar conta"}
    </button>
  );
}

export function NovoProfessorForm() {
  const [estado, acao] = useFormState(criarProfessor, estadoInicial);

  return (
    <form action={acao} className="rounded-xl border border-border bg-surface p-6">
      <div className="font-display text-base font-semibold text-primary">
        Nova conta de professor
      </div>
      <div className="mb-4 mt-1 text-xs text-text-secondary">
        Você define nome e usuário; o sistema gera a senha provisória.
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs text-text-secondary">NOME</label>
          <input
            name="nome"
            required
            placeholder="Caio Souza"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs text-text-secondary">USUÁRIO</label>
          <input
            name="usuario"
            required
            placeholder="caio.souza"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <BotaoCriar />
        </div>
      </div>

      {estado.erro && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {estado.erro}
        </p>
      )}

      {estado.sucesso && estado.senhaGerada && (
        <div className="mt-3 rounded-lg bg-accent/10 p-3 text-sm">
          <strong>{estado.sucesso}</strong>
          <div className="mt-1">
            Senha provisória: <code className="rounded bg-white px-2 py-0.5">{estado.senhaGerada}</code>
          </div>
          <div className="mt-1 text-xs text-text-secondary">
            Passe essa senha pro professor por fora do sistema (WhatsApp, presencial) —
            ela não aparece de novo depois que você sair desta tela.
          </div>
        </div>
      )}
    </form>
  );
}
