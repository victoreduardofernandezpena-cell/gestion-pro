import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AlertMessage from "../components/AlertMessage";
import ThemeToggle from "../components/ThemeToggle";
import { getErrorMessage } from "../utils/errors";

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", companyCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={user?.mustChangePassword ? "/cambiar-contrasena-obligatorio" : "/"} replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form);
      navigate(user.mustChangePassword ? "/cambiar-contrasena-obligatorio" : "/");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible iniciar sesion"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-100 transition-colors duration-200 dark:bg-slate-950 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>
      <section className="hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-accent text-xl font-bold">GP</div>
          <div>
            <p className="text-sm uppercase tracking-wide text-white/60">ERP</p>
            <p className="font-semibold">Gestion Pro</p>
          </div>
        </div>
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">Control operativo</p>
          <h1 className="mt-3 text-5xl font-semibold leading-tight">Gestion Pro para ventas, inventario y finanzas en un solo panel.</h1>
          <p className="mt-5 text-lg text-white/70">Una base moderna para administrar procesos internos con permisos por rol y datos centralizados.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm text-white/70">
          <div className="rounded-lg bg-white/8 p-4">Dashboard financiero</div>
          <div className="rounded-lg bg-white/8 p-4">Inventario activo</div>
          <div className="rounded-lg bg-white/8 p-4">Clientes y productos</div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-soft transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-8">
            <p className="text-sm font-medium text-accent">Acceso seguro</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-100">Iniciar sesion</h2>
          </div>
          <div className="mb-4">
            <AlertMessage>{error}</AlertMessage>
          </div>
          <label className="mb-4 block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors duration-200 focus:border-accent dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              type="email"
              required
            />
          </label>
          <label className="mb-4 block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Contrasena</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors duration-200 focus:border-accent dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              type="password"
              required
            />
          </label>
          <label className="mb-6 block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Codigo de compania</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 uppercase text-slate-900 outline-none transition-colors duration-200 focus:border-accent dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={form.companyCode}
              onChange={(event) => setForm({ ...form, companyCode: event.target.value.toUpperCase() })}
              type="text"
              autoCapitalize="characters"
              required
            />
          </label>
          <button disabled={loading} className="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? "Validando..." : "Entrar"}
          </button>
        </form>
      </section>
    </div>
  );
}
