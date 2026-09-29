import { redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/auth/session";
import { Cabecalho } from "@/components/layout/Cabecalho";
import { Rodape } from "@/components/layout/Rodape";
import { MENU_COORDENACAO } from "@/components/layout/menus";

// Segunda barreira (a primeira é o middleware): confirma que quem chegou
// aqui é de fato coordenação antes de renderizar qualquer página do grupo.
// Cada página filha ainda pode consultar o banco à vontade — o RLS
// (0002_rls.sql) garante que mesmo um bug aqui não vazaria dado, mas é
// mais rápido e mais claro barrar cedo, na borda da UI.
export default async function CoordenacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await getSessaoAtual();

  if (!sessao.autenticado) redirect("/login");
  if (sessao.role !== "coordenacao") redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Cabecalho itens={MENU_COORDENACAO} nome={sessao.nome} papel="Coordenação" />
      <main className="flex-grow p-10">{children}</main>
      <Rodape />
    </div>
  );
}
