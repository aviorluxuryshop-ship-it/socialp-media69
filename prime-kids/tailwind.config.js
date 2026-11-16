/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Logo monokrom olduğu için palet de sakin: sıcak kâğıt zemin + mürekkep siyahı.
        // Tek vurgu rengi koyu çam yeşili; yalnızca bağlantı, onay ve küçük ayrıntılarda kullanılır.
        cream: "#F7F4EE",
        sand: "#EDE8DE",
        ink: "#171512",
        mute: "#655F56",
        line: "#DED7C9",
        pine: { DEFAULT: "#1F4A3D", dark: "#163529", soft: "#E4ECE7" },
        alert: "#A3341F",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
