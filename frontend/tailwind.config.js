export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15202b",
        graphite: "#26313d",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        signal: "#df3f3f"
      },
      boxShadow: {
        soft: "0 14px 35px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
