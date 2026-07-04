import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import CustomChartTooltip from "../dashboard/CustomChartTooltip";
import FinanceChartCard from "./FinanceChartCard";

const formatAxisMoney = (value) => {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 1000000) return `${Math.round(amount / 1000000)}M`;
  if (Math.abs(amount) >= 1000) return `${Math.round(amount / 1000)}k`;
  return amount;
};

export default function ProfitabilityChart({ data = [], chartTheme }) {
  return (
    <FinanceChartCard title="Ventas, gastos y ganancia" subtitle="Rentabilidad aproximada por mes">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 4, right: 12, top: 12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={chartTheme.grid} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} dy={8} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} tickFormatter={formatAxisMoney} width={48} />
            <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: chartTheme.muted, strokeDasharray: "4 4" }} />
            <Legend iconType="circle" wrapperStyle={{ color: chartTheme.text, paddingTop: 14 }} />
            <Line type="monotone" dataKey="sales" name="Ventas" stroke={chartTheme.colors.sales} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="expenses" name="Gastos" stroke={chartTheme.colors.expenses} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="netProfit" name="Ganancia neta" stroke={chartTheme.colors.profit} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </FinanceChartCard>
  );
}
