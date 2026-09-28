"use client";

// Cliente de chat simples (sem streaming, de propósito — prioridade foi o
// back-end de verdade: sessão exigida, modelo/max_tokens fixos no servidor,
// posse do rascunho garantida por RLS). Cada envio é um fetch pro próprio
// endpoint /api/auxilio; a conversa inteira (pergunta + resposta) já fica
// salva em `rascunhos.conteudo` do lado do servidor a cada troca, então
// recarregar a página nunca perde o histórico.
import { useState, type FormEvent, type KeyboardEvent } from "react";

interface Mensagem {
  role: "user" | "assistant";
  texto: string;
}

export function ChatAuxilio({
  rascunhoId,
  historicoInicial,
}: {
  rascunhoId: string;
  historicoInicial: Mensagem[];
}) {
  const [mensagens, setMensagens] = useState<Mensagem[]>(historicoInicial);
  const [rascunhoTexto, setRascunhoTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(evento?: FormEvent) {
    evento?.preventDefault();
    const mensagem = rascunhoTexto.trim();
    if (!mensagem || enviando) return;

    setErro(null);
    setEnviando(true);
    setMensagens((atual) => [...atual, { role: "user", texto: mensagem }]);
    setRascunhoTexto("");

    try {
      const resposta = await fetch("/api/auxilio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rascunhoId, mensagem }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro ?? "Falha ao consultar a IA.");
        setMensagens((atual) => atual.slice(0, -1));
        return;
      }

      setMensagens((atual) => [...atual, { role: "assistant", texto: dados.resposta as string }]);
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
            {m.texto}
          </div>
        ))}
        {enviando && <div className="text-xs text-text-secondary">Pensando…</div>}
      </div>

      {erro && (
        <p className="border-t border-border-light px-5 py-2 text-sm text-danger" role="alert">
          {erro}
        </p>
      )}

      <form onSubmit={enviar} className="flex gap-2 border-t border-border-light p-4">
        <textarea
          value={rascunhoTexto}
          onChange={(e) => setRascunhoTexto(e.target.value)}
          onKeyDown={aoTeclar}
          rows={2}
          placeholder="Escreva sua mensagem… (Enter envia, Shift+Enter quebra linha)"
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
