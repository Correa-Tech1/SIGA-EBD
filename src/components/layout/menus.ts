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
];

export const MENU_PROFESSOR: ItemMenu[] = [
  { href: "/minha-turma", rotulo: "MINHA TURMA" },
  { href: "/auxilio", rotulo: "AUXÍLIO AO PROFESSOR" },
];
