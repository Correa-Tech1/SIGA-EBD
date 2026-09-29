import { redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/auth/session";
import { Cabecalho } from "@/components/layout/Cabecalho";
import { Rodape } from "@/components/layout/Rodape";
import { MENU_COORDENACAO, MENU_PROFESSOR } from "@/components/layout/menus";

// Mesma lógica do layout de coordenação, mas aceitando os dois papéis com
// conta de verdade — a coordenação também pode espiar a Aba do Professor
// (ex.: pra revisar como o Auxílio ao Professor está respondendo).
//
// Quando quem entra é a coordenação, o cabeçalho é o MESMO menu da
// coordenação (não o do professor): antes, ao abrir "Auxílio ao Professor" o
// menu trocava e não sobrava caminho de volta pro Início.
export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await getSessaoAtual();

  if (!sessao.autenticado) redirect("/login");
  if (sessao.role !== "professor" && sessao.role !== "coordenacao") redirect("/");

  const ehCoordenacao = sessao.role === "coordenacao";

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Cabecalho
        itens={ehCoordenacao ? MENU_COORDENACAO : MENU_PROFESSOR}
        nome={sessao.nome}
        papel={ehCoordenacao ? "Coordenação" : "Professor"}
      />
      <main className="flex-grow p-10">{children}</main>
      <Rodape />
    </div>
  );
}
