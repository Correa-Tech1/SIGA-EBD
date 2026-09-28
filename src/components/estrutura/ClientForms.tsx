"use client";

// Formulários de montagem da estrutura do semestre (semestre → turma →
// módulo). Só aparecem pra coordenação (a página que os usa já garante
// isso), mas a garantia de verdade é a policy `*_coordenacao_escreve` no
// RLS — mesmo que este formulário vazasse pra tela errada, o banco recusa.
import { useFormState, useFormStatus } from "react-dom";
import { criarSemestre, criarTurma, criarModulo, type EstadoForm } from "@/lib/estrutura/actions";
import type { Semestre, Turma } from "@/lib/estrutura/queries";

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

export function FormularioSemestre() {
  const [estado, acao] = useFormState(criarSemestre, estadoInicial);
  return (
    <form action={acao} className="rounded-xl border border-border bg-surface p-5">
      <div className="font-display text-sm font-semibold text-primary">Novo semestre</div>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-text-secondary">ANO</label>
          <input
            name="ano"
            type="number"
            required
            defaultValue={new Date().getFullYear()}
            className="w-24 rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">PERÍODO</label>
          <select name="periodo" required className="rounded-lg border border-border px-3 py-2 text-sm">
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-text-secondary">
          <input name="ativo" type="checkbox" defaultChecked />
          marcar como semestre ativo
        </label>
        <Botao texto="Criar semestre" textoCarregando="Criando…" />
      </div>
      <Mensagens estado={estado} />
    </form>
  );
}

export function FormularioTurma({ semestres }: { semestres: Semestre[] }) {
  const [estado, acao] = useFormState(criarTurma, estadoInicial);
  return (
    <form action={acao} className="rounded-xl border border-border bg-surface p-5">
      <div className="font-display text-sm font-semibold text-primary">Nova turma</div>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-text-secondary">SEMESTRE</label>
          <select
            name="semestreId"
            required
            disabled={semestres.length === 0}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            {semestres.map((s) => (
              <option key={s.id} value={s.id}>
                {s.ano}/{s.periodo}
                {s.ativo ? " (ativo)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs text-text-secondary">NOME</label>
          <input
            name="nome"
            required
            placeholder="Homens"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-xs text-text-secondary">TÍTULO DO SEMESTRE</label>
          <input
            name="titulo"
            placeholder="Sucesso em Crise"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <Botao texto="Criar turma" textoCarregando="Criando…" />
      </div>
      {semestres.length === 0 && (
        <p className="mt-2 text-xs text-text-secondary">Crie um semestre primeiro.</p>
      )}
      <Mensagens estado={estado} />
    </form>
  );
}

export function FormularioModulo({ turmas }: { turmas: Turma[] }) {
  const [estado, acao] = useFormState(criarModulo, estadoInicial);
  return (
    <form action={acao} className="rounded-xl border border-border bg-surface p-5">
      <div className="font-display text-sm font-semibold text-primary">Novo módulo</div>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-text-secondary">TURMA</label>
          <select
            name="turmaId"
            required
            disabled={turmas.length === 0}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">MÓDULO</label>
          <select name="numero" required className="rounded-lg border border-border px-3 py-2 text-sm">
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </div>
        <div className="min-w-[200px]">
          <label className="mb-1 block text-xs text-text-secondary">TEMA</label>
          <input name="tema" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div className="min-w-[200px]">
          <label className="mb-1 block text-xs text-text-secondary">LIVRO BASE</label>
          <input name="livroBase" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">INÍCIO</label>
          <input name="dataInicio" type="date" className="rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-text-secondary">FIM</label>
          <input name="dataFim" type="date" className="rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <Botao texto="Criar módulo" textoCarregando="Criando…" />
      </div>
      {turmas.length === 0 && (
        <p className="mt-2 text-xs text-text-secondary">Crie uma turma primeiro.</p>
      )}
      <Mensagens estado={estado} />
    </form>
  );
}
