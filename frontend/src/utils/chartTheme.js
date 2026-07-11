export function getChartTheme(theme) {
  const isDark = theme === "dark";

  return {
    axis: isDark ? "#c7bcaf" : "#7a716a",
    grid: isDark ? "#3a312a" : "#e6ded4",
    text: isDark ? "#f7f3ec" : "#2b2b2b",
    muted: isDark ? "#8d8074" : "#a99b8d",
    tooltipBackground: isDark ? "#25201b" : "#fffcf7",
    tooltipBorder: isDark ? "#3a312a" : "#e6ded4",
    tooltipText: isDark ? "#f7f3ec" : "#1f2933",
    areaFill: isDark ? "rgba(231, 166, 138, 0.16)" : "rgba(95, 124, 99, 0.14)",
    colors: {
      sales: "#5f7c63",
      purchases: "#c46a4a",
      profit: "#3f5f46",
      expenses: "#d99a3d",
      receivable: "#8a6f4d",
      payable: "#c75c54",
      loyalty: "#e7a68a"
    }
  };
}
