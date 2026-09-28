import { listarModulos, type Turma } from "@/lib/estrutura/queries";
import {
  listarAulasDosModulos,
  listarRoster,
  listarPresencas,
  listarPessoasForaDaTurma,
} from "@/lib/frequencia/queries";
import {
  NovaAulaForm,
  FormularioPresenca,
  FormularioMatricularExistente,
  FormularioMatricularNovo,
  BotaoDesmatricular,
} from "./ClientForms";
import { listarMateriaisDeAula } from "@/lib/biblioteca/queries";
import { ListaMateriais } from "@/components/biblioteca/ListaMateriais";
import { UploadMaterialDeAulaForm } from "@/components/biblioteca/ClientForms";
import { getSessaoAtual } from "@/lib/auth/session";

// Painel completo de uma turma: módulos → aulas → chamada. Compartilhado
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

  const [roster, candidatos, presencas, materiaisDaAula, sessao] = await Promise.all([
    listarRoster(turmaAtual.id),
    podeGerenciarMatricula ? listarPessoasForaDaTurma(turmaAtual.id) : Promise.resolve([]),
    aulaAtual ? listarPresencas(aulaAtual.id) : Promise.resolve([]),
    aulaAtual ? listarMateriaisDeAula(aulaAtual.id) : Promise.resolve([]),
    getSessaoAtual(),
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

      {modulos.length === 0 && (
        <p className="rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">
          Esta turma ainda não tem módulos cadastrados.
        </p>
      )}

      {modulos.map((modulo) => {
        const aulasDoModulo = aulas.filter((a) => a.modulo_id === modulo.id);
        return (
          <div key={modulo.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="font-display text-base font-semibold">
              Módulo {modulo.numero}
              {modulo.tema && <span className="font-normal text-text-secondary"> · {modulo.tema}</span>}
            </div>

            {aulasDoModulo.length === 0 ? (
              <p className="mt-2 text-sm text-text-secondary">Nenhuma aula lançada ainda.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {aulasDoModulo.map((aula) => (
                  <a
                    key={aula.id}
                    href={`${baseUrl}?turma=${turmaAtual.id}&aula=${aula.id}`}
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      aula.id === aulaAtual?.id
                        ? "bg-accent text-white"
                        : "border border-border-light bg-bg text-text-primary"
                    }`}
                  >
                    {new Date(aula.data + "T00:00:00").toLocaleDateString("pt-BR")}
                    {aula.titulo ? ` · ${aula.titulo}` : ""}
                  </a>
                ))}
              </div>
            )}

            <NovaAulaForm modulo={modulo} />
          </div>
        );
      })}

      {aulaAtual && (
        <div className="rounded-xl border border-border bg-surface p-5">
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
