/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './data/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '2rem', lg: '3rem', xl: '4rem' },
      screens: { '2xl': '1440px' },
    },
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#050505',
          50: '#F7F7F8',
          900: '#0A0A0A',
          950: '#050505',
        },
        graphite: {
          DEFAULT: '#18181B',
          light: '#27272A',
          dark: '#111113',
        },
        gold: {
          DEFAULT: '#D4AF37',
          50: '#FBF6E4',
          100: '#F3E7BE',
          300: '#E4CB7C',
          400: '#DCBD5A',
          500: '#D4AF37',
          600: '#B8942A',
          700: '#96771F',
          800: '#6E5715',
          900: '#4A3A0D',
        },
        smoke: '#A1A1AA',
        ash: '#71717A',
      },
      fontFamily: {
        display: ['var(--font-cinzel)', 'Cinzel', 'Georgia', 'Times New Roman', 'serif'],
        sans: [
          'var(--font-inter)',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      letterSpacing: {
        luxe: '0.32em',
        wider2: '0.18em',
      },
      maxWidth: {
        prose: '68ch',
      },
      boxShadow: {
        kit: '0 40px 80px -32px rgba(0,0,0,0.85)',
        gold: '0 0 0 1px rgba(212,175,55,0.35), 0 24px 48px -24px rgba(212,175,55,0.35)',
      },
      backgroundImage: {
        'gold-sheen':
          'linear-gradient(100deg, #96771F 0%, #D4AF37 28%, #F3E7BE 48%, #D4AF37 68%, #96771F 100%)',
        'obsidian-fade':
          'linear-gradient(180deg, #050505 0%, #0A0A0A 45%, #18181B 100%)',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sheen-sweep': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'scroll-hint': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.35' },
          '50%': { transform: 'translateY(8px)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'sheen-sweep': 'sheen-sweep 6s linear infinite',
        'scroll-hint': 'scroll-hint 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
