"use client";

import { usePathname } from "next/navigation";
import type { ItemMenu } from "./menus";

function iniciais(nome: string | null): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

// Cabeçalho único do sistema logado. É Client Component só por causa do
// usePathname(): ele é o que permite marcar a aba da página atual (a linha
// âmbar embaixo do item), como no mockup.
export function Cabecalho({
  itens,
  nome,
  papel,
}: {
  itens: ItemMenu[];
  nome: string | null;
  papel: string;
}) {
  const pathname = usePathname();

  return (
    <header className="flex h-20 print:hidden shrink-0 items-center justify-between bg-primary px-10">
      <a href={itens[0]?.href ?? "/"} aria-label="SIGA EBD — início">
        <img src="/logo-siga-ebd.svg" alt="SIGA EBD" className="h-14 w-auto" />
      </a>

      <nav aria-label="Principal" className="flex h-full items-center gap-8 text-sm tracking-wide">
        {itens.map((item) => {
          const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`flex h-full items-center border-b-2 ${
                ativo
                  ? "border-accent font-medium text-white"
                  : "border-transparent text-white/70 hover:text-white"
              }`}
            >
              {item.rotulo}
            </a>
          );
        })}
      </nav>

      <a
        href="/conta"
        title="Minha conta: trocar senha e sair"
        className="flex items-center gap-3 text-sm text-white hover:opacity-90"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold"
        >
          {iniciais(nome)}
        </span>
        <span>
          {nome} <span className="text-white/60">· {papel}</span>
        </span>
      </a>
    </header>
  );
}
