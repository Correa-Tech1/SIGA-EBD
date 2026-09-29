"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { publicarGeradoNaBiblioteca } from "@/lib/auxilio/actions";

export interface ArquivoGeradoUI {
  nome: string;
  caminho: string;
}

// Cartão de arquivo gerado pelo Auxílio: baixar (link temporário do bucket
// privado) e, se quiser, publicar na Biblioteca como slides de uma turma.
export function ArquivosGerados({
  arquivos,
  turmas,
}: {
  arquivos: ArquivoGeradoUI[];
  turmas: { id: string; nome: string }[];
}) {
  const [turmaId, setTurmaId] = useState(turmas[0]?.id ?? "");
  const [msg, setMsg] = useState<Record<string, { tipo: "ok" | "erro"; texto: string }>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);

  async function baixar(a: ArquivoGeradoUI) {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("auxilio").createSignedUrl(a.caminho, 600, { download: a.nome });
    if (error || !data) return setMsg((m) => ({ ...m, [a.caminho]: { tipo: "erro", texto: error?.message ?? "Falha ao baixar." } }));
    window.location.href = data.signedUrl;
  }

  async function publicar(a: ArquivoGeradoUI) {
    setOcupado(a.caminho);
    const r = await publicarGeradoNaBiblioteca({ caminho: a.caminho, nome: a.nome, turmaId });
    setMsg((m) => ({ ...m, [a.caminho]: r.erro ? { tipo: "erro", texto: r.erro } : { tipo: "ok", texto: r.sucesso ?? "Publicado." } }));
    setOcupado(null);
  }

  return (
    <div className="mt-3 space-y-2">
      {arquivos.map((a) => (
        <div key={a.caminho} className="rounded-lg border border-border bg-surface p-3 text-text-primary">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">📊 {a.nome}</span>
            <button type="button" onClick={() => void baixar(a)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white">
              Baixar PowerPoint
            </button>
          </div>
          {turmas.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
              <span>Publicar na Biblioteca (Aulas → Slides) da turma:</span>
              <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="rounded border border-border bg-surface px-2 py-1">
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
                <option value="unificada">Unificada (Homens + Mulheres)</option>
              </select>
              <button type="button" disabled={ocupado === a.caminho} onClick={() => void publicar(a)} className="rounded-lg border border-border px-3 py-1 text-primary disabled:opacity-60">
                {ocupado === a.caminho ? "Publicando…" : "Publicar"}
              </button>
            </div>
          )}
          {msg[a.caminho] && (
            <p className={`mt-1 text-xs ${msg[a.caminho].tipo === "erro" ? "text-danger" : "text-success"}`}>{msg[a.caminho].texto}</p>
          )}
        </div>
      ))}
    </div>
  );
}
