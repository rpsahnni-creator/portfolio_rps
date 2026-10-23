/** @type {import('tailwindcss').Config} */
module.exports = {
    blocklist: ["overline"],
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        night: 'var(--c-bg)',
        panel: 'var(--c-panel)',
        onacc: '#04120d',
        card2: '#111827',
        white: 'rgb(var(--c-white) / <alpha-value>)',
        black: 'rgb(var(--c-black) / <alpha-value>)',
        slate: {
          50: 'var(--sl-50)',
          100: 'var(--sl-100)',
          200: 'var(--sl-200)',
          300: 'var(--sl-300)',
          400: 'var(--sl-400)',
          500: 'var(--sl-500)',
          600: 'var(--sl-600)',
          700: 'var(--sl-700)',
        },
        emerald: {
          200: 'var(--c-emerald-200)',
          300: 'var(--c-emerald-300)',
          400: 'var(--c-emerald-400)',
        },
        amber: {
          400: 'var(--c-amber-400)',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' }
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(52, 211, 153, 0.6)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 0 6px rgba(52, 211, 153, 0)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        marquee: 'marquee 42s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
