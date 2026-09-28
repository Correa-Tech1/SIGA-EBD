import { createClient } from "@/lib/supabase/server";
import { NovoProfessorForm } from "./NovoProfessorForm";
import { ResetarSenhaBotao } from "./ResetarSenhaBotao";

// Server Component: lê com o cliente de SESSÃO (não o admin) — a policy
// `pessoas_coordenacao_all` do RLS já garante que só quem é coordenação
// enxerga a lista inteira. A criação/reset de senha (que exige a
// service_role) fica isolada nos Server Actions em actions.ts.
export default async function ProfessoresPage() {
  const supabase = createClient();
  const { data: professores } = await supabase
    .from("pessoas")
    .select("id, nome, auth_user_id, criado_em")
    .eq("role", "professor")
    .order("nome");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-primary">
        Contas de professor
      </h1>
      <p className="mb-6 mt-1 text-sm text-text-secondary">
        Só a coordenação cria, edita ou reseta essas contas — sem cadastro público.
      </p>

      <div className="mb-6">
        <NovoProfessorForm />
      </div>

      <div className="rounded-xl border border-border bg-surface">
        {(professores ?? []).length === 0 && (
          <div className="p-6 text-sm text-text-secondary">
            Nenhum professor cadastrado ainda.
          </div>
        )}
        {(professores ?? []).map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-6 py-4 ${
              i > 0 ? "border-t border-border-light" : ""
            }`}
          >
            <div>
              <div className="text-sm font-medium">{p.nome}</div>
              <div className="text-xs text-text-secondary">
                conta criada em {new Date(p.criado_em).toLocaleDateString("pt-BR")}
              </div>
            </div>
            {p.auth_user_id && <ResetarSenhaBotao authUserId={p.auth_user_id} />}
          </div>
        ))}
      </div>
    </div>
  );
}
