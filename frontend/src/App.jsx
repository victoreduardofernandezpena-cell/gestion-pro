import { Toaster } from "react-hot-toast";
import AppErrorBoundary from "./components/AppErrorBoundary.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <AppErrorBoundary>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "8px",
            border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
            background: isDark ? "#0f172a" : "#ffffff",
            color: isDark ? "#f1f5f9" : "#0f172a",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)"
          }
        }}
      />
    </AppErrorBoundary>
  );
}
