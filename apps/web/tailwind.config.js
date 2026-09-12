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
      // ─── Consolidated type scale ──────────────────────────────────────────
      // Replaces scattered magic-number text-[9px]…text-[15px] inline classes.
      // Five semantic steps + one label step. All rem-based so they respect
      // the user's browser font-size preference.
      fontSize: {
        // 10px – badge labels, table footers, micro-metadata
        "2xs": ["0.625rem",  { lineHeight: "0.875rem", letterSpacing: "0.025em" }],
        // 11px – secondary labels, timestamps, helper text
        xs:    ["0.6875rem", { lineHeight: "1rem",     letterSpacing: "0.01em"  }],
        // 13px – body small, table cells, form hints
        sm:    ["0.8125rem", { lineHeight: "1.25rem"                            }],
        // 15px – primary body copy, card descriptions
        base:  ["0.9375rem", { lineHeight: "1.5rem"                             }],
        // 17px – sub-headings, card titles
        lg:    ["1.0625rem", { lineHeight: "1.625rem"                           }],
        // 20px – page section headings
        xl:    ["1.25rem",   { lineHeight: "1.75rem"                            }],
        // 25px – page-level h1 (maps to .page-title)
        "2xl": ["1.5625rem", { lineHeight: "1.875rem", letterSpacing: "-0.02em" }],
        // 22px – h2
        "1.5xl": ["1.375rem", { lineHeight: "1.75rem", letterSpacing: "-0.015em" }],
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
