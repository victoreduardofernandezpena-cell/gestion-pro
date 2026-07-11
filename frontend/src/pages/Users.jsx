import { useEffect, useState } from "react";
import { Edit2, KeyRound, Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import ResetPasswordModal from "../components/ResetPasswordModal";
import { changeUserStatus, createUser, getUsers, resetUserPassword, roleLabels, updateUser } from "../services/userService";
import { getErrorMessage } from "../utils/errors";
import { formatDate } from "../utils/format";
import { DEFAULT_PAGINATION, normalizePaginatedResult } from "../utils/pagination";

const emptyUser = { name: "", email: "", role: "ventas", password: "" };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyUser);
  const [editingId, setEditingId] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const load = async (page = pagination.page) => {
    setLoading(true);
    try {
      const result = await getUsers({ ...filters, page, limit: pagination.limit });
      const normalized = normalizePaginatedResult(result, { ...pagination, page });
      setUsers(normalized.rows);
      setPagination(normalized.meta);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar usuarios"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const validate = () => {
    if (!form.name.trim()) return "El nombre es obligatorio";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Email invalido";
    if (!form.role) return "El rol es obligatorio";
    if (!editingId && (!form.password || form.password.length < 8)) return "La contrasena debe tener al menos 8 caracteres";
    if (!editingId && (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))) return "La contrasena debe incluir al menos una letra y un numero";
    return "";
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const validation = validate();
    if (validation) return setError(validation);
    setSaving(true);
    try {
      if (editingId) await updateUser(editingId, form);
      else await createUser(form);
      setForm(emptyUser);
      setEditingId(null);
      await load(pagination.page);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible guardar usuario"));
    } finally {
      setSaving(false);
    }
  };

  const edit = (user) => {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, role: user.role, password: "" });
  };

  const toggle = async (user) => {
    try {
      await changeUserStatus(user.id, !user.isActive);
      await load(pagination.page);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cambiar estado"));
    }
  };

  const submitPasswordReset = async (newPassword) => {
    if (!resetUser) return;
    setSaving(true);
    try {
      await resetUserPassword(resetUser.id, newPassword);
      toast.success("Contrasena reseteada correctamente");
      setResetUser(null);
      await load(pagination.page);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible resetear contrasena"));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "name", header: "Nombre", className: "font-medium" },
    { key: "email", header: "Email" },
    { key: "role", header: "Rol", render: (user) => roleLabels[user.role] },
    { key: "isActive", header: "Estado", render: (user) => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{user.isActive ? "Activo" : "Inactivo"}</span> },
    { key: "mustChangePassword", header: "Contrasena", render: (user) => user.mustChangePassword ? <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">Debe cambiar</span> : <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Actualizada</span> },
    { key: "lastLoginAt", header: "Ultimo login", render: (user) => user.lastLoginAt ? formatDate(user.lastLoginAt) : "-" },
    { key: "createdAt", header: "Creado", render: (user) => formatDate(user.createdAt) },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (user) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => edit(user)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Editar"><Edit2 size={16} /></button>
          <button onClick={() => setResetUser(user)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Resetear contrasena" title="Resetear contrasena"><KeyRound size={16} /></button>
          <button onClick={() => toggle(user)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Estado">{user.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}</button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Seguridad</p>
        <h1 className="text-3xl font-semibold text-slate-950">Usuarios</h1>
      </div>
      <AlertMessage>{error}</AlertMessage>
      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Plus size={18} />{editingId ? "Editar usuario" : "Nuevo usuario"}</h2>
          <FormField label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <FormField label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
          <FormField label="Rol" as="select" value={form.role} onChange={(value) => setForm({ ...form, role: value })} required>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FormField>
          {!editingId && <FormField label="Contrasena" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} required />}
          <div className="flex gap-2"><button disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Guardando..." : "Guardar"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyUser); }} className="rounded-lg border border-slate-300 px-4 py-2">Cancelar</button>}</div>
        </form>
        <div className="space-y-4">
          <form onSubmit={(event) => { event.preventDefault(); load(1); }} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"><Search size={18} className="text-slate-400" /><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Nombre o email" className="w-full outline-none" /></label>
              <FormField label="Rol" as="select" value={filters.role} onChange={(value) => setFilters({ ...filters, role: value })}><option value="">Todos</option>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FormField>
              <FormField label="Estado" as="select" value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })}><option value="">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></FormField>
            </div>
            <button className="mt-3 rounded-lg bg-accent px-4 py-2 font-semibold text-white">Filtrar</button>
          </form>
          {loading ? <div className="rounded-lg bg-white p-6 shadow-soft">Cargando usuarios...</div> : <DataTable columns={columns} rows={users} pagination={pagination} onPageChange={load} minWidth="1100px" emptyTitle="No hay usuarios" />}
        </div>
      </section>
      <ResetPasswordModal
        open={Boolean(resetUser)}
        user={resetUser}
        loading={saving}
        onClose={() => setResetUser(null)}
        onConfirm={submitPasswordReset}
      />
    </div>
  );
}
