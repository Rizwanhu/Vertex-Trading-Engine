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
          primary:   "#0a0e1a",
          secondary: "#0f1629",
          card:      "#131c35",
          elevated:  "#1a2442",
          border:    "#1e2d4a",
        },
        brand: {
          DEFAULT: "#3b82f6",
          dark:    "#2563eb",
          light:   "#60a5fa",
          glow:    "rgba(59,130,246,0.15)",
        },
        green: {
          trade: "#10b981",
          glow:  "rgba(16,185,129,0.15)",
        },
        red: {
          trade: "#ef4444",
          glow:  "rgba(239,68,68,0.15)",
        },
        text: {
          primary:   "#e2e8f0",
          secondary: "#94a3b8",
          muted:     "#475569",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-card": "linear-gradient(135deg, #131c35 0%, #0f1629 100%)",
        "gradient-brand": "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
        "gradient-green": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        "gradient-red":   "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        glow:    { "0%": { boxShadow: "0 0 5px rgba(59,130,246,0.3)" }, "100%": { boxShadow: "0 0 20px rgba(59,130,246,0.6)" } },
      },
      boxShadow: {
        card:  "0 4px 24px rgba(0,0,0,0.4)",
        glow:  "0 0 20px rgba(59,130,246,0.3)",
        green: "0 0 20px rgba(16,185,129,0.3)",
        red:   "0 0 20px rgba(239,68,68,0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
