/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '2rem', lg: '3rem', xl: '4rem' },
      screens: { '2xl': '1440px' },
    },
    extend: {
      colors: {
        // GAZA turuncusu — markanın tek sabit rengi, hiçbir sahnede değişmez.
        gaza: {
          DEFAULT: '#FF6A13',
          50: '#FFF3E9',
          100: '#FFE1C7',
          300: '#FFB066',
          400: '#FF8A38',
          500: '#FF6A13',
          600: '#E85400',
          700: '#B84300',
          800: '#8A3200',
          900: '#5C2200',
        },
        void: {
          DEFAULT: '#0A0A0B',
          950: '#000000',
          900: '#0F0F11',
          800: '#17171A',
          700: '#212124',
        },
        silver: {
          DEFAULT: '#C7C9CE',
          light: '#E8E9EC',
          dark: '#8B8D93',
        },
        cream: '#FBF6EE',
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        wide3: '0.22em',
        wide4: '0.32em',
      },
      backgroundImage: {
        'glow-orange': 'radial-gradient(circle, rgba(255,106,19,0.55) 0%, rgba(255,106,19,0) 70%)',
        'fade-void': 'linear-gradient(180deg, #000000 0%, #0A0A0B 55%, #0F0F11 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.08)' },
        },
        'scroll-hint': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '50%': { transform: 'translateY(8px)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-glow': 'pulse-glow 4.5s ease-in-out infinite',
        'scroll-hint': 'scroll-hint 2.2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
