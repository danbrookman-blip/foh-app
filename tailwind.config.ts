import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B1220",
          muted: "#475569",
          subtle: "#94A3B8",
        },
        accent: {
          DEFAULT: "#E11D48",
          soft: "#FFE4E6",
        },
        ok: { DEFAULT: "#059669", soft: "#D1FAE5" },
        warn: { DEFAULT: "#B45309", soft: "#FEF3C7" },
        surface: { DEFAULT: "#FFFFFF", alt: "#F8FAFC" },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Inter",
          "sans-serif",
        ],
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
