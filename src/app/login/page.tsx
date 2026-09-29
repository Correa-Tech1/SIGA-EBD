"use client";

import { useFormState, useFormStatus } from "react-dom";
import { entrar, type EstadoLogin } from "./actions";

const estadoInicial: EstadoLogin = {};

function BotaoEntrar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export default function LoginPage() {
  const [estado, acao] = useFormState(entrar, estadoInicial);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <img src="/logo-siga-ebd.svg" alt="SIGA EBD" className="h-24 w-auto" />
          <div className="mt-2 text-xs text-white/70">
            Sistema Integrado de Gestão e Auxílio da EBD
          </div>
        </div>

        <form action={acao} className="rounded-2xl bg-surface p-8 shadow-xl">
          <div className="font-display text-lg font-semibold text-primary">Entrar</div>
          <div className="mb-6 mt-1 text-sm text-text-secondary">
            Acesso da coordenação e dos professores
          </div>

          <label className="mb-1 block text-xs tracking-wide text-text-secondary">USUÁRIO</label>
          <input
            name="usuario"
            type="text"
            required
            autoComplete="username"
            className="mb-4 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
          />

          <label className="mb-1 block text-xs tracking-wide text-text-secondary">SENHA</label>
          <input
            name="senha"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm"
          />

          {estado.erro && (
            <p className="mt-3 text-sm text-danger" role="alert">
              {estado.erro}
            </p>
          )}

          <BotaoEntrar />

          <p className="mt-4 text-center text-xs text-text-secondary">
            Esqueceu a senha ou precisa de uma conta?
            <br />
            Fale com a coordenação — não há autoatendimento.
          </p>
        </form>

        <p className="mt-5 text-center text-xs text-white/60">
          Materiais e avisos ficam abertos a todos, sem login, na{" "}
          <a href="/aba-aluno" className="underline">
            Aba do Aluno
          </a>
          .
        </p>
      </div>

      <div className="mt-10 flex items-center justify-center gap-3">
        <span className="text-xs text-white/55">O Sistema foi desenvolvido pela</span>
        <img
          src="/logo-correa-tech.svg"
          alt="Correa Tech"
          className="h-16 w-auto opacity-85 brightness-0 invert"
        />
      </div>
    </div>
  );
}
