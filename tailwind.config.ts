import type { Config } from "tailwindcss";

// Paleta viva nos mockups (Design canvas "Plataforma EBD — Mockups").
// Centralizar aqui é o que torna trivial trocar a identidade visual inteira
// depois — um lugar só, não um grep por hex code espalhado no código.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0E7C86", // teal — marca principal / Homens
        secondary: "#F2542D", // coral — Mulheres
        accent: "#F5A623", // âmbar — destaques, progresso
        bg: "#F5F8F9",
        surface: "#FFFFFF",
        border: "#DCE6E8",
        "border-light": "#E8EEF0",
        "text-primary": "#101E24",
        "text-secondary": "#5B6B76",
        success: "#16A34A",
        danger: "#E5484D",
      },
      fontFamily: {
        display: ["Lora", "Georgia", "serif"],
        sans: ["'Work Sans'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
