import { listarEscalas, listarAvisos, listarProfessoresParaEscala } from "@/lib/escalas/queries";
import { FormularioEscala, FormularioAviso, BotaoApagarAviso } from "./ClientForms";
import { getSessaoAtual } from "@/lib/auth/session";
import { semestreAtivo, type Turma } from "@/lib/estrutura/queries";
import { hojeIso } from "@/lib/relatorio/dados";
import { CalendarioEscalas } from "./CalendarioEscalas";

// Escala (quem dá aula quando) + Avisos (mural) de uma turma. Compartilhado
// entre /escalas (coordenação, `podeGerenciar=true`: cria/remove escala e
// apaga qualquer aviso) e /minha-turma (professor, `podeGerenciar=false`:
// só vê a escala e pode publicar aviso na própria turma — o RLS garante o
// resto mesmo que esta prop estivesse errada).
export async function PainelEscalas({
  turma,
  todasAsTurmas,
  podeGerenciar,
  turmasParaAviso,
  basePath,
  dataInicial,
  mes,
}: {
  turma: Turma;
  todasAsTurmas: Turma[];
  podeGerenciar: boolean;
  // turmas onde quem está vendo pode postar aviso (professor: só as próprias)
  turmasParaAviso?: Turma[];
  basePath: string; // "/escalas" ou "/escalas-avisos" (links de Escalar)
  dataInicial?: string;
  mes?: string; // "YYYY-MM"
}) {
  const [escalas, avisos, pessoas, sessao, semestre] = await Promise.all([
    listarEscalas(turma.id),
    listarAvisos(turma.id),
    podeGerenciar ? listarProfessoresParaEscala(turma.id) : Promise.resolve([]),
    getSessaoAtual(),
    semestreAtivo(),
  ]);
  const hoje = hojeIso();

  return (
    <div className="space-y-6">
      {podeGerenciar && (
        <div id="escalar" className="scroll-mt-4 rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 font-display text-base font-semibold text-primary">Escalar professor</div>
          <FormularioEscala key={dataInicial ?? "livre"} turmaId={turma.id} professores={pessoas} dataInicial={dataInicial} />
        </div>
      )}

      <CalendarioEscalas
        turma={turma}
        escalas={escalas}
        hoje={hoje}
        semestreInicio={semestre?.data_inicio ?? null}
        semestreFim={semestre?.data_fim ?? null}
        podeGerenciar={podeGerenciar}
        minhaPessoaId={sessao.pessoaId}
        mesSelecionado={mes ?? dataInicial?.slice(0, 7)}
        hrefMes={(m) => `${basePath}?turma=${turma.id}&mes=${m}`}
        hrefEscalar={(d) => `${basePath}?turma=${turma.id}&data=${d}#escalar`}
      />

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

        {sessao.autenticado && sessao.role !== "pastor" && (
          <FormularioAviso turmas={turmasParaAviso ?? (podeGerenciar ? todasAsTurmas : [turma])} />
        )}
      </div>
    </div>
  );
}
