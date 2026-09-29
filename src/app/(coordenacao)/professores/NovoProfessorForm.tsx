"use client";

import { useEffect, useRef } from "react";
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

export function NovoProfessorForm({ turmas }: { turmas: { id: string; nome: string }[] }) {
  const [estado, acao] = useFormState(criarProfessor, estadoInicial);
  const formRef = useRef<HTMLFormElement>(null);

  // criou: limpa o formulário para já cadastrar o próximo
  useEffect(() => {
    if (estado.sucesso) formRef.current?.reset();
  }, [estado]);

  return (
    <form ref={formRef} action={acao} className="rounded-xl border border-border bg-surface p-6">
      <div className="font-display text-base font-semibold text-primary">
        Nova conta de professor
      </div>
      <div className="mb-4 mt-1 text-xs text-text-secondary">
        Você define nome, usuário e turma. A senha pode ser escolhida por você ou gerada pelo sistema.
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
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs text-text-secondary">SENHA (opcional)</label>
          <input
            name="senha"
            type="text"
            minLength={6}
            autoComplete="off"
            placeholder="em branco = o sistema gera"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="mb-1 text-xs text-text-secondary">TIPO DE PROFESSOR</legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="professorTipo" value="regular" defaultChecked className="h-4 w-4 accent-primary" />
            Regular
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="professorTipo" value="convidado" className="h-4 w-4 accent-primary" />
            Convidado
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-1 text-xs text-text-secondary">TURMA(S) DO PROFESSOR</legend>
        <div className="flex flex-wrap gap-4">
          {turmas.map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="turmaId" value={t.id} className="h-4 w-4 accent-primary" />
              {t.nome}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <BotaoCriar />
      </div>

      {estado.erro && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {estado.erro}
        </p>
      )}

      {estado.sucesso && (
        <p className="mt-3 text-sm text-success" role="status">
          {estado.sucesso} A senha fica visível na lista abaixo.
        </p>
      )}
    </form>
  );
}
