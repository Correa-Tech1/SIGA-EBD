import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarTurmas } from "@/lib/estrutura/queries";
import { corDaTurma } from "@/lib/relatorio/cores";
import { NovoProfessorForm } from "./NovoProfessorForm";
import { ResetarSenhaBotao } from "./ResetarSenhaBotao";
import { TurmasProfessorForm } from "./TurmasProfessorForm";
import { TipoProfessorForm } from "./TipoProfessorForm";

// Server Component: lê com o cliente de SESSÃO (não o admin) — a policy
// `pessoas_coordenacao_all` do RLS já garante que só quem é coordenação
// enxerga a lista inteira. A criação/reset de senha (que exige a
// service_role) fica isolada nos Server Actions em actions.ts.
// O "usuário" (login) só existe no Auth, então é lido com o admin client —
// seguro aqui porque o layout da coordenação já barrou quem não é coordenação.
export default async function ProfessoresPage() {
  const supabase = createClient();
  const [{ data: professores }, turmas, { data: vinculos }] = await Promise.all([
    supabase
      .from("pessoas")
      .select("id, nome, auth_user_id, criado_em, professor_tipo")
      .eq("role", "professor")
      .order("nome"),
    listarTurmas(),
    supabase.from("professor_turmas").select("pessoa_id, turma_id"),
  ]);

  const turmasPorPessoa = new Map<string, Set<string>>();
  for (const e of vinculos ?? []) {
    const set = turmasPorPessoa.get(e.pessoa_id) ?? new Set<string>();
    set.add(e.turma_id);
    turmasPorPessoa.set(e.pessoa_id, set);
  }

  const admin = createAdminClient();
  const usuarios = new Map<string, string>();
  await Promise.all(
    (professores ?? [])
      .filter((p) => p.auth_user_id)
      .map(async (p) => {
        const { data } = await admin.auth.admin.getUserById(p.auth_user_id as string);
        const email = data.user?.email ?? "";
        usuarios.set(p.id, email.replace("@login.interno.siga-ebd", ""));
      })
  );

  const turmasSimples = turmas.map((t) => ({ id: t.id, nome: t.nome }));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-primary">Contas de professor</h1>
      <p className="mb-6 mt-1 text-sm text-text-secondary">
        Só a coordenação cria, edita ou reseta essas contas — sem cadastro público.
      </p>

      <div className="mb-6">
        <NovoProfessorForm turmas={turmasSimples} />
      </div>

      <div className="space-y-3">
        {(professores ?? []).length === 0 && (
          <div className="rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">
            Nenhum professor cadastrado ainda.
          </div>
        )}
        {(professores ?? []).map((p) => {
          const marcadas = [...(turmasPorPessoa.get(p.id) ?? [])];
          const nomesTurmas = turmas.filter((t) => marcadas.includes(t.id));
          return (
            <details key={p.id} className="rounded-xl border border-border bg-surface">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-6 py-4 [&::-webkit-details-marker]:hidden">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {p.nome}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.professor_tipo === "convidado" ? "bg-accent/20 text-[#8A5A00]" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {p.professor_tipo === "convidado" ? "Convidado" : "Regular"}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary">
                    usuário: <code>{usuarios.get(p.id) || "—"}</code> · criada em{" "}
                    {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {nomesTurmas.length === 0 ? (
                    <span className="rounded-full border border-dashed border-border px-3 py-0.5 text-xs text-danger">
                      sem turma
                    </span>
                  ) : (
                    nomesTurmas.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full px-3 py-0.5 text-xs font-medium text-white"
                        style={{ background: corDaTurma(t.nome) }}
                      >
                        {t.nome}
                      </span>
                    ))
                  )}
                  <span className="text-xs font-medium text-primary">Editar</span>
                </div>
              </summary>
              <div className="grid gap-6 border-t border-border-light px-6 py-4 sm:grid-cols-2">
                <TipoProfessorForm pessoaId={p.id} tipo={p.professor_tipo === "convidado" ? "convidado" : "regular"} />
                <TurmasProfessorForm pessoaId={p.id} turmas={turmasSimples} marcadas={marcadas} />
                {p.auth_user_id && <ResetarSenhaBotao authUserId={p.auth_user_id} />}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
