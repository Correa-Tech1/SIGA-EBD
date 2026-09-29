"use client";

// Cliente de chat simples (sem streaming, de propósito — prioridade foi o
// back-end de verdade: sessão exigida, modelo/max_tokens fixos no servidor,
// posse do rascunho garantida por RLS). Cada envio é um fetch pro próprio
// endpoint /api/auxilio; a conversa inteira (pergunta + resposta) já fica
// salva em `rascunhos.conteudo` do lado do servidor a cada troca, então
// recarregar a página nunca perde o histórico.
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArquivosGerados } from "./ArquivosGerados";

interface Anexo {
  nome: string;
  caminho: string;
}

interface Mensagem {
  role: "user" | "assistant";
  texto: string;
  anexos?: Anexo[];
  arquivos?: Anexo[];
}

const TIPOS = ["pdf", "docx", "pptx", "png", "jpg", "jpeg"];
const MAX_MB = 20;

export function ChatAuxilio({
  rascunhoId,
  pessoaId,
  turmas,
  historicoInicial,
}: {
  turmas: { id: string; nome: string }[];
  rascunhoId: string;
  pessoaId: string;
  historicoInicial: Mensagem[];
}) {
  const [mensagens, setMensagens] = useState<Mensagem[]>(historicoInicial);
  const [rascunhoTexto, setRascunhoTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [subindo, setSubindo] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);

  // Envia direto ao bucket privado 'auxilio' (pasta do próprio usuário); o
  // servidor lê de lá na hora de falar com a IA.
  async function anexar(lista: FileList | null) {
    if (!lista || lista.length === 0) return;
    setErro(null);
    setSubindo(true);
    const supabase = createClient();
    const novos: Anexo[] = [];
    for (const arquivo of Array.from(lista)) {
      const ext = (arquivo.name.split(".").pop() ?? "").toLowerCase();
      if (!TIPOS.includes(ext)) {
        setErro(`"${arquivo.name}": use PDF, DOCX, PPTX, PNG ou JPG.`);
        continue;
      }
      if (arquivo.size > MAX_MB * 1024 * 1024) {
        setErro(`"${arquivo.name}": maior que ${MAX_MB} MB.`);
        continue;
      }
      const seguro = arquivo.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w.\-]+/g, "_");
      const caminho = `${pessoaId}/${rascunhoId}/${Date.now()}-${seguro}`;
      const { error } = await supabase.storage.from("auxilio").upload(caminho, arquivo);
      if (error) setErro(`Falha ao anexar "${arquivo.name}": ${error.message}`);
      else novos.push({ nome: arquivo.name, caminho });
    }
    setAnexos((atual) => [...atual, ...novos].slice(0, 5));
    setSubindo(false);
    if (inputArquivo.current) inputArquivo.current.value = "";
  }

  async function enviar(evento?: FormEvent) {
    evento?.preventDefault();
    const mensagem = rascunhoTexto.trim();
    if (!mensagem || enviando || subindo) return;
    const anexosEnvio = anexos;

    setErro(null);
    setEnviando(true);
    setMensagens((atual) => [...atual, { role: "user", texto: mensagem, anexos: anexosEnvio }]);
    setRascunhoTexto("");
    setAnexos([]);

    try {
      const resposta = await fetch("/api/auxilio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rascunhoId, mensagem, anexos: anexosEnvio }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro ?? "Falha ao consultar a IA.");
        setMensagens((atual) => atual.slice(0, -1));
        return;
      }

      setMensagens((atual) => [...atual, { role: "assistant", texto: dados.resposta as string, arquivos: (dados.arquivos as Anexo[]) ?? [] }]);
    } catch {
      setErro("Falha de conexão. Tente de novo.");
      setMensagens((atual) => atual.slice(0, -1));
    } finally {
      setEnviando(false);
    }
  }

  function aoTeclar(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void enviar();
    }
  }

  return (
    <div className="flex h-[560px] flex-col rounded-xl border border-border bg-surface">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {mensagens.length === 0 && (
          <p className="text-sm text-text-secondary">
            Conte o que você precisa pra próxima aula — ex.: &quot;me ajuda a pensar a
            abertura&quot; ou &quot;que pergunta eu posso fazer no final?&quot;.
          </p>
        )}
        {mensagens.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-lg p-3 text-sm ${
              m.role === "user" ? "ml-auto bg-primary text-white" : "bg-bg text-text-primary"
            }`}
          >
            {m.anexos && m.anexos.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {m.anexos.map((a) => (
                  <span key={a.caminho} className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    📎 {a.nome}
                  </span>
                ))}
              </div>
            )}
            {m.texto}
            {m.arquivos && m.arquivos.length > 0 && <ArquivosGerados arquivos={m.arquivos} turmas={turmas} />}
          </div>
        ))}
        {enviando && <div className="text-xs text-text-secondary">Pensando…</div>}
      </div>

      {erro && (
        <p className="border-t border-border-light px-5 py-2 text-sm text-danger" role="alert">
          {erro}
        </p>
      )}

      {anexos.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border-light px-4 pt-3">
          {anexos.map((a) => (
            <span key={a.caminho} className="flex items-center gap-1 rounded-full bg-bg px-2.5 py-1 text-xs">
              📎 {a.nome}
              <button
                type="button"
                aria-label={`Remover ${a.nome}`}
                onClick={() => setAnexos((atual) => atual.filter((x) => x.caminho !== a.caminho))}
                className="text-text-secondary hover:text-danger"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={enviar} className="flex gap-2 border-t border-border-light p-4">
        <input
          ref={inputArquivo}
          type="file"
          multiple
          accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => void anexar(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputArquivo.current?.click()}
          disabled={subindo || anexos.length >= 5}
          title="Anexar PDF, DOCX, PPTX ou imagem"
          className="rounded-lg border border-border px-3 text-lg disabled:opacity-50"
        >
          {subindo ? "…" : "📎"}
        </button>
        <textarea
          value={rascunhoTexto}
          onChange={(e) => setRascunhoTexto(e.target.value)}
          onKeyDown={aoTeclar}
          rows={2}
          placeholder="Escreva sua mensagem… anexe PDF, Word, PowerPoint ou imagem com o clipe"
          className="flex-1 resize-none rounded-lg border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
