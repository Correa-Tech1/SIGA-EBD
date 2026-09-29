import { listarRascunhos, buscarRascunho, listarAulasParaEscolher } from "@/lib/auxilio/queries";
import { getSessaoAtual } from "@/lib/auth/session";
import { NovoRascunhoForm, BotaoApagarRascunho } from "@/components/auxilio/ClientForms";
import { ChatAuxilio } from "@/components/auxilio/ChatAuxilio";

// Fase 6, construída por último de propósito (ver "Passo a passo" na
// Proposta de Arquitetura). O chat de verdade roda contra
// src/app/api/auxilio/route.ts, que segue à risca a lição do Laudo Técnico
// Correa Tech: sessão exigida antes de qualquer chamada de IA, modelo e
// max_tokens fixos no servidor. Rascunho é 100% privado (RLS
// `rascunhos_dono_all`) — nem a coordenação lê o conteúdo de outro
// professor, só o metadado de que ele existe se ela também usar esta tela.
export default async function AuxilioProfessorPage({
  searchParams,
}: {
  searchParams: { rascunho?: string };
}) {
  const sessao = await getSessaoAtual();
  const [rascunhos, aulas] = await Promise.all([
    listarRascunhos(),
    listarAulasParaEscolher(sessao.role === "coordenacao"),
  ]);

  const rascunhoAtualId = searchParams.rascunho ?? rascunhos[0]?.id;
  const rascunhoAtual = rascunhoAtualId ? await buscarRascunho(rascunhoAtualId) : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-4">
        <NovoRascunhoForm aulas={aulas} />

        <div className="rounded-xl border border-border bg-surface">
          {rascunhos.length === 0 ? (
            <p className="p-4 text-sm text-text-secondary">Nenhum rascunho ainda.</p>
          ) : (
            rascunhos.map((r, i) => (
              <div
                key={r.id}
                className={`flex items-center justify-between gap-2 px-4 py-3 ${
                  i > 0 ? "border-t border-border-light" : ""
                }`}
              >
                <a
                  href={`/auxilio?rascunho=${r.id}`}
                  className={`truncate text-sm ${
                    r.id === rascunhoAtualId ? "font-semibold text-primary" : "text-text-primary"
                  }`}
                >
                  {r.titulo}
                </a>
                <BotaoApagarRascunho rascunhoId={r.id} />
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h1 className="mb-4 font-display text-2xl font-semibold text-primary">
          Auxílio ao Professor
        </h1>
        {rascunhoAtual ? (
          <ChatAuxilio
            key={rascunhoAtual.id}
            rascunhoId={rascunhoAtual.id}
            pessoaId={sessao.pessoaId ?? ""}
            historicoInicial={rascunhoAtual.conteudo?.historico ?? []}
          />
        ) : (
          <p className="text-sm text-text-secondary">
            Crie um rascunho ao lado pra começar a conversar.
          </p>
        )}
      </div>
    </div>
  );
}
