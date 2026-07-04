import { useState } from "react";
import AlertMessage from "./AlertMessage";
import Button from "./Button";

const validate = ({ newPassword, confirmPassword }) => {
  if (!newPassword) return "La nueva contrasena temporal es obligatoria";
  if (newPassword.length < 8) return "La contrasena debe tener al menos 8 caracteres";
  if (!/[A-Za-z]/.test(newPassword)) return "La contrasena debe incluir al menos una letra";
  if (!/\d/.test(newPassword)) return "La contrasena debe incluir al menos un numero";
  if (newPassword !== confirmPassword) return "Las contrasenas no coinciden";
  return "";
};

export default function ResetPasswordModal({ user, open, loading, onClose, onConfirm }) {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");

  if (!open || !user) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const validation = validate(form);
    if (validation) return setError(validation);
    await onConfirm(form.newPassword);
    setForm({ newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 py-6">
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">Resetear contrasena</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Esto no mostrara la contrasena anterior. Se creara una nueva contrasena temporal para {user.email} y el usuario debera cambiarla al iniciar sesion.
        </p>
        <div className="mt-4">
          <AlertMessage>{error}</AlertMessage>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nueva contrasena temporal</span>
          <input
            type="password"
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors duration-200 focus:border-accent dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            required
          />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar contrasena</span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors duration-200 focus:border-accent dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            required
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>Resetear contrasena</Button>
        </div>
      </form>
    </div>
  );
}
