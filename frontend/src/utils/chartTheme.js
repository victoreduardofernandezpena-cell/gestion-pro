export function getChartTheme(theme) {
  const isDark = theme === "dark";

  return {
    axis: isDark ? "#94a3b8" : "#64748b",
    grid: isDark ? "#1e293b" : "#e2e8f0",
    text: isDark ? "#cbd5e1" : "#475569",
    muted: isDark ? "#64748b" : "#94a3b8",
    tooltipBackground: isDark ? "#020617" : "#ffffff",
    tooltipBorder: isDark ? "#334155" : "#e2e8f0",
    tooltipText: isDark ? "#f1f5f9" : "#0f172a",
    areaFill: isDark ? "rgba(20, 184, 166, 0.18)" : "rgba(20, 184, 166, 0.14)",
    colors: {
      sales: "#0f9488",
      purchases: "#0284c7",
      profit: "#10b981",
      expenses: "#f59e0b",
      receivable: "#06b6d4",
      payable: "#f43f5e",
      loyalty: "#8b5cf6"
    }
  };
}
