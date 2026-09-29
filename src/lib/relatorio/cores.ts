// Uma cor por turma, igual em todo o sistema (Início, Frequência e relatório).
export function corDaTurma(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("homens")) return "#0E7C86"; // verde-azulado (primary)
  if (n.includes("mulheres")) return "#F2542D"; // coral (secondary)
  if (n.includes("panorama")) return "#D9930D"; // âmbar escuro (lê bem em fundo branco)
  return "#5B6B76";
}
