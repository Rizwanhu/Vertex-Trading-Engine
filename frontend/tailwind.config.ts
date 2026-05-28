import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#060912",
          secondary: "#0c1222",
          card: "#111827",
          elevated: "#1a2236",
          border: "#243049",
          hover: "#2a3548",
        },
        brand: {
          DEFAULT: "#3b82f6",
          dark: "#2563eb",
          light: "#60a5fa",
          glow: "rgba(59,130,246,0.12)",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          cyan: "#22d3ee",
        },
        green: {
          trade: "#10b981",
          glow: "rgba(16,185,129,0.15)",
        },
        red: {
          trade: "#ef4444",
          glow: "rgba(239,68,68,0.15)",
        },
        text: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Outfit", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "mesh":
          "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(59,130,246,0.18), transparent), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(139,92,246,0.12), transparent), radial-gradient(ellipse 50% 30% at 50% 100%, rgba(16,185,129,0.06), transparent)",
        "grid-pattern":
          "linear-gradient(rgba(36,48,73,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(36,48,73,0.4) 1px, transparent 1px)",
        "gradient-card":
          "linear-gradient(145deg, rgba(26,34,54,0.9) 0%, rgba(17,24,39,0.95) 100%)",
        "gradient-brand": "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
        "gradient-green": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        "gradient-red": "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        "shimmer":
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        shimmer: "shimmer 2.5s infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      boxShadow: {
        card: "0 4px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.03)",
        glow: "0 0 40px rgba(59,130,246,0.25)",
        green: "0 0 30px rgba(16,185,129,0.25)",
        red: "0 0 30px rgba(239,68,68,0.25)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
