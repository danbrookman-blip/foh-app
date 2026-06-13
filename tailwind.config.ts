import type { Config } from "tailwindcss";

/**
 * Airship Lookout — design tokens.
 *
 * Sourced from airshipteam/airship-crm-dashboard (tailwind.config.js +
 * assets/scss/_variables.scss + _globals.scss). The named colours below mirror
 * Airship's own brand colour names exactly so anyone moving between repos
 * recognises them.
 *
 * Brand families:
 *  - Pickled-bluewood (#364B64): primary navy chrome / structural ink
 *  - Warm-purple family (#5E197C → #BD38DF): primary accent / CTA
 *  - Curious-blue (#189ED1): secondary accent / link colour
 *  - Catskill-white (#F1F5F6): page background
 *
 * Type: Lato (loaded via @import in globals.css), matching the SCSS
 * $primary-font-family.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand-named tokens — direct mirrors of Airship's palette
        "pickled-bluewood": "#364B64",
        "warm-purple": "#5E197C",
        "dark-purple": "#5F1C70",
        "light-purple": "#BD38DF",
        // Ask Airship sub-brand deep purple (used for the Lookout wordmark surround)
        "deep-purple": "#3D0A4D",
        // Bright magenta accent for the Lookout wordmark and beacons — sits between
        // light-purple and pure fuchsia, matching the Ask Airship neon look
        "neon-magenta": "#D824D8",
        "curious-blue": "#189ED1",
        "auth-blue": "#46A9C6",
        "auth-black": "#202C38",
        "light-blue": "#E4EDF2",
        "jeans-blue": "#A7CEE0",
        "light-gray": "#99A7BC",
        "gull-grey": "#98A7BC",
        "metallic-silver": "#B8C9D0",
        "catskill-white": "#F1F5F6",
        platinum: "#E2E2E2",
        "white-smoke": "#F4F5F6",
        "kiwi-green": "#82ED5B",
        "medium-forest-green": "#2B7745",
        "sunrise-orange": "#ED775B",
        nutmeg: "#763A2C",
        "rosso-corsa": "#D60000",

        // Tailwind-style scales for the lead families, derived from the brand colours
        purple: {
          50: "#F7ECFB",
          100: "#EDD6F4",
          200: "#D9A5E5",
          300: "#BD38DF",
          400: "#9D27B8",
          500: "#7A1F92",
          600: "#5E197C", // warm-purple
          700: "#5F1C70", // dark-purple
          800: "#3F1054",
        },
        navy: {
          50: "#F1F5F6", // catskill-white
          100: "#E4EDF2", // light-blue
          200: "#B8C9D0", // metallic-silver
          300: "#99A7BC", // light-gray / gull-grey
          400: "#5D6F89",
          500: "#46557A",
          600: "#364B64", // pickled-bluewood
          700: "#2B3C50",
          800: "#202C38", // auth-black
          900: "#141C24",
        },

        // Semantic aliases used across components
        ink: {
          DEFAULT: "#202C38", // auth-black
          muted: "#5D6F89",
          subtle: "#99A7BC",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F1F5F6", // catskill-white
          tint: "#E4EDF2", // light-blue
        },
        accent: {
          DEFAULT: "#5E197C", // warm-purple
          soft: "#EDD6F4",
          bright: "#BD38DF",
        },
        ok: { DEFAULT: "#2B7745", soft: "#D8F0DF" }, // medium-forest-green
        warn: { DEFAULT: "#B45309", soft: "#FDE6CF" },
        danger: { DEFAULT: "#D60000", soft: "#FCDADA" }, // rosso-corsa
      },
      fontFamily: {
        sans: [
          "Lato",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "Lato",
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
        card: "0 1px 2px rgba(32,44,56,0.04), 0 12px 24px -16px rgba(32,44,56,0.18)",
        pop: "0 2px 4px rgba(94,25,124,0.10), 0 16px 32px -20px rgba(94,25,124,0.30)",
      },
      backgroundImage: {
        "airship-aura":
          "radial-gradient(120% 60% at 0% 0%, rgba(189,56,223,0.10) 0%, rgba(189,56,223,0) 60%), radial-gradient(80% 60% at 100% 0%, rgba(70,169,198,0.15) 0%, rgba(70,169,198,0) 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
