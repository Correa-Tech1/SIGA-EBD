import { getSessaoAtual } from "@/lib/auth/session";
import { Cabecalho } from "@/components/layout/Cabecalho";
import { Rodape } from "@/components/layout/Rodape";
import { MENU_ALUNO, MENU_COORDENACAO, MENU_PROFESSOR } from "@/components/layout/menus";

// A Biblioteca é de todos: sem login (aluno) só lê; professor e coordenação
// entram com o próprio menu e podem publicar conforme o papel.
export default async function BibliotecaLayout({ children }: { children: React.ReactNode }) {
  const sessao = await getSessaoAtual();
  const itens =
    sessao.role === "coordenacao" ? MENU_COORDENACAO : sessao.role === "professor" ? MENU_PROFESSOR : MENU_ALUNO;
  const papel = sessao.role === "coordenacao" ? "Coordenação" : sessao.role === "professor" ? "Professor" : "Visitante";
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Cabecalho itens={itens} nome={sessao.autenticado ? sessao.nome : null} papel={papel} />
      <main className="flex-grow p-10 print:p-0">{children}</main>
      <Rodape />
    </div>
  );
}
