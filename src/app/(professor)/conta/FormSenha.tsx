"use client";

import { useFormState, useFormStatus } from "react-dom";
import { alterarMinhaSenha, type EstadoConta } from "./actions";

const inicial: EstadoConta = {};

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Salvando…" : "Alterar senha"}
    </button>
  );
}

export function FormSenha() {
  const [estado, acao] = useFormState(alterarMinhaSenha, inicial);
  return (
    <form action={acao} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-text-secondary">NOVA SENHA</label>
        <input
          name="nova"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">REPITA A NOVA SENHA</label>
        <input
          name="confirmar"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      <Botao />
      {estado.erro && <p className="text-sm text-danger" role="alert">{estado.erro}</p>}
      {estado.sucesso && <p className="text-sm text-success">{estado.sucesso}</p>}
    </form>
  );
}
