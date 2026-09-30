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


// Envio direto ao Storage com barra de progresso (XHR) e detecção de travamento:
// se ficar 90 s sem andar nem um byte, aborta com mensagem clara em vez de ficar
// "Enviando…" para sempre.
function enviarComProgresso(
  url: string,
  token: string,
  anonKey: string,
  arquivo: File,
  aoProgredir: (pct: number) => void
): Promise<{ erro?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    let parado: ReturnType<typeof setTimeout>;
    const armar = () => {
      clearTimeout(parado);
      parado = setTimeout(() => {
        xhr.abort();
        resolve({ erro: "O envio travou (90 s sem avançar). Verifique a internet e tente de novo." });
      }, 90_000);
    };
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.upload.onprogress = (ev) => {
      armar();
      if (ev.lengthComputable) aoProgredir(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      clearTimeout(parado);
      if (xhr.status >= 200 && xhr.status < 300) return resolve({});
      let msg = `erro ${xhr.status}`;
      try {
        const j = JSON.parse(xhr.responseText);
        msg = j.message || j.error || msg;
      } catch {}
      resolve({ erro: msg });
    };
    xhr.onerror = () => {
      clearTimeout(parado);
      resolve({ erro: "falha de conexão durante o envio." });
    };
    xhr.onabort = () => clearTimeout(parado);
    armar();
    const corpo = new FormData();
    corpo.append("cacheControl", "3600");
    corpo.append("", arquivo);
    xhr.send(corpo);
  });
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
  const [status, setStatus] = useState<{ tipo: "erro" | "ok" | "andamento"; texto: string; pct?: number } | null>(null);

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
      const rotulo = `${arquivo.name} (${enviados + 1}/${arquivos.length})`;
      setStatus({ tipo: "andamento", texto: `Enviando ${rotulo}…`, pct: 0 });

      const caminho = `${pasta}/${nomeSeguro(arquivo.name)}`;
      const { data: sessaoAuth } = await supabase.auth.getSession();
      if (!sessaoAuth.session) return setStatus({ tipo: "erro", texto: "Sua sessão expirou. Entre de novo e tente outra vez." });
      const urlUpload = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/materiais/${caminho.split("/").map(encodeURIComponent).join("/")}`;
      const envio = await enviarComProgresso(
        urlUpload,
        sessaoAuth.session.access_token,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        arquivo,
        (pct) => setStatus({ tipo: "andamento", texto: `Enviando ${rotulo}…`, pct })
      );
      if (envio.erro) return setStatus({ tipo: "erro", texto: `Falha ao enviar "${arquivo.name}": ${envio.erro}` });
      setStatus({ tipo: "andamento", texto: `Registrando ${rotulo} na prateleira…`, pct: 100 });

      const semExt = arquivo.name.replace(/\.[^./]+$/, "");
      const titulo = prefixo && arquivos.length === 1 ? prefixo : prefixo ? `${prefixo} — ${semExt}` : semExt;
      const papel = String(dados.get("papel") ?? "");
      const r = await Promise.race([registrarMaterial({
        categoria,
        titulo,
        tipo: ext,
        caminho,
        turmaId: categoria === "aula" ? turmaId : null,
        papel: categoria === "aula" ? papel || null : null,
      }),
        new Promise<{ erro: string }>((res) =>
          setTimeout(() => res({ erro: "O registro demorou demais. O arquivo já subiu: recarregue a página e confira a prateleira." }), 45_000)
        ),
      ]);
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
      {status?.tipo === "andamento" && status.pct !== undefined && (
        <div className="w-full">
          <div className="h-2 overflow-hidden rounded-full bg-border-light">
            <div className="h-full bg-primary transition-all" style={{ width: `${status.pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-text-secondary">{status.pct}%</p>
        </div>
      )}
      {status && (
        <p className={`w-full text-sm ${status.tipo === "erro" ? "text-danger" : status.tipo === "ok" ? "text-success" : "text-text-secondary"}`} role={status.tipo === "erro" ? "alert" : undefined}>
          {status.texto}
        </p>
      )}
    </form>
  );
}
