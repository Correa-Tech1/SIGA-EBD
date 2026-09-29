"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { registrarMaterial } from "@/lib/biblioteca/actions";

const TIPOS = new Set(["pdf", "docx", "doc", "pptx", "ppt", "xlsx", "epub", "mp3", "mp4", "jpg", "jpeg", "png"]);
const MAX_MB = 50; // limite padrão do Storage do Supabase

function nomeSeguro(nome: string): string {
  const limpo = nome.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.\-]+/g, "_");
  return `${Date.now()}-${limpo}`;
}

// Envia direto do navegador ao Storage (as policies decidem quem pode) e só
// então registra a linha em `materiais`. Serve às três prateleiras.
export function UploadBiblioteca({
  categoria,
  pessoaId,
  turmas,
  turmaPadrao,
}: {
  categoria: "livro" | "institucional" | "aula";
  pessoaId: string | null;
  turmas?: { id: string; nome: string }[];
  turmaPadrao?: string;
}) {
  const [status, setStatus] = useState<{ tipo: "erro" | "ok" | "andamento"; texto: string } | null>(null);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = new FormData(form);
    const arquivos = dados.getAll("arquivos").filter((a): a is File => a instanceof File && a.size > 0);
    const prefixo = String(dados.get("titulo") ?? "").trim();
    const turmaId = String(dados.get("turmaId") ?? "");
    if (arquivos.length === 0) return setStatus({ tipo: "erro", texto: "Escolha ao menos um arquivo." });

    const supabase = createClient();
    const pasta = categoria === "livro" ? "livros/geral" : categoria === "institucional" ? "institucional/geral" : `aulas/${pessoaId}`;
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
      const r = await registrarMaterial({ categoria, titulo, tipo: ext, caminho, turmaId: turmaId || null });
      if (r.erro) return setStatus({ tipo: "erro", texto: r.erro });
      enviados += 1;
    }
    form.reset();
    setStatus({ tipo: "ok", texto: enviados === 1 ? "1 arquivo publicado." : `${enviados} arquivos publicados.` });
  }

  return (
    <form onSubmit={enviar} className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-bg p-3">
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs text-text-secondary">TÍTULO (opcional)</label>
        <input name="titulo" placeholder="em branco usa o nome do arquivo" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" />
      </div>
      {turmas && turmas.length > 0 && (
        <div>
          <label className="mb-1 block text-xs text-text-secondary">TURMA</label>
          <select name="turmaId" defaultValue={turmaPadrao ?? ""} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
            <option value="">Todas</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>
      )}
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
