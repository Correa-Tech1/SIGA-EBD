import { listarEscalas, listarAvisos, listarPessoas } from "@/lib/escalas/queries";
import { FormularioEscala, BotaoRemoverEscala, FormularioAviso, BotaoApagarAviso } from "./ClientForms";
import { getSessaoAtual } from "@/lib/auth/session";
import type { Turma } from "@/lib/estrutura/queries";

// Escala (quem dá aula quando) + Avisos (mural) de uma turma. Compartilhado
// entre /escalas (coordenação, `podeGerenciar=true`: cria/remove escala e
// apaga qualquer aviso) e /minha-turma (professor, `podeGerenciar=false`:
// só vê a escala e pode publicar aviso na própria turma — o RLS garante o
// resto mesmo que esta prop estivesse errada).
export async function PainelEscalas({
  turma,
  todasAsTurmas,
  podeGerenciar,
}: {
  turma: Turma;
  todasAsTurmas: Turma[];
  podeGerenciar: boolean;
}) {
  const [escalas, avisos, pessoas, sessao] = await Promise.all([
    listarEscalas(turma.id),
    listarAvisos(turma.id),
    podeGerenciar ? listarPessoas() : Promise.resolve([]),
    getSessaoAtual(),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="font-display text-base font-semibold text-primary">Escala de professores</div>
        <p className="mb-3 mt-1 text-xs text-text-secondary">Quem dá aula em cada data.</p>

        {escalas.length === 0 ? (
          <p className="text-sm text-text-secondary">Ninguém escalado ainda.</p>
        ) : (
          <div className="rounded-lg border border-border-light">
            {escalas.map((e, i) => (
              <div
                key={e.id}
                className={`flex items-center justify-between px-4 py-2.5 ${
                  i > 0 ? "border-t border-border-light" : ""
                }`}
              >
                <div className="text-sm">
                  {new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR")} — {e.pessoa_nome}
                  {e.tipo !== "regular" && (
                    <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                      {e.tipo}
                    </span>
                  )}
                </div>
                {podeGerenciar && <BotaoRemoverEscala escalaId={e.id} />}
              </div>
            ))}
          </div>
        )}

        {podeGerenciar && (
          <div className="mt-3">
            <FormularioEscala turmaId={turma.id} pessoas={pessoas} />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="font-display text-base font-semibold text-primary">Avisos</div>
        <p className="mb-3 mt-1 text-xs text-text-secondary">
          Mural desta turma + avisos gerais.
        </p>

        {avisos.length === 0 ? (
          <p className="text-sm text-text-secondary">Nenhum aviso ainda.</p>
        ) : (
          <div className="mb-4 space-y-3">
            {avisos.map((a) => (
              <div key={a.id} className="rounded-lg border border-border-light p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm">{a.conteudo}</p>
                  {podeGerenciar && <BotaoApagarAviso avisoId={a.id} />}
                </div>
                <div className="mt-1 text-xs text-text-secondary">
                  {a.turma_id === null ? "Geral" : "Desta turma"} · {a.autor_nome} ·{" "}
                  {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
        )}

        {sessao.autenticado && (
          <FormularioAviso turmas={podeGerenciar ? todasAsTurmas : [turma]} />
        )}
      </div>
    </div>
  );
}
