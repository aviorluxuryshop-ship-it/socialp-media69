/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './data/**/*.ts', './lib/**/*.ts'],
  theme: {
    screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '2rem', lg: '3rem', xl: '4rem' },
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // Taken from the packaging. The can colours are for the product and
        // small accents only; the page itself sits on warm paper so the cans
        // are the brightest thing on screen.
        paper: { DEFAULT: '#F6F1E6', deep: '#EEE7D7', edge: '#E2D9C5' },
        ink: { DEFAULT: '#1B1A14', soft: '#57524A', faint: '#8A8375' },
        lemon: { DEFAULT: '#F5CF05', tint: '#F7EDC0', deep: '#6B5A00' },
        peach: { DEFAULT: '#F56C04', tint: '#F8DCC6', deep: '#8A3500' },
        leaf: { DEFAULT: '#16720F', deep: '#0B5103' },
        forest: { DEFAULT: '#10291A', soft: '#1B3A27', line: '#2C4C38' },
        cream: '#F6F1E6',
        logo: '#D41A10',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        eyebrow: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.2em' }],
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      maxWidth: { prose: '38rem' },
    },
  },
  plugins: [],
}
