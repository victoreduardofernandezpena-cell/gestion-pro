import { useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { changeForcedPasswordRequest } from "../services/authService";
import { getErrorMessage } from "../utils/errors";

const validate = ({ newPassword, confirmPassword }) => {
  if (!newPassword) return "La nueva contrasena es obligatoria";
  if (newPassword.length < 8) return "La nueva contrasena debe tener al menos 8 caracteres";
  if (!/[A-Za-z]/.test(newPassword)) return "La nueva contrasena debe incluir al menos una letra";
  if (!/\d/.test(newPassword)) return "La nueva contrasena debe incluir al menos un numero";
  if (newPassword !== confirmPassword) return "Las contrasenas no coinciden";
  return "";
};

export default function ForcedPasswordChange() {
  const { logout, markPasswordChanged, user } = useAuth();
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const validation = validate(form);
    if (validation) return setError(validation);
    setLoading(true);
    try {
      await changeForcedPasswordRequest(form.newPassword);
      markPasswordChanged();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cambiar la contrasena"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-5 py-10 transition-colors duration-200 dark:bg-slate-950">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-start gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-accent dark:bg-teal-950/40 dark:text-teal-300">
            <ShieldCheck size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">Accion requerida</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-100">Cambia tu contrasena</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{user?.email} debe definir una contrasena nueva antes de usar el ERP.</p>
          </div>
        </div>

        <div className="mb-4">
          <AlertMessage>{error}</AlertMessage>
        </div>

        <label className="mb-4 block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nueva contrasena</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors duration-200 focus:border-accent dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            type="password"
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            required
          />
        </label>
        <label className="mb-6 block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar contrasena</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors duration-200 focus:border-accent dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
            required
          />
        </label>
        <Button type="submit" loading={loading} className="w-full">Actualizar contrasena</Button>
        <Button type="button" variant="ghost" icon={LogOut} onClick={logout} className="mt-3 w-full">Cerrar sesion</Button>
      </form>
    </div>
  );
}
