"use client";

import { useState } from "react";

// Mostra/oculta a senha na linha do professor. O clique não abre/fecha o "Editar".
export function SenhaVisivel({ senha }: { senha: string | null }) {
  const [ver, setVer] = useState(false);
  if (!senha) {
    return (
      <span className="text-text-secondary" title="Definida antes do registro de senhas, ou trocada pelo próprio professor">
        senha: não registrada (use “Definir / resetar senha”)
      </span>
    );
  }
  return (
    <span>
      senha: <code className="rounded bg-bg px-1.5 py-0.5">{ver ? senha : "••••••••"}</code>{" "}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setVer((v) => !v);
        }}
        className="font-medium text-primary hover:underline"
      >
        {ver ? "ocultar" : "ver"}
      </button>
    </span>
  );
}
