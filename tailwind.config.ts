import type { Config } from "tailwindcss";

/**
 * Nouvelle DA Lemnos. Les valeurs vivent dans app/globals.css (:root) ;
 * ce fichier ne fait que les exposer. `<alpha-value>` laisse Tailwind injecter
 * l'opacité (bg-ink/50 → rgb(var(--color-ink) / 0.5)).
 */
const rgb = (token: string) => `rgb(var(--color-${token}) / <alpha-value>)`;
const status = (name: string) => `rgb(var(--status-${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: rgb("green"),
          dark: rgb("green-dark"),
          light: rgb("green-light"),
          soft: rgb("green-soft"),
        },
        ink: {
          DEFAULT: rgb("ink"),
          deep: rgb("ink-deep"),
        },
        "surface-dark": rgb("surface-dark"),
        paper: {
          DEFAULT: rgb("paper"),
          soft: rgb("paper-soft"),
        },
        mist: rgb("mist"),
        line: {
          DEFAULT: rgb("line"),
          soft: rgb("line-soft"),
          dark: rgb("line-dark"),
        },
        slate: rgb("slate"),
        stone: rgb("stone"),
        ash: rgb("ash"),
        fog: rgb("fog"),
        haze: rgb("haze"),
        "mute-ink": rgb("mute-ink"),
        status: {
          "design-bg": status("design-bg"),
          "design-fg": status("design-fg"),
          "prototype-bg": status("prototype-bg"),
          "prototype-fg": status("prototype-fg"),
          "production-bg": status("production-bg"),
          "production-fg": status("production-fg"),
          "livre-bg": status("livre-bg"),
          "livre-fg": status("livre-fg"),
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        serif: ["var(--font-cinzel)", "Georgia", "serif"],
      },
      borderRadius: {
        sharp: "2px",
        field: "3px",
        xs: "4px",
        sm: "5px",
        md: "7px",
        lg: "8px",
        xl: "10px",
        "2xl": "12px",
        card: "14px",
        pill: "100px",
      },
      fontSize: {
        // Échelle du site
        display: ["66px", { lineHeight: "0.98", letterSpacing: "-0.01em" }],
        h1: ["48px", { lineHeight: "1.0", letterSpacing: "-0.01em" }],
        h2: ["32px", { lineHeight: "1.05", letterSpacing: "0" }],
        subtitle: ["22px", { lineHeight: "1.4", letterSpacing: "0" }],
        label: ["13px", { lineHeight: "1.4", letterSpacing: "0.14em" }],
        // Échelle dashboard
        stat: ["38px", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        meta: ["11px", { lineHeight: "1.4" }],
        "meta-lg": ["12px", { lineHeight: "1.4" }],
      },
      letterSpacing: {
        tightest: "-0.02em",
        tight: "-0.01em",
        link: "0.04em",
        btn: "0.06em",
        caps: "0.08em",
        label: "0.14em",
        brand: "0.16em",
        wide: "0.2em",
        wordmark: "0.22em",
        hero: "0.34em",
        band: "0.42em",
      },
      spacing: {
        sidebar: "264px",
        aside: "340px",
        shell: "1200px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,29,31,0.04)",
        "card-hover": "0 12px 32px rgba(26,29,31,0.10)",
        immersive: "0 24px 60px rgba(26,29,31,0.30)",
      },
      keyframes: {
        reveal: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        reveal: "reveal 300ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
