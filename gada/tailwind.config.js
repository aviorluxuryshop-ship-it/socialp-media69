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
        /**
         * Neutral chrome accent — nav hover, CTA, the scroll indicator. Not
         * either flavor's own colour (those are per-product, from
         * content/products.ts, and applied with inline styles where the
         * active flavor should show through, e.g. the flavor picker).
         */
        accent: {
          DEFAULT: '#F0A519',
          50: '#FFF8E6',
          100: '#FDEBBB',
          300: '#F6C85C',
          400: '#F3B838',
          500: '#F0A519',
          600: '#CC8300',
          700: '#9C6400',
          800: '#6E4700',
          900: '#463000',
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
        'fade-void': 'linear-gradient(180deg, #000000 0%, #0A0A0B 55%, #0F0F11 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scroll-hint': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '50%': { transform: 'translateY(8px)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scroll-hint': 'scroll-hint 2.2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
