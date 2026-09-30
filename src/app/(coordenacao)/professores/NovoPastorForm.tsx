"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { criarPastor, type EstadoCriarProfessor } from "./actions";

const estadoInicial: EstadoCriarProfessor = {};

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">
      {pending ? "Criando…" : "Criar conta do Pastor"}
    </button>
  );
}

export function NovoPastorForm() {
  const [estado, acao] = useFormState(criarPastor, estadoInicial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.sucesso) ref.current?.reset();
  }, [estado]);

  return (
    <form ref={ref} action={acao} className="rounded-xl border border-border bg-surface p-6">
      <div className="font-display text-base font-semibold text-primary">Conta do Pastor (somente leitura)</div>
      <div className="mb-4 mt-1 text-xs text-text-secondary">
        Vê relatórios, frequência, escalas, Biblioteca e o funcionamento da plataforma. Não altera nem carrega nada.
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs text-text-secondary">NOME</label>
          <input name="nome" required placeholder="Pr. Eberson" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs text-text-secondary">USUÁRIO</label>
          <input name="usuario" required placeholder="pastor.eberson" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs text-text-secondary">SENHA (opcional)</label>
          <input name="senha" minLength={6} autoComplete="off" placeholder="em branco = o sistema gera" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="mt-4">
        <Botao />
      </div>
      {estado.erro && <p className="mt-3 text-sm text-danger" role="alert">{estado.erro}</p>}
      {estado.sucesso && <p className="mt-3 text-sm text-success" role="status">{estado.sucesso}</p>}
    </form>
  );
}
