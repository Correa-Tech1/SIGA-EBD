"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { registrarMaterial } from "@/lib/biblioteca/actions";

const TIPOS = new Set(["pdf", "docx", "doc", "pptx", "ppt", "xlsx", "epub", "mp3", "mp4", "jpg", "jpeg", "png"]);
const MAX_MB = 50; // limite padrão do Storage do Supabase

export type Prateleira = "livro" | "institucional" | "apoio_professor" | "aula";

export const ROTULO_PRATELEIRA: Record<Prateleira, string> = {
  livro: "Livros",
  institucional: "Materiais institucionais",
  apoio_professor: "Apoio ao Professor",
  aula: "Aulas",
};

function nomeSeguro(nome: string): string {
  const limpo = nome.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\w.\-]+/g, "_");
  return `${Date.now()}-${limpo}`;
}

// Painel único de adição: escolhe a prateleira e envia direto do navegador ao
// Storage (as policies decidem quem pode); depois registra a linha em
// `materiais`. Coordenação escolhe qualquer prateleira; professor só Aulas.
export function UploadBiblioteca({
  prateleiras,
  pessoaId,
  turmas,
  turmaPadrao,
}: {
  prateleiras: Prateleira[];
  pessoaId: string | null;
  turmas: { id: string; nome: string }[];
  turmaPadrao?: string;
}) {
  const [categoria, setCategoria] = useState<Prateleira>(prateleiras[0] ?? "aula");
  const [status, setStatus] = useState<{ tipo: "erro" | "ok" | "andamento"; texto: string } | null>(null);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    const arquivos = dados.getAll("arquivos").filter((a): a is File => a instanceof File && a.size > 0);
    const prefixo = String(dados.get("titulo") ?? "").trim();
    const turmaId = String(dados.get("turmaId") ?? "");
    if (arquivos.length === 0) return setStatus({ tipo: "erro", texto: "Escolha ao menos um arquivo." });
    if (categoria === "aula" && !turmaId) return setStatus({ tipo: "erro", texto: "Escolha a turma da aula (ou Unificada)." });

    const supabase = createClient();
    const pasta =
      categoria === "livro"
        ? "livros/geral"
        : categoria === "institucional"
          ? "institucional/geral"
          : categoria === "apoio_professor"
            ? "apoio-professor/geral"
            : `aulas/${pessoaId}`;
    let enviados = 0;
    for (const arquivo of arquivos) {
      const ext = (arquivo.name.split(".").pop() ?? "").toLowerCase();
      if (!TIPOS.has(ext)) return setStatus({ tipo: "erro", texto: `"${arquivo.name}": tipo .${ext} não aceito.` });
      if (arquivo.size > MAX_MB * 1024 * 1024) return setStatus({ tipo: "erro", texto: `"${arquivo.name}": maior que ${MAX_MB} MB.` });
      setStatus({ tipo: "andamento", texto: `Enviando ${arquivo.name}… (${enviados + 1}/${arquivos.length})` });

      const caminho = `${pasta}/${nomeSeguro(arquivo.name)}`;
      const { error } = await supabase.storage.from("materiais").upload(caminho, arquivo, { contentType: arquivo.type || undefined });
      if (error) return setStatus({ tipo: "erro", texto: `Falha ao enviar "${arquivo.name}": ${error.message}` });

      const semExt = arquivo.name.replace(/\.[^./]+$/, "");
      const titulo = prefixo && arquivos.length === 1 ? prefixo : prefixo ? `${prefixo} — ${semExt}` : semExt;
      const papel = String(dados.get("papel") ?? "");
      const r = await registrarMaterial({
        categoria,
        titulo,
        tipo: ext,
        caminho,
        turmaId: categoria === "aula" ? turmaId : null,
        papel: categoria === "aula" ? papel || null : null,
      });
      if (r.erro) return setStatus({ tipo: "erro", texto: r.erro });
      enviados += 1;
    }
    form.reset();
    setCategoria(prateleiras[0] ?? "aula");
    setStatus({ tipo: "ok", texto: enviados === 1 ? "1 arquivo publicado." : `${enviados} arquivos publicados.` });
  }

  return (
    <form onSubmit={enviar} className="flex flex-wrap items-end gap-3">
      {prateleiras.length > 1 ? (
        <div>
          <label className="mb-1 block text-xs text-text-secondary">PRATELEIRA</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Prateleira)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            {prateleiras.map((p) => (
              <option key={p} value={p}>
                {ROTULO_PRATELEIRA[p]}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="pb-2 text-sm text-text-secondary">Prateleira: <strong>{ROTULO_PRATELEIRA[categoria]}</strong></p>
      )}
      {categoria === "aula" && (
        <>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">TURMA</label>
            <select name="turmaId" defaultValue={turmaPadrao ?? ""} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="">Escolha…</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
              <option value="unificada">Unificada (Homens + Mulheres)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">TIPO</label>
            <select name="papel" defaultValue="slides" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <option value="slides">Slides da aula</option>
              <option value="apoio">Material de apoio</option>
            </select>
          </div>
        </>
      )}
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs text-text-secondary">TÍTULO (opcional)</label>
        <input name="titulo" placeholder="em branco usa o nome do arquivo" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">ARQUIVOS</label>
        <input name="arquivos" type="file" multiple required className="rounded-lg border border-border bg-surface px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-white" />
      </div>
      <button type="submit" disabled={status?.tipo === "andamento"} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        Publicar
      </button>
      {status && (
        <p className={`w-full text-sm ${status.tipo === "erro" ? "text-danger" : status.tipo === "ok" ? "text-success" : "text-text-secondary"}`} role={status.tipo === "erro" ? "alert" : undefined}>
          {status.texto}
        </p>
      )}
    </form>
  );
}
