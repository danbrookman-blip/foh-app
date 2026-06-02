import type { Config } from "tailwindcss";

/**
 * Airship Lookout — design tokens.
 *
 * Palette is built around Airship's pink + blue brand pairing (sourced from the
 * public airship.co.uk image assets — "Pink" and "Blue" referenced repeatedly).
 * Pink is the lead, deep navy is the structural ink, warm neutrals avoid the
 * cool-slate feel of the previous iteration. Replace hex codes with exact brand
 * values when the Airship design team supplies them.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand pink — confident magenta, the lead accent
        pink: {
          50: "#FFF0F7",
          100: "#FFD9EB",
          200: "#FFB3D6",
          300: "#FF7FB6",
          400: "#F94894",
          500: "#E5277B",
          600: "#C81568",
          700: "#9F0E52",
        },
        // Deep navy — Airship dashboard chrome + headings
        navy: {
          50: "#F1F2F8",
          100: "#DCDEEC",
          200: "#A9ADCC",
          400: "#3D4683",
          600: "#1B2363",
          800: "#0F1543",
          900: "#080B2E",
        },
        // Ink / neutrals — warm-leaning so the page feels airy not cold
        ink: {
          DEFAULT: "#0F1543",
          muted: "#5B5F7A",
          subtle: "#8E91A8",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F8F6FA",
          tint: "#FFF5FA",
        },
        // Semantic aliases used across components
        accent: {
          DEFAULT: "#E5277B",
          soft: "#FFD9EB",
        },
        ok: { DEFAULT: "#06966D", soft: "#D9F4E9" },
        warn: { DEFAULT: "#B45309", soft: "#FEF1C7" },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      letterSpacing: {
        tightish: "-0.012em",
        wideish: "0.04em",
      },
      borderRadius: {
        xl2: "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,21,67,0.04), 0 12px 24px -16px rgba(15,21,67,0.18)",
        pop: "0 2px 4px rgba(229,39,123,0.10), 0 16px 32px -20px rgba(229,39,123,0.30)",
      },
      backgroundImage: {
        "airship-aura":
          "radial-gradient(120% 60% at 0% 0%, rgba(255,217,235,0.7) 0%, rgba(255,217,235,0) 60%), radial-gradient(80% 60% at 100% 0%, rgba(220,222,236,0.6) 0%, rgba(220,222,236,0) 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
