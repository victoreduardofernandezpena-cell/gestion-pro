import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import CustomChartTooltip from "../dashboard/CustomChartTooltip";
import FinanceChartCard from "./FinanceChartCard";

const formatAxisMoney = (value) => {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 1000000) return `${Math.round(amount / 1000000)}M`;
  if (Math.abs(amount) >= 1000) return `${Math.round(amount / 1000)}k`;
  return amount;
};

export default function CashFlowChart({ data = [], chartTheme }) {
  return (
    <FinanceChartCard title="Flujo de caja mensual" subtitle="Entradas, salidas y flujo neto del periodo">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 4, right: 12, top: 12, bottom: 0 }}>
            <defs>
              <linearGradient id="financeInflows" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartTheme.colors.sales} stopOpacity={0.28} />
                <stop offset="95%" stopColor={chartTheme.colors.sales} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="financeOutflows" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartTheme.colors.payable} stopOpacity={0.24} />
                <stop offset="95%" stopColor={chartTheme.colors.payable} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={chartTheme.grid} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} dy={8} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} tickFormatter={formatAxisMoney} width={48} />
            <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: chartTheme.muted, strokeDasharray: "4 4" }} />
            <Legend iconType="circle" wrapperStyle={{ color: chartTheme.text, paddingTop: 14 }} />
            <Area type="monotone" dataKey="inflows" name="Entradas" stroke={chartTheme.colors.sales} fill="url(#financeInflows)" strokeWidth={3} />
            <Area type="monotone" dataKey="outflows" name="Salidas" stroke={chartTheme.colors.payable} fill="url(#financeOutflows)" strokeWidth={3} />
            <Area type="monotone" dataKey="net" name="Neto" stroke={chartTheme.colors.profit} fill="transparent" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </FinanceChartCard>
  );
}
