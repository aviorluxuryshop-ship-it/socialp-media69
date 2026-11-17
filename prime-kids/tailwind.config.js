/** @type {import('tailwindcss').Config} */
module.exports = {
  // Dokunmatik ekranlarda 'hover' durumunun yapışık kalmasını engeller
  future: { hoverOnlyWhenSupported: true },
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}', './data/**/*.ts'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' }, screens: { '2xl': '1240px' } },
    extend: {
      colors: {
        ink: { DEFAULT: '#151311', soft: '#38332e', muted: '#655e56' },
        cream: '#faf7f2',
        sand: { DEFAULT: '#f2ece3', deep: '#e8dfd2' },
        line: '#e4ddd2',
        sky: '#e2eef6',
        blush: '#f8e5ea',
        sage: '#e2eee6',
        butter: '#f8f0d8',
        coral: { DEFAULT: '#d9502f', soft: '#fbe6df' },
        success: { DEFAULT: '#1d7a46', soft: '#e3f3ea' },
        danger: { DEFAULT: '#c0262d', soft: '#fde8e8' },
      },
      fontFamily: {
        display: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Nunito Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(21,19,17,.04), 0 6px 20px -8px rgba(21,19,17,.12)',
        lift: '0 2px 4px rgba(21,19,17,.05), 0 18px 40px -16px rgba(21,19,17,.25)',
        sheet: '0 -10px 40px -10px rgba(21,19,17,.25)',
      },
      borderRadius: { '4xl': '2rem' },
      transitionTimingFunction: { soft: 'cubic-bezier(.22,1,.36,1)' },
      keyframes: {
        'fade-up': { from: { opacity: 0, transform: 'translateY(14px)' }, to: { opacity: 1, transform: 'none' } },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        'slide-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'none' } },
        'pop': { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.28)' }, '100%': { transform: 'scale(1)' } },
        'float': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'peek': { from: { transform: 'translateY(110%) rotate(-8deg)' }, to: { transform: 'translateY(0) rotate(0)' } },
        'wave': { '0%,100%': { transform: 'rotate(0)' }, '25%': { transform: 'rotate(-14deg)' }, '75%': { transform: 'rotate(10deg)' } },
        'marquee': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        // Karakter sağ kenardan eğilerek çıkar / geri çekilir
        'peek-side': {
          '0%': { transform: 'translateX(120%) rotate(18deg)' },
          '70%': { transform: 'translateX(8%) rotate(-10deg)' },
          '100%': { transform: 'translateX(14%) rotate(-7deg)' },
        },
        'peek-out': {
          from: { transform: 'translateX(14%) rotate(-7deg)' },
          to: { transform: 'translateX(125%) rotate(14deg)' },
        },
        'bubble-in': {
          '0%': { opacity: 0, transform: 'scale(.6) translateY(10px)' },
          '100%': { opacity: 1, transform: 'none' },
        },
        'twinkle': { '0%,100%': { transform: 'scale(1) rotate(0)', opacity: 1 }, '50%': { transform: 'scale(.82) rotate(12deg)', opacity: .75 } },
      },
      animation: {
        'fade-up': 'fade-up .6s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fade-in .3s ease-out both',
        'sheet-up': 'sheet-up .35s cubic-bezier(.22,1,.36,1) both',
        'slide-left': 'slide-left .35s cubic-bezier(.22,1,.36,1) both',
        pop: 'pop .45s cubic-bezier(.22,1,.36,1)',
        float: 'float 6s ease-in-out infinite',
        peek: 'peek .7s cubic-bezier(.34,1.56,.64,1) both',
        wave: 'wave 1.2s ease-in-out 2',
        marquee: 'marquee 38s linear infinite',
        'peek-side': 'peek-side .85s cubic-bezier(.34,1.56,.64,1) both',
        'peek-out': 'peek-out .45s cubic-bezier(.55,0,.75,.2) both',
        'bubble-in': 'bubble-in .45s cubic-bezier(.34,1.56,.64,1) .6s both',
        twinkle: 'twinkle 3.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
