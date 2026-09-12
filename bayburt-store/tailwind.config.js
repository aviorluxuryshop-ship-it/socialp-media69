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
        /*
         * Lifted off black. #050505 is the colour of a switched-off screen —
         * against it the artwork was the only thing in the room and every
         * page behind the hero read as a hole. These are still night, but
         * night with something in it: a faint warm cast so the gold has
         * somewhere to sit, and enough separation between the ground and the
         * panels that a card reads as a card rather than a border drawn on
         * nothing. Every grey above them moves with them.
         */
        obsidian: {
          DEFAULT: '#1C1C21',
          50: '#F7F7F8',
          900: '#24242B',
          950: '#141418',
        },
        graphite: {
          DEFAULT: '#2E2E36',
          light: '#3A3A44',
          dark: '#26262D',
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
        // Body copy and its quieter sibling. Both rise with the ground under
        // them — a grey that cleared 4.5:1 on near-black does not clear it on
        // a lifted one, and the whole point of lifting was to be easier to
        // read, not harder.
        smoke: '#D0D0D9',
        ash: '#A8A8B4',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Jost', 'ui-sans-serif', 'system-ui', 'Helvetica Neue', 'sans-serif'],
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
