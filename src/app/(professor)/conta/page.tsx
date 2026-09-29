import { getSessaoAtual } from "@/lib/auth/session";
import { FormSenha } from "./FormSenha";
import { sair } from "./actions";

export default async function ContaPage() {
  const sessao = await getSessaoAtual();
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Minha conta</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {sessao.nome} · {sessao.role === "coordenacao" ? "Coordenação" : "Professor"}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 font-display text-base font-semibold text-primary">Trocar senha</div>
        <FormSenha />
      </div>
      <form action={sair}>
        <button type="submit" className="rounded-lg border border-border px-5 py-2.5 text-sm text-text-secondary">
          Sair
        </button>
      </form>
    </div>
  );
}
