// Sem guarda de papel — esta é a camada de leitura sem login (ver os 3
// níveis de acesso na Proposta de Arquitetura). O middleware já libera
// /aba-aluno como rota pública.
export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg">{children}</div>;
}
