"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  enviarMaterialOficial,
  enviarMaterialDeAula,
  apagarMaterial,
  type EstadoForm,
} from "@/lib/biblioteca/actions";

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

export function UploadMaterialOficialForm({ moduloId }: { moduloId: string }) {
  const [estado, acao] = useFormState(enviarMaterialOficial, estadoInicial);
  return (
    <form action={acao} className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-bg p-3">
      <input type="hidden" name="moduloId" value={moduloId} />
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs text-text-secondary">TÍTULO</label>
        <input
          name="titulo"
          required
          placeholder="Ex.: Estudo — Módulo 1"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">ARQUIVO</label>
        <input
          name="arquivo"
          type="file"
          required
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-white"
        />
      </div>
      <Botao texto="Publicar" textoCarregando="Enviando…" />
      <Mensagens estado={estado} />
    </form>
  );
}

export function UploadMaterialDeAulaForm({ aulaId }: { aulaId: string }) {
  const [estado, acao] = useFormState(enviarMaterialDeAula, estadoInicial);
  return (
    <form action={acao} className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-bg p-3">
      <input type="hidden" name="aulaId" value={aulaId} />
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs text-text-secondary">TÍTULO</label>
        <input
          name="titulo"
          required
          placeholder="Ex.: Slides da aula"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">ARQUIVO</label>
        <input
          name="arquivo"
          type="file"
          required
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-white"
        />
      </div>
      <Botao texto="Enviar" textoCarregando="Enviando…" />
      <Mensagens estado={estado} />
    </form>
  );
}

export function BotaoApagarMaterial({ materialId }: { materialId: string }) {
  const [, acao] = useFormState(apagarMaterial, estadoInicial);
  return (
    <form action={acao}>
      <input type="hidden" name="materialId" value={materialId} />
      <button
        type="submit"
        className="text-xs text-danger hover:underline"
        onClick={(e) => {
          if (!confirm("Apagar este material?")) e.preventDefault();
        }}
      >
        apagar
      </button>
    </form>
  );
}
