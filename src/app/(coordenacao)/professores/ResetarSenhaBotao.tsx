"use client";

import { useFormState, useFormStatus } from "react-dom";
import { resetarSenha, type EstadoResetarSenha } from "./actions";

const estadoInicial: EstadoResetarSenha = {};

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs font-medium text-primary underline disabled:opacity-60"
    >
      {pending ? "Resetando…" : "Resetar senha"}
    </button>
  );
}

export function ResetarSenhaBotao({ authUserId }: { authUserId: string }) {
  const [estado, acao] = useFormState(resetarSenha, estadoInicial);

  return (
    <form action={acao} className="text-right">
      <input type="hidden" name="authUserId" value={authUserId} />
      <Botao />
      {estado.erro && <div className="mt-1 text-xs text-danger">{estado.erro}</div>}
      {estado.senhaGerada && (
        <div className="mt-1 text-xs">
          Nova senha: <code className="rounded bg-white px-1.5 py-0.5">{estado.senhaGerada}</code>
        </div>
      )}
    </form>
  );
}
