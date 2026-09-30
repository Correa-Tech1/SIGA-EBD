import { redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarTurmas } from "@/lib/estrutura/queries";
import { corDaTurma } from "@/lib/relatorio/cores";
import { NovoProfessorForm } from "./NovoProfessorForm";
import { ResetarSenhaBotao } from "./ResetarSenhaBotao";
import { TurmasProfessorForm } from "./TurmasProfessorForm";
import { SenhaVisivel } from "./SenhaVisivel";
import { NovoPastorForm } from "./NovoPastorForm";
import { decifrarSenha } from "@/lib/auth/senha-visivel";
import { TipoProfessorForm } from "./TipoProfessorForm";

// Server Component: lê com o cliente de SESSÃO (não o admin) — a policy
// `pessoas_coordenacao_all` do RLS já garante que só quem é coordenação
// enxerga a lista inteira. A criação/reset de senha (que exige a
// service_role) fica isolada nos Server Actions em actions.ts.
// O "usuário" (login) só existe no Auth, então é lido com o admin client —
// seguro aqui porque o layout da coordenação já barrou quem não é coordenação.
export default async function ProfessoresPage() {
  // pastor só acompanha (aba Coordenação); contas são da coordenação
  if ((await getSessaoAtual()).role !== "coordenacao") redirect("/dashboard");
  const supabase = createClient();
  const [{ data: professores }, turmas, { data: vinculos }] = await Promise.all([
    supabase
      .from("pessoas")
      .select("id, nome, auth_user_id, criado_em, professor_tipo, senha_cifrada")
      .eq("role", "professor")
      .order("nome"),
    listarTurmas(),
    supabase.from("professor_turmas").select("pessoa_id, turma_id"),
  ]);
  // coordenação também pode dar aula (sem segunda conta): basta marcar tipo e turma
  const { data: coordenadores } = await supabase
    .from("pessoas")
    .select("id, nome, professor_tipo")
    .eq("role", "coordenacao")
    .order("nome");

  const { data: pastores } = await supabase
    .from("pessoas")
    .select("id, nome, auth_user_id, senha_cifrada, criado_em")
    .eq("role", "pastor")
    .order("nome");

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

      {(coordenadores ?? []).length > 0 && (
        <div className="mb-6 space-y-3">
          <div>
            <h2 className="font-display text-base font-semibold text-primary">Coordenação que também dá aula</h2>
            <p className="mt-1 text-xs text-text-secondary">
              Sem criar outra conta: marque o tipo e a turma, e o nome passa a aparecer na escala e nos números de professores.
            </p>
          </div>
          {(coordenadores ?? []).map((c) => {
            const marcadas = [...(turmasPorPessoa.get(c.id) ?? [])];
            const tipo = c.professor_tipo === "convidado" ? "convidado" : c.professor_tipo === "regular" ? "regular" : "nenhum";
            return (
              <div key={c.id} className="rounded-xl border border-border bg-surface px-6 py-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  {c.nome}
                  <span className="rounded-full bg-border-light px-2 py-0.5 text-xs text-text-secondary">Coordenação</span>
                  {tipo !== "nenhum" && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      Dá aula · {tipo === "regular" ? "Regular" : "Convidado"}
                    </span>
                  )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <TipoProfessorForm pessoaId={c.id} tipo={tipo} permitirNenhum />
                  <TurmasProfessorForm pessoaId={c.id} turmas={turmasSimples} marcadas={marcadas} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-6 space-y-3">
        <NovoPastorForm />
        {(pastores ?? []).map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-6 py-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                {p.nome}
                <span className="rounded-full bg-border-light px-2 py-0.5 text-xs text-text-secondary">Pastor · leitura</span>
              </div>
              <div className="text-xs text-text-secondary">
                <SenhaVisivel senha={decifrarSenha(p.senha_cifrada)} /> · criada em {new Date(p.criado_em).toLocaleDateString("pt-BR")}
              </div>
            </div>
            {p.auth_user_id && <ResetarSenhaBotao authUserId={p.auth_user_id} />}
          </div>
        ))}
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
                    usuário: <code>{usuarios.get(p.id) || "—"}</code> · <SenhaVisivel senha={decifrarSenha(p.senha_cifrada)} /> ·
                    criada em {new Date(p.criado_em).toLocaleDateString("pt-BR")}
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
