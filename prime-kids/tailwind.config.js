/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF6EF",
        sand: "#F1EADD",
        ink: "#16130F",
        mute: "#6B645A",
        line: "#E4DCCB",
        cobalt: { DEFAULT: "#2447D6", dark: "#1A35A8", soft: "#E6EBFB" },
        blush: "#F3C9D3",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      letterSpacing: { wordmark: "0.18em" },
    },
  },
  plugins: [],
};
