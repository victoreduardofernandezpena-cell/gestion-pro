import Card from "../Card";
import EmptyState from "../EmptyState";
import { money } from "../../utils/format";

export default function TopDebtorsTable({ title = "Clientes con mas deuda", rows = [] }) {
  return (
    <Card className="overflow-hidden">
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Cuentas por cobrar</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">{title}</h2>
      </div>
      {!rows.length ? (
        <EmptyState title="Sin cuentas por cobrar" description="No hay clientes con balances pendientes." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <tr>
                <th className="pb-3 font-semibold">Cliente</th>
                <th className="pb-3 text-right font-semibold">Facturas</th>
                <th className="pb-3 text-right font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => (
                <tr key={row.client}>
                  <td className="py-3 font-medium text-slate-800 dark:text-slate-100">{row.client}</td>
                  <td className="py-3 text-right text-slate-500 dark:text-slate-400">{row.count}</td>
                  <td className="py-3 text-right font-semibold text-slate-950 dark:text-slate-100">{money.format(Number(row.total || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
