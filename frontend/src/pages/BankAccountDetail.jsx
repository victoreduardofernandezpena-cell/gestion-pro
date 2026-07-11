import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import FinancialOriginLink from "../components/FinancialOriginLink";
import FormField from "../components/FormField";
import SummaryCard from "../components/SummaryCard";
import { depositBankAccount, getBankAccount, getBankAccountTransactions, withdrawBankAccount } from "../services/bankService";
import { getErrorMessage } from "../utils/errors";
import { bankTransactionLabels, formatDate, money } from "../utils/format";
import { DEFAULT_PAGINATION, normalizePaginatedResult } from "../utils/pagination";

const baseMovement = { amount: "", description: "", reference: "", transactionDate: new Date().toISOString().slice(0, 10) };

export default function BankAccountDetail() {
  const { id } = useParams();
  const [account, setAccount] = useState(null);
  const [deposit, setDeposit] = useState(baseMovement);
  const [withdraw, setWithdraw] = useState(baseMovement);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (page = pagination.page) => {
    setLoading(true);
    try {
      const [accountData, transactionData] = await Promise.all([
        getBankAccount(id, { includeTransactions: false }),
        getBankAccountTransactions(id, { page, limit: pagination.limit })
      ]);
      const normalized = normalizePaginatedResult(transactionData, { ...pagination, page });
      setAccount(accountData);
      setTransactions(normalized.rows);
      setPagination(normalized.meta);
      setError("");
    } catch (err) { setError(getErrorMessage(err, "No fue posible cargar la cuenta")); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const submitMovement = async (event, kind) => {
    event.preventDefault();
    const payload = kind === "deposit" ? deposit : withdraw;
    if (Number(payload.amount) <= 0) return setError("El monto debe ser mayor que cero");
    try {
      if (kind === "deposit") { await depositBankAccount(id, { ...payload, amount: Number(payload.amount) }); setDeposit(baseMovement); }
      else { await withdrawBankAccount(id, { ...payload, amount: Number(payload.amount) }); setWithdraw(baseMovement); }
      await load(pagination.page);
    } catch (err) { setError(getErrorMessage(err, "No fue posible registrar el movimiento")); }
  };

  if (loading) return <div className="rounded-lg bg-white p-6 shadow-soft">Cargando cuenta bancaria...</div>;
  if (!account) return <AlertMessage>{error || "Cuenta no encontrada"}</AlertMessage>;

  const columns = [
    { key: "transactionDate", header: "Fecha", render: (row) => formatDate(row.transactionDate) },
    { key: "type", header: "Tipo", render: (row) => bankTransactionLabels[row.type] },
    { key: "amount", header: "Monto", render: (row) => money.format(Number(row.amount)) },
    { key: "description", header: "Descripcion" },
    { key: "reference", header: "Referencia" },
    { key: "origin", header: "Origen", render: (row) => <FinancialOriginLink origin={row.origin} /> }
  ];
  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-accent">Banco</p><h1 className="text-3xl font-semibold text-slate-950">{account.name}</h1><p className="text-slate-500">{account.bankName}</p></div><Link to="/banco" className="h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700">Volver</Link></div>
      <AlertMessage>{error}</AlertMessage>
      <SummaryCard title="Balance actual" value={money.format(Number(account.currentBalance))} tone="blue" />
      <section className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={(e) => submitMovement(e, "deposit")} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><h2 className="mb-4 text-lg font-semibold">Registrar deposito</h2><FormField label="Monto" type="number" min={0} value={deposit.amount} onChange={(v) => setDeposit({ ...deposit, amount: v })} required /><FormField label="Descripcion" value={deposit.description} onChange={(v) => setDeposit({ ...deposit, description: v })} /><FormField label="Referencia" value={deposit.reference} onChange={(v) => setDeposit({ ...deposit, reference: v })} /><FormField label="Fecha" type="date" value={deposit.transactionDate} onChange={(v) => setDeposit({ ...deposit, transactionDate: v })} required /><button className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">Depositar</button></form>
        <form onSubmit={(e) => submitMovement(e, "withdraw")} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><h2 className="mb-4 text-lg font-semibold">Registrar retiro</h2><FormField label="Monto" type="number" min={0} value={withdraw.amount} onChange={(v) => setWithdraw({ ...withdraw, amount: v })} required /><FormField label="Descripcion" value={withdraw.description} onChange={(v) => setWithdraw({ ...withdraw, description: v })} /><FormField label="Referencia" value={withdraw.reference} onChange={(v) => setWithdraw({ ...withdraw, reference: v })} /><FormField label="Fecha" type="date" value={withdraw.transactionDate} onChange={(v) => setWithdraw({ ...withdraw, transactionDate: v })} required /><button className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Retirar</button></form>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><h2 className="mb-4 text-lg font-semibold">Historial de movimientos</h2><DataTable columns={columns} rows={transactions} pagination={pagination} onPageChange={load} minWidth="980px" emptyTitle="Sin movimientos" /></section>
    </div>
  );
}
