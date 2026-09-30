"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Busca instantânea na Biblioteca: o campo guarda o texto; cada cartão
// "Filtravel" some se o título não combina. Sem ir ao servidor.
const Ctx = createContext<{ q: string; setQ: (v: string) => void }>({ q: "", setQ: () => {} });

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function BuscaProvider({ children }: { children: ReactNode }) {
  const [q, setQ] = useState("");
  return <Ctx.Provider value={{ q, setQ }}>{children}</Ctx.Provider>;
}

export function CampoBusca() {
  const { q, setQ } = useContext(Ctx);
  return (
    <label className="relative block w-full max-w-md">
      <span className="sr-only">Buscar na Biblioteca</span>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar livro, aula ou material…"
        className="w-full rounded-full border border-white/25 bg-white/15 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/70 backdrop-blur focus:border-white focus:outline-none"
      />
    </label>
  );
}

export function Filtravel({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { q } = useContext(Ctx);
  if (q.trim() && !norm(titulo).includes(norm(q.trim()))) return null;
  return <>{children}</>;
}

// Aviso quando a busca está ativa (lembra que há filtro).
export function AvisoBusca() {
  const { q, setQ } = useContext(Ctx);
  if (!q.trim()) return null;
  return (
    <p className="rounded-lg bg-accent/15 px-4 py-2 text-sm">
      Mostrando só o que combina com <strong>“{q}”</strong>.{" "}
      <button type="button" onClick={() => setQ("")} className="font-medium text-primary underline">
        limpar busca
      </button>
    </p>
  );
}
