/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        yellow: "#EDE248",
        pink: "#F44C65",
        green: "#46BA74",
        cream: "#F2F0EA",
        grey: "#AAAB9D",
        ink: "#14110D",
      },
      fontFamily: {
        display: ["Outfit Variable", "Outfit", "sans-serif"],
        body: ["Inter Variable", "Inter", "sans-serif"],
        mono: [
          "JetBrains Mono Variable",
          "JetBrains Mono Fallback",
          "Menlo",
          "DejaVu Sans Mono",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
