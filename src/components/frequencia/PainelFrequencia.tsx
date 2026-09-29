import { listarModulos, type Turma } from "@/lib/estrutura/queries";
import {
  listarAulasDosModulos,
  listarRoster,
  listarPresencas,
  listarPessoasForaDaTurma,
  listarResumoPresencas,
} from "@/lib/frequencia/queries";
import {
  NovaDataForm,
  FormularioPresenca,
  FormularioMatricularExistente,
  FormularioMatricularNovo,
  BotaoDesmatricular,
} from "./ClientForms";
import { listarMateriaisDeAula } from "@/lib/biblioteca/queries";
import { ListaMateriais } from "@/components/biblioteca/ListaMateriais";
import { UploadMaterialDeAulaForm } from "@/components/biblioteca/ClientForms";
import { getSessaoAtual } from "@/lib/auth/session";

function rotuloDomingo(dataIso: string): string {
  const data = new Date(dataIso + "T00:00:00");
  const diaSemana = data.toLocaleDateString("pt-BR", { weekday: "long" });
  const nome = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1).replace("-feira", "");
  return `${nome} · ${data.toLocaleDateString("pt-BR")}`;
}

// Painel completo de uma turma: domingos (com quem esteve presente) → chamada. Compartilhado
// entre a página da coordenação (/frequencia, vê qualquer turma) e a do
// professor (/minha-turma, só a(s) própria(s)) — a diferença de acesso já
// foi resolvida antes de chegar aqui (a página escolhe quais `turmas`
// passar), e o RLS garante o resto mesmo se este componente errasse algo.
export async function PainelFrequencia({
  turmas,
  turmaSelecionadaId,
  aulaSelecionadaId,
  podeGerenciarMatricula,
  baseUrl,
}: {
  turmas: Turma[];
  turmaSelecionadaId: string | undefined;
  aulaSelecionadaId: string | undefined;
  podeGerenciarMatricula: boolean;
  baseUrl: string;
}) {
  if (turmas.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">
        Nenhuma turma disponível ainda.
      </p>
    );
  }

  const turmaAtual = turmas.find((t) => t.id === turmaSelecionadaId) ?? turmas[0];
  const modulos = await listarModulos(turmaAtual.id);
  const moduloIds = modulos.map((m) => m.id);
  const aulas = await listarAulasDosModulos(moduloIds);

  const aulaAtual = aulaSelecionadaId ? aulas.find((a) => a.id === aulaSelecionadaId) : undefined;

  const [roster, candidatos, presencas, materiaisDaAula, sessao, resumoPorAula] = await Promise.all([
    listarRoster(turmaAtual.id),
    podeGerenciarMatricula ? listarPessoasForaDaTurma(turmaAtual.id) : Promise.resolve([]),
    aulaAtual ? listarPresencas(aulaAtual.id) : Promise.resolve([]),
    aulaAtual ? listarMateriaisDeAula(aulaAtual.id) : Promise.resolve([]),
    getSessaoAtual(),
    listarResumoPresencas(aulas.map((a) => a.id)),
  ]);

  return (
    <div className="space-y-6">
      {turmas.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {turmas.map((t) => (
            <a
              key={t.id}
              href={`${baseUrl}?turma=${t.id}`}
              className={`rounded-full px-4 py-1.5 text-sm ${
                t.id === turmaAtual.id
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-text-secondary"
              }`}
            >
              {t.nome}
            </a>
          ))}
        </div>
      )}

      <div>
        <h2 className="font-display text-xl font-semibold text-primary">
          {turmaAtual.nome}
          {turmaAtual.titulo && (
            <span className="ml-2 text-base font-normal text-text-secondary">
              · {turmaAtual.titulo}
            </span>
          )}
        </h2>
      </div>

      {modulos.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">
          Esta turma ainda não tem módulos cadastrados.
        </p>
      ) : (
        <section aria-labelledby="titulo-domingos" className="space-y-3">
          <h3 id="titulo-domingos" className="font-display text-base font-semibold text-primary">
            Domingos
          </h3>

          {aulas.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">
              Nenhuma data aberta ainda.
            </p>
          ) : (
            <div className="rounded-xl border border-border bg-surface">
              {aulas.map((aula, i) => {
                const resumo = resumoPorAula.get(aula.id);
                const total = resumo?.presentes.length ?? 0;
                return (
                  <details
                    key={aula.id}
                    open={aula.id === aulaAtual?.id}
                    className={i > 0 ? "border-t border-border-light" : ""}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 hover:bg-bg [&::-webkit-details-marker]:hidden">
                      <span className="text-sm font-medium text-text-primary">
                        {rotuloDomingo(aula.data)}
                      </span>
                      <span
                        className={`text-sm ${
                          resumo?.temChamada ? "font-semibold text-primary" : "text-text-secondary"
                        }`}
                      >
                        {resumo?.temChamada
                          ? `${total} ${total === 1 ? "presente" : "presentes"}`
                          : "sem chamada"}
                      </span>
                    </summary>

                    <div className="px-5 pb-4">
                      {resumo && resumo.presentes.length > 0 ? (
                        <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          {resumo.presentes.map((p) => (
                            <li key={p.id}>{p.nome}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-text-secondary">
                          {resumo?.temChamada ? "Ninguém marcado como presente." : "A chamada desta data ainda não foi lançada."}
                        </p>
                      )}
                      <a
                        href={`${baseUrl}?turma=${turmaAtual.id}&aula=${aula.id}#chamada`}
                        className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                      >
                        {resumo?.temChamada ? "Editar chamada desta data" : "Lançar chamada desta data"}
                      </a>
                    </div>
                  </details>
                );
              })}
            </div>
          )}

          <details className="rounded-xl border border-border bg-surface p-4">
            <summary className="cursor-pointer text-sm font-medium text-primary">
              Abrir nova data
            </summary>
            <div className="mt-3">
              <NovaDataForm modulos={modulos} />
            </div>
          </details>
        </section>
      )}

      {aulaAtual && (
        <div id="chamada" className="scroll-mt-6 rounded-xl border border-border bg-surface p-5">
          <div className="font-display text-base font-semibold text-primary">
            Chamada — {new Date(aulaAtual.data + "T00:00:00").toLocaleDateString("pt-BR")}
            {aulaAtual.titulo ? ` · ${aulaAtual.titulo}` : ""}
          </div>
          <p className="mb-4 mt-1 text-xs text-text-secondary">
            Marque quem esteve presente. Quem já tinha presença lançada aparece pré-marcado.
          </p>
          <FormularioPresenca aulaId={aulaAtual.id} roster={roster} presencas={presencas} />

          <div className="mt-6 border-t border-border-light pt-5">
            <div className="font-display text-sm font-semibold text-primary">
              Materiais desta aula
            </div>
            <p className="mb-2 mt-1 text-xs text-text-secondary">
              Slides, estudo em PDF ou qualquer arquivo desta aula — fica público na Biblioteca e
              na Aba do Aluno.
            </p>
            <ListaMateriais
              materiais={materiaisDaAula}
              podeApagar={(m) =>
                sessao.role === "coordenacao" || (!!sessao.pessoaId && m.enviado_por === sessao.pessoaId)
              }
            />
            <UploadMaterialDeAulaForm aulaId={aulaAtual.id} />
          </div>
        </div>
      )}

      {podeGerenciarMatricula && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="font-display text-base font-semibold text-primary">
            Matrícula da turma
          </div>
          <p className="mb-4 mt-1 text-xs text-text-secondary">
            Só a coordenação adiciona ou remove pessoas da turma.
          </p>

          {roster.length > 0 && (
            <div className="mb-4 rounded-lg border border-border-light">
              {roster.map((pessoa, i) => (
                <div
                  key={pessoa.matricula_id}
                  className={`flex items-center justify-between px-4 py-2 ${
                    i > 0 ? "border-t border-border-light" : ""
                  }`}
                >
                  <span className="text-sm">{pessoa.nome}</span>
                  <BotaoDesmatricular matriculaId={pessoa.matricula_id} />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <FormularioMatricularExistente turmaId={turmaAtual.id} candidatos={candidatos} />
            <FormularioMatricularNovo turmaId={turmaAtual.id} />
          </div>
        </div>
      )}
    </div>
  );
}
