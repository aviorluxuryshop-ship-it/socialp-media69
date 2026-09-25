/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
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
         * The scene, not the page. Every product world sits on the same
         * near-black stage so the can — lit, reflective, photographed — is
         * always the brightest, most saturated thing on screen. Flavour
         * identity lives in the accent and glow tokens each product page
         * sets on its own root, never in the ground itself.
         */
        void: {
          DEFAULT: '#0A0A0B',
          soft: '#131315',
          raised: '#1B1B1F',
        },
        mist: '#EDEDEF',
        haze: '#9C9CA6',
        line: 'rgba(237,237,239,0.12)',
        seftali: {
          DEFAULT: '#F4842E',
          deep: '#C4631A',
          leaf: '#12741F',
          ink: '#180D06',
        },
        limon: {
          DEFAULT: '#F7DC30',
          deep: '#D6A80E',
          leaf: '#317D29',
          ink: '#12130A',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        wide3: '0.24em',
        wide4: '0.32em',
      },
      transitionTimingFunction: {
        cinema: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
