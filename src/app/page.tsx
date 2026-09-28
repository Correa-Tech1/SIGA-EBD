import { redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/auth/session";

// Raiz do site: manda cada um pra onde faz sentido, sem tela própria.
export default async function HomePage() {
  const sessao = await getSessaoAtual();

  if (sessao.role === "coordenacao") redirect("/dashboard");
  if (sessao.role === "professor") redirect("/minha-turma");
  redirect("/login");
}
