import type { Config } from "tailwindcss";

const withAlpha = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: withAlpha("--background"),
        surface: {
          DEFAULT: withAlpha("--surface"),
          muted: withAlpha("--surface-muted"),
          hover: withAlpha("--surface-hover"),
        },
        foreground: {
          DEFAULT: withAlpha("--foreground"),
          muted: withAlpha("--foreground-muted"),
          subtle: withAlpha("--foreground-subtle"),
        },
        border: {
          DEFAULT: withAlpha("--border"),
          strong: withAlpha("--border-strong"),
        },
        ring: withAlpha("--ring"),
        primary: {
          DEFAULT: withAlpha("--primary"),
          hover: withAlpha("--primary-hover"),
          foreground: withAlpha("--primary-foreground"),
          soft: withAlpha("--primary-soft"),
          "soft-foreground": withAlpha("--primary-soft-foreground"),
        },
        danger: {
          DEFAULT: withAlpha("--danger"),
          foreground: withAlpha("--danger-foreground"),
          soft: withAlpha("--danger-soft"),
          "soft-foreground": withAlpha("--danger-soft-foreground"),
        },
        success: {
          DEFAULT: withAlpha("--success"),
          soft: withAlpha("--success-soft"),
          "soft-foreground": withAlpha("--success-soft-foreground"),
        },
        warning: {
          DEFAULT: withAlpha("--warning"),
          soft: withAlpha("--warning-soft"),
          "soft-foreground": withAlpha("--warning-soft-foreground"),
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        lg: "var(--shadow-lg)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
