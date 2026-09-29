import { listarTurmas, listarModulos } from "@/lib/estrutura/queries";
import { listarMateriaisOficiais, listarMateriaisDeAula } from "@/lib/biblioteca/queries";
import { listarAulasDosModulos } from "@/lib/frequencia/queries";
import { listarAvisos } from "@/lib/escalas/queries";
import { listarPessoasPublicas, buscarHistorico } from "@/lib/aba-aluno/queries";
import { ListaMateriais } from "@/components/biblioteca/ListaMateriais";

// Fase 5 completa: materiais, avisos e histórico de presença — tudo sem
// login. Materiais/avisos vêm de SELECT liberado ao `anon` (0002_rls.sql);
// o histórico usa a RPC `historico_de_presenca` porque a tabela `presencas`
// bruta NUNCA é exposta a anon (mesmo uma linha só revelaria quem mais
// estava na aula) — ver o aviso completo no topo de 0002_rls.sql sobre essa
// ser "identificação leve", não uma senha de verdade, e a recomendação de
// confirmar com o Matheus antes de produção. Ver board "AbaAluno.dc.html".
export default async function AbaAlunoPage({
  searchParams,
}: {
  searchParams: { turma?: string; pessoa?: string };
}) {
  const [turmas, pessoas] = await Promise.all([listarTurmas(), listarPessoasPublicas()]);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="font-display text-2xl font-semibold text-primary">Aba do Aluno</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Materiais, avisos e seu histórico de presença — sem precisar de login.
      </p>
      <a href="/biblioteca" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
        Abrir a Biblioteca (livros, materiais e aulas) →
      </a>

      <MeuHistorico
        pessoas={pessoas}
        pessoaSelecionadaId={searchParams.pessoa}
        turmaId={searchParams.turma}
      />

      {turmas.length === 0 && (
        <p className="mt-6 text-sm text-text-secondary">Nenhuma turma disponível ainda.</p>
      )}

      {turmas.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {turmas.map((t) => (
            <a
              key={t.id}
              href={`/aba-aluno?turma=${t.id}${searchParams.pessoa ? `&pessoa=${searchParams.pessoa}` : ""}`}
              className={`rounded-full px-4 py-1.5 text-sm ${
                t.id === (searchParams.turma ?? turmas[0]?.id)
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-text-secondary"
              }`}
            >
              {t.nome}
            </a>
          ))}
        </div>
      )}

      {turmas.length > 0 && (
        <ConteudoTurma turmaId={searchParams.turma ?? turmas[0].id} />
      )}
    </div>
  );
}

async function ConteudoTurma({ turmaId }: { turmaId: string }) {
  const [modulos, avisos] = await Promise.all([listarModulos(turmaId), listarAvisos(turmaId)]);

  const muralAvisos =
    avisos.length === 0 ? null : (
      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <div className="font-display text-base font-semibold text-primary">Avisos</div>
        <div className="mt-3 space-y-3">
          {avisos.map((a) => (
            <div key={a.id} className="rounded-lg border border-border-light p-3">
              <p className="text-sm">{a.conteudo}</p>
              <div className="mt-1 text-xs text-text-secondary">
                {a.turma_id === null ? "Geral" : "Desta turma"} ·{" "}
                {new Date(a.criado_em).toLocaleDateString("pt-BR")}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (modulos.length === 0) {
    return (
      <>
        <p className="mt-6 text-sm text-text-secondary">Esta turma ainda não tem módulos.</p>
        {muralAvisos}
      </>
    );
  }

  const aulasPorModulo = await Promise.all(
    modulos.map((m) => listarAulasDosModulos([m.id]))
  );
  const materiaisOficiaisPorModulo = await Promise.all(
    modulos.map((m) => listarMateriaisOficiais(m.id))
  );

  return (
    <>
      {muralAvisos}
      <div className="mt-6 space-y-6">
      {modulos.map((modulo, i) => (
        <div key={modulo.id} className="rounded-xl border border-border bg-surface p-5">
          <div className="font-display text-base font-semibold">
            Módulo {modulo.numero}
            {modulo.tema && <span className="font-normal text-text-secondary"> · {modulo.tema}</span>}
          </div>
          {modulo.livro_base && (
            <div className="text-xs text-text-secondary">Livro base: {modulo.livro_base}</div>
          )}

          <div className="mt-3">
            <div className="mb-1 text-xs font-medium text-text-secondary">
              MATERIAL OFICIAL
            </div>
            <ListaMateriais materiais={materiaisOficiaisPorModulo[i]} podeApagar={false} />
          </div>

          <MateriaisDasAulas aulas={aulasPorModulo[i]} />
        </div>
      ))}
      </div>
    </>
  );
}

async function MateriaisDasAulas({
  aulas,
}: {
  aulas: { id: string; data: string; titulo: string | null }[];
}) {
  if (aulas.length === 0) return null;

  const materiaisPorAula = await Promise.all(aulas.map((a) => listarMateriaisDeAula(a.id)));
  const algumTemMaterial = materiaisPorAula.some((m) => m.length > 0);
  if (!algumTemMaterial) return null;

  return (
    <div className="mt-4">
      <div className="mb-1 text-xs font-medium text-text-secondary">MATERIAL DAS AULAS</div>
      <div className="space-y-3">
        {aulas.map((aula, i) =>
          materiaisPorAula[i].length === 0 ? null : (
            <div key={aula.id}>
              <div className="mb-1 text-xs text-text-secondary">
                {new Date(aula.data + "T00:00:00").toLocaleDateString("pt-BR")}
                {aula.titulo ? ` · ${aula.titulo}` : ""}
              </div>
              <ListaMateriais materiais={materiaisPorAula[i]} podeApagar={false} />
            </div>
          )
        )}
      </div>
    </div>
  );
}

async function MeuHistorico({
  pessoas,
  pessoaSelecionadaId,
  turmaId,
}: {
  pessoas: { id: string; nome: string }[];
  pessoaSelecionadaId: string | undefined;
  turmaId: string | undefined;
}) {
  const historico = pessoaSelecionadaId ? await buscarHistorico(pessoaSelecionadaId) : [];
  const pessoaSelecionada = pessoas.find((p) => p.id === pessoaSelecionadaId);

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-5">
      <div className="font-display text-base font-semibold text-primary">
        Meu histórico de presença
      </div>
      <p className="mb-3 mt-1 text-xs text-text-secondary">
        Escolha seu nome na lista pra ver suas presenças. Isso não é uma senha — é só pra saber
        de quem é o histórico.
      </p>

      {/* Form GET simples, sem JS: recarrega a página com ?pessoa=<id> */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        {turmaId && <input type="hidden" name="turma" value={turmaId} />}
        <select
          name="pessoa"
          defaultValue={pessoaSelecionadaId ?? ""}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">Selecione seu nome…</option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Ver meu histórico
        </button>
      </form>

      {pessoaSelecionadaId &&
        (historico.length === 0 ? (
          <p className="mt-4 text-sm text-text-secondary">
            Nenhuma presença registrada ainda para {pessoaSelecionada?.nome ?? "essa pessoa"}.
          </p>
        ) : (
          <div className="mt-4 rounded-lg border border-border-light">
            {historico.map((h, i) => (
              <div
                key={h.aula_id}
                className={`flex items-center justify-between px-4 py-2 text-sm ${
                  i > 0 ? "border-t border-border-light" : ""
                }`}
              >
                <span>{new Date(h.data + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                <span className={h.status === "presente" ? "text-success" : "text-danger"}>
                  {h.status === "presente" ? "Presente" : "Ausente"}
                </span>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
