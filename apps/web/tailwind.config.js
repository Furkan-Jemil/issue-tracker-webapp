/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      // ─── Consolidated type scale for high-density information display ─────
      // Five semantic steps optimized for ticket triage and data tables.
      // All rem-based to respect user browser font-size preferences.
      fontSize: {
        // 10px – ticket IDs (monospace, tabular numerals), micro-labels
        "2xs": ["0.625rem",  { lineHeight: "0.875rem", letterSpacing: "0.02em", fontFeatureSettings: '"tnum"' }],
        // 11px – timestamps, helper text, secondary labels
        xs:    ["0.6875rem", { lineHeight: "1rem",     letterSpacing: "0.005em" }],
        // 13px – table cells, compact UI (REDUCED from 13.5px for density)
        sm:    ["0.8125rem", { lineHeight: "1.125rem" }],
        // 14px – primary body copy (REDUCED from 15px for scanner efficiency)
        base:  ["0.875rem",  { lineHeight: "1.375rem" }],
        // 16px – card titles, sub-headings
        lg:    ["1rem",      { lineHeight: "1.5rem",   letterSpacing: "-0.01em" }],
        // 18px – section headings
        xl:    ["1.125rem",  { lineHeight: "1.625rem", letterSpacing: "-0.015em" }],
        // 22px – page-level h2
        "1.5xl": ["1.375rem", { lineHeight: "1.75rem", letterSpacing: "-0.015em" }],
        // 25px – page-level h1 (maps to .page-title)
        "2xl": ["1.5625rem", { lineHeight: "1.875rem", letterSpacing: "-0.02em" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0"  },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
