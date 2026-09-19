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
      screens: { '2xl': '1360px' },
    },
    extend: {
      colors: {
        // Carbon: the near-black the cards float on. Not pure #000 — a
        // hair of blue keeps it from going dead under the signal color.
        carbon: {
          DEFAULT: '#0B0C10',
          soft: '#14161C',
          raised: '#1B1E26',
        },
        // Signal: the tap. One vivid color standing for the NFC handshake
        // itself — everything else in the palette exists to set it off.
        signal: {
          DEFAULT: '#C6FF3D',
          dim: '#9FE01A',
          50: '#F4FFDD',
          100: '#E6FFB0',
        },
        paper: {
          DEFAULT: '#F6F5F1',
          raised: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#101114',
          soft: '#4A4B52',
          mute: '#82838C',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1.25rem',
      },
      boxShadow: {
        signal: '0 0 0 1px rgba(198,255,61,0.4), 0 24px 48px -24px rgba(198,255,61,0.35)',
        lift: '0 40px 80px -32px rgba(0,0,0,0.55)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        tap: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both',
        tap: 'tap 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
