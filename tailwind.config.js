/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f7f5",
          100: "#e6efe9",
          200: "#cfe0d6",
          300: "#b0cbbd",
          400: "#8bb29f",
          500: "#6f9a86",
          600: "#557a69",
          700: "#456155",
          800: "#394f46",
          900: "#2f413b",
        },
      },
    },
  },
  plugins: [],
};
