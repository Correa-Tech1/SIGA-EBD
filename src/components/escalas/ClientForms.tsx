"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  criarEscala,
  removerEscala,
  criarAviso,
  apagarAviso,
  type EstadoForm,
} from "@/lib/escalas/actions";
import type { ProfessorOpcao } from "@/lib/escalas/queries";
import type { Turma } from "@/lib/estrutura/queries";

const estadoInicial: EstadoForm = {};

function Botao({ texto, textoCarregando }: { texto: string; textoCarregando: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? textoCarregando : texto}
    </button>
  );
}

function Mensagens({ estado }: { estado: EstadoForm }) {
  return (
    <>
      {estado.erro && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {estado.erro}
        </p>
      )}
      {estado.sucesso && <p className="mt-2 text-sm text-success">{estado.sucesso}</p>}
    </>
  );
}

export function FormularioEscala({ turmaId, professores }: { turmaId: string; professores: ProfessorOpcao[] }) {
  const [estado, acao] = useFormState(criarEscala, estadoInicial);
  const [tipo, setTipo] = useState<string>(professores.find((p) => p.daTurma)?.tipo ?? professores[0]?.tipo ?? "regular");
  const daTurma = professores.filter((p) => p.daTurma);
  const outros = professores.filter((p) => !p.daTurma);
  if (professores.length === 0) {
    return (
      <p className="rounded-lg bg-bg p-3 text-sm text-text-secondary">
        Nenhum professor cadastrado. Crie a conta na aba Professores para poder escalar.
      </p>
    );
  }
  const opcao = (p: ProfessorOpcao) => (
    <option key={p.id} value={p.id}>
      {p.nome}
      {p.tipo === "convidado" ? " (convidado)" : ""}
    </option>
  );
  return (
    <form action={acao} className="flex flex-wrap items-end gap-3 rounded-lg bg-bg p-3">
      <input type="hidden" name="turmaId" value={turmaId} />
      <div className="min-w-[200px]">
        <label className="mb-1 block text-xs text-text-secondary">PROFESSOR</label>
        <select
          name="pessoaId"
          required
          onChange={(e) => {
            const escolhido = professores.find((p) => p.id === e.target.value);
            if (escolhido) setTipo(escolhido.tipo);
          }}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          {daTurma.length > 0 && <optgroup label="Desta turma">{daTurma.map(opcao)}</optgroup>}
          {outros.length > 0 && <optgroup label="Outros professores">{outros.map(opcao)}</optgroup>}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">DATA</label>
        <input
          name="data"
          type="date"
          required
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">TIPO</label>
        <select
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="regular">Regular</option>
          <option value="convidado">Convidado</option>
          <option value="substituicao">Substituição</option>
        </select>
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input type="checkbox" name="unificada" className="h-4 w-4 accent-primary" />
        Aula unificada (Homens + Mulheres)
      </label>
      <Botao texto="Escalar" textoCarregando="Salvando…" />
      <Mensagens estado={estado} />
    </form>
  );
}

export function BotaoRemoverEscala({ escalaId }: { escalaId: string }) {
  const [, acao] = useFormState(removerEscala, estadoInicial);
  return (
    <form action={acao}>
      <input type="hidden" name="escalaId" value={escalaId} />
      <button type="submit" className="text-xs text-danger hover:underline">
        remover
      </button>
    </form>
  );
}

export function FormularioAviso({ turmas }: { turmas: Turma[] }) {
  const [estado, acao] = useFormState(criarAviso, estadoInicial);
  return (
    <form action={acao} className="rounded-lg bg-bg p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs text-text-secondary">PARA</label>
          <select name="turmaId" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm">
            <option value="">Mural geral</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
        <Botao texto="Publicar" textoCarregando="Publicando…" />
      </div>
      <textarea
        name="conteudo"
        required
        rows={2}
        placeholder="Escreva o aviso…"
        className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
      />
      <Mensagens estado={estado} />
    </form>
  );
}

export function BotaoApagarAviso({ avisoId }: { avisoId: string }) {
  const [, acao] = useFormState(apagarAviso, estadoInicial);
  return (
    <form action={acao}>
      <input type="hidden" name="avisoId" value={avisoId} />
      <button
        type="submit"
        className="text-xs text-danger hover:underline"
        onClick={(e) => {
          if (!confirm("Apagar este aviso?")) e.preventDefault();
        }}
      >
        apagar
      </button>
    </form>
  );
}
