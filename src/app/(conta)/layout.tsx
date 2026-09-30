import { redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/auth/session";
import { Cabecalho } from "@/components/layout/Cabecalho";
import { Rodape } from "@/components/layout/Rodape";
import { MENU_COORDENACAO, MENU_PASTOR, MENU_PROFESSOR } from "@/components/layout/menus";

// "Minha conta" serve a qualquer perfil com login (professor, coordenação,
// pastor): cada um vê o próprio menu e só troca a própria senha.
export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const sessao = await getSessaoAtual();
  if (!sessao.autenticado) redirect("/login");
  if (!sessao.role) redirect("/");

  const itens = sessao.role === "coordenacao" ? MENU_COORDENACAO : sessao.role === "pastor" ? MENU_PASTOR : MENU_PROFESSOR;
  const papel = sessao.role === "coordenacao" ? "Coordenação" : sessao.role === "pastor" ? "Pastor" : "Professor";

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Cabecalho itens={itens} nome={sessao.nome} papel={papel} />
      <main className="flex-grow p-10">{children}</main>
      <Rodape />
    </div>
  );
}
