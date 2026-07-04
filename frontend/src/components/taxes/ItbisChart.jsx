import { Bar, BarChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import CustomChartTooltip from "../dashboard/CustomChartTooltip";
import TaxChartCard from "./TaxChartCard";

const formatAxisMoney = (value) => {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 1000000) return `${Math.round(amount / 1000000)}M`;
  if (Math.abs(amount) >= 1000) return `${Math.round(amount / 1000)}k`;
  return amount;
};

export default function ItbisChart({ data = [], chartTheme }) {
  return (
    <TaxChartCard title="ITBIS cobrado vs pagado" subtitle="Comparativo mensual y neto estimado">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 4, right: 12, top: 12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={chartTheme.grid} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} dy={8} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} tickFormatter={formatAxisMoney} width={48} />
            <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.14)" }} />
            <Legend iconType="circle" wrapperStyle={{ color: chartTheme.text, paddingTop: 14 }} />
            <Bar dataKey="salesTaxCollected" name="ITBIS cobrado" fill={chartTheme.colors.sales} radius={[8, 8, 0, 0]} barSize={24} />
            <Bar dataKey="purchaseTaxPaid" name="ITBIS pagado" fill={chartTheme.colors.purchases} radius={[8, 8, 0, 0]} barSize={24} />
            <Line type="monotone" dataKey="netTax" name="Neto" stroke={chartTheme.colors.payable} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </TaxChartCard>
  );
}
