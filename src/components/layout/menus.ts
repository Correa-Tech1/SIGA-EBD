// Menus do cabeçalho, num lugar só. Coordenação usa o mesmo menu em TODAS as
// telas (inclusive Auxílio ao Professor, que mora no grupo de rotas do
// professor) — assim ela nunca cai numa tela sem caminho de volta.
export interface ItemMenu {
  href: string;
  rotulo: string;
}

export const MENU_COORDENACAO: ItemMenu[] = [
  { href: "/dashboard", rotulo: "INÍCIO" },
  { href: "/frequencia", rotulo: "FREQUÊNCIA" },
  { href: "/biblioteca", rotulo: "BIBLIOTECA" },
  { href: "/escalas", rotulo: "ESCALAS & AVISOS" },
  { href: "/auxilio", rotulo: "AUXÍLIO AO PROFESSOR" },
  { href: "/professores", rotulo: "PROFESSORES" },
  { href: "/coordenacao", rotulo: "COORDENAÇÃO" },
];

export const MENU_PROFESSOR: ItemMenu[] = [
  { href: "/minha-turma", rotulo: "MINHA TURMA" },
  { href: "/escalas-avisos", rotulo: "ESCALAS & AVISOS" },
  { href: "/biblioteca", rotulo: "BIBLIOTECA" },
  { href: "/auxilio", rotulo: "AUXÍLIO AO PROFESSOR" },
];

// Quem não fez login (aluno): só leitura.
export const MENU_ALUNO: ItemMenu[] = [
  { href: "/aba-aluno", rotulo: "ABA DO ALUNO" },
  { href: "/biblioteca", rotulo: "BIBLIOTECA" },
];
