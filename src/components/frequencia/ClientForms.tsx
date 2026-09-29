"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  criarAula,
  lancarPresencas,
  matricularExistente,
  matricularNovaPessoa,
  desmatricular,
  type EstadoForm,
} from "@/lib/frequencia/actions";
import type { Modulo } from "@/lib/estrutura/queries";
import type { RosterPessoa, PresencaExistente, PessoaSimples } from "@/lib/frequencia/queries";

const estadoInicial: EstadoForm = {};

function Botao({ texto, textoCarregando, className }: { texto: string; textoCarregando: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      }
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

export function NovaAulaForm({ modulo }: { modulo: Modulo }) {
  const [estado, acao] = useFormState(criarAula, estadoInicial);
  return (
    <form action={acao} className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-bg p-3">
      <input type="hidden" name="moduloId" value={modulo.id} />
      <div>
        <label className="mb-1 block text-xs text-text-secondary">DATA DA AULA</label>
        <input
          name="data"
          type="date"
          required
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs text-text-secondary">TÍTULO (opcional)</label>
        <input
          name="titulo"
          placeholder="Ex.: Aula 3 — Ansiedade e confiança"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
      <Botao texto="Abrir aula" textoCarregando="Criando…" />
      <Mensagens estado={estado} />
    </form>
  );
}

// Abrir uma data nova (um domingo) sem digitar título: só módulo + data.
export function NovaDataForm({
  modulos,
  turmaId,
  baseUrl,
}: {
  modulos: Modulo[];
  turmaId: string;
  baseUrl: string;
}) {
  const [estado, acao] = useFormState(criarAula, estadoInicial);
  return (
    <form action={acao} className="flex flex-wrap items-end gap-3 rounded-lg bg-bg p-3">
      <input type="hidden" name="turmaId" value={turmaId} />
      <input type="hidden" name="voltarPara" value={baseUrl} />
      <div>
        <label className="mb-1 block text-xs text-text-secondary">DATA (DOMINGO)</label>
        <input
          name="data"
          type="date"
          required
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">MÓDULO</label>
        <select
          name="moduloId"
          required
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          {modulos.map((m) => (
            <option key={m.id} value={m.id}>
              Módulo {m.numero}
              {m.tema ? ` · ${m.tema}` : ""}
            </option>
          ))}
        </select>
      </div>
      <Botao texto="Abrir chamada" textoCarregando="Criando…" />
      <Mensagens estado={estado} />
    </form>
  );
}

export function FormularioPresenca({
  aulaId,
  roster,
  presencas,
}: {
  aulaId: string;
  roster: RosterPessoa[];
  presencas: PresencaExistente[];
}) {
  const [estado, acao] = useFormState(lancarPresencas, estadoInicial);
  const statusPorPessoa = new Map(presencas.map((p) => [p.pessoa_id, p.status]));

  if (roster.length === 0) {
    return (
      <p className="rounded-lg bg-bg p-4 text-sm text-text-secondary">
        Nenhum irmão registrado nesta turma ainda — adicione alguém na seção “Irmãos que passaram pela EBD” abaixo antes de lançar
        presença.
      </p>
    );
  }

  return (
    <form action={acao}>
      <input type="hidden" name="aulaId" value={aulaId} />
      <input type="hidden" name="pessoaIds" value={roster.map((r) => r.pessoa_id).join(",")} />
      <div className="rounded-xl border border-border bg-surface">
        {roster.map((pessoa, i) => (
          <label
            key={pessoa.pessoa_id}
            className={`flex cursor-pointer items-center justify-between px-5 py-3 ${
              i > 0 ? "border-t border-border-light" : ""
            }`}
          >
            <span className="text-sm">{pessoa.nome}</span>
            <input
              type="checkbox"
              name={`presente_${pessoa.pessoa_id}`}
              defaultChecked={statusPorPessoa.get(pessoa.pessoa_id) === "presente"}
              className="h-5 w-5 accent-primary"
            />
          </label>
        ))}
      </div>
      <div className="mt-4">
        <Botao texto="Salvar presença" textoCarregando="Salvando…" />
      </div>
      <Mensagens estado={estado} />
    </form>
  );
}

export function FormularioMatricularExistente({
  turmaId,
  candidatos,
}: {
  turmaId: string;
  candidatos: PessoaSimples[];
}) {
  const [estado, acao] = useFormState(matricularExistente, estadoInicial);
  return (
    <form action={acao} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="turmaId" value={turmaId} />
      <div className="min-w-[220px]">
        <label className="mb-1 block text-xs text-text-secondary">PESSOA JÁ CADASTRADA</label>
        <select
          name="pessoaId"
          required
          disabled={candidatos.length === 0}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        >
          {candidatos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>
      <Botao texto="Adicionar" textoCarregando="Adicionando…" />
      <Mensagens estado={estado} />
    </form>
  );
}

export function FormularioMatricularNovo({ turmaId }: { turmaId: string }) {
  const [estado, acao] = useFormState(matricularNovaPessoa, estadoInicial);
  return (
    <form action={acao} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="turmaId" value={turmaId} />
      <div className="min-w-[200px]">
        <label className="mb-1 block text-xs text-text-secondary">NOME</label>
        <input name="nome" required className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
      </div>
      <div className="min-w-[160px]">
        <label className="mb-1 block text-xs text-text-secondary">TELEFONE (opcional)</label>
        <input name="telefone" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
      </div>
      <Botao texto="Cadastrar e adicionar" textoCarregando="Salvando…" />
      <Mensagens estado={estado} />
    </form>
  );
}

export function BotaoDesmatricular({ matriculaId }: { matriculaId: string }) {
  const [, acao] = useFormState(desmatricular, estadoInicial);
  return (
    <form action={acao}>
      <input type="hidden" name="matriculaId" value={matriculaId} />
      <button
        type="submit"
        className="text-xs text-danger hover:underline"
        onClick={(e) => {
          if (!confirm("Remover esta pessoa da turma?")) e.preventDefault();
        }}
      >
        remover
      </button>
    </form>
  );
}
