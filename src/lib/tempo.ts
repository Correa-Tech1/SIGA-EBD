// Relógio do sistema: SEMPRE horário de Brasília (America/Sao_Paulo), não importa
// onde o servidor rode (Vercel usa UTC). Todo "hoje", "próxima aula" e "domingo
// pendente" parte daqui.
export const FUSO = "America/Sao_Paulo";

// Data de hoje em Brasília, yyyy-mm-dd.
export function hojeIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(new Date());
}

// Data e hora de agora em Brasília (para carimbos e exibição).
export function agoraBrasilia(): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, dateStyle: "short", timeStyle: "short" }).format(new Date());
}
