export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        graphite: "#2b2b2b",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        signal: "#c75c54",
        warm: {
          50: "#fffcf7",
          100: "#faf7f2",
          200: "#f7f3ec",
          300: "#f5efe7",
          400: "#e6ded4",
          500: "#ddd3c7",
          600: "#7a716a",
          700: "#6b625a",
          800: "#3a312a",
          900: "#25201b",
          950: "#171411"
        },
        olive: {
          500: "#5f7c63",
          700: "#3f5f46"
        },
        terracotta: {
          300: "#e7a68a",
          500: "#c46a4a"
        }
      },
      boxShadow: {
        soft: "0 18px 42px rgba(63, 48, 34, 0.08)",
        warm: "0 18px 40px rgba(74, 55, 38, 0.10)"
      }
    }
  },
  plugins: []
};
