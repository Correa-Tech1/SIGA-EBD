import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIGA EBD",
  description: "Sistema Integrado de Gestão e Auxílio da Escola Bíblica Dominical",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Work+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
