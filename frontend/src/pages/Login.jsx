import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Building2, CheckCircle2, Copy, Eye, EyeOff, Lock, Mail, MapPin, Phone, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import ThemeToggle from "../components/ThemeToggle";
import { getErrorMessage } from "../utils/errors";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  companyName: "",
  tradeName: "",
  rnc: "",
  phone: "",
  address: "",
  city: "Santo Domingo",
  country: "Republica Dominicana",
  companyCode: ""
};

function LoginField({ icon: Icon, label, helper, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-warm-700 dark:text-warm-200">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-600" />
        <input
          {...props}
          className={`h-12 w-full rounded-xl border border-warm-500 bg-warm-50 pl-10 pr-3 text-ink outline-none transition focus:border-olive-500 focus:ring-4 focus:ring-olive-500/20 dark:border-warm-800 dark:bg-warm-950 dark:text-warm-100 dark:focus:ring-terracotta-300/20 ${props.className || ""}`}
        />
      </div>
      {helper && <p className="mt-1.5 text-xs leading-relaxed text-warm-700 dark:text-warm-600">{helper}</p>}
    </label>
  );
}

export default function Login() {
  const { login, register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const canRegister = import.meta.env.VITE_DISABLE_PUBLIC_REGISTER !== "true";
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={user?.mustChangePassword ? "/cambiar-contrasena-obligatorio" : "/"} replace />;

  const changeMode = (nextMode) => {
    if (nextMode === "register" && !canRegister) return;
    setMode(nextMode);
    setRegistrationResult(null);
    setError("");
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Codigo copiado");
    } catch {
      toast.error("No fue posible copiar el codigo");
    }
  };

  const goToLoginWithCode = () => {
    setForm({
      ...emptyForm,
      email: registrationResult?.user?.email || "",
      companyCode: registrationResult?.company?.code || ""
    });
    setRegistrationResult(null);
    setMode("login");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        if (!canRegister) throw new Error("El registro publico esta desactivado");
        if (form.password !== form.confirmPassword) throw new Error("Las contrasenas no coinciden");
        const result = await register({
          name: form.name,
          email: form.email,
          password: form.password,
          companyName: form.companyName,
          tradeName: form.tradeName,
          rnc: form.rnc,
          phone: form.phone,
          address: form.address,
          city: form.city,
          country: form.country
        });
        setRegistrationResult(result);
        toast.success("Negocio creado correctamente");
        return;
      }

      const nextUser = await login({
        email: form.email,
        password: form.password,
        companyCode: form.companyCode
      });
      navigate(nextUser.mustChangePassword ? "/cambiar-contrasena-obligatorio" : "/");
    } catch (err) {
      setError(getErrorMessage(err, mode === "login" ? "No fue posible iniciar sesion" : "No fue posible crear el negocio"));
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Bienvenido de nuevo" : "Crear mi negocio";
  const subtitle = mode === "login" ? "Entra con tu correo, contrasena y codigo de compania." : "Crea tu negocio limpio. El sistema generara el codigo de compania automaticamente.";

  return (
    <div className="min-h-screen bg-warm-200 text-ink transition-colors duration-200 dark:bg-warm-950 dark:text-warm-100">
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      <main className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden bg-[linear-gradient(160deg,#3f5f46_0%,#5f7c63_48%,#c46a4a_130%)] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-warm-50 text-lg font-bold text-olive-700 shadow-lg shadow-black/10">GP</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Gestion Pro</p>
              <p className="font-semibold">ERP multiempresa</p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-warm-100">
              <Sparkles size={15} />
              Negocios independientes desde el primer acceso
            </div>
            <h1 className="text-5xl font-semibold leading-tight">Ventas, inventario, finanzas y reportes para cada empresa.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/65">
              Cada negocio tiene su propio codigo de compania. Los datos quedan separados y el administrador controla usuarios, roles y configuracion.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-white/75">
            {[
              ["Crear negocio", "Registra una empresa limpia sin datos demo."],
              ["Codigo automatico", "El sistema genera un codigo unico para iniciar sesion."],
              ["Roles y permisos", "Cada usuario entra solo a la compania asignada."]
            ].map(([itemTitle, description]) => (
              <div key={itemTitle} className="rounded-2xl border border-white/15 bg-white/[0.08] p-4">
                <p className="font-semibold text-white">{itemTitle}</p>
                <p className="mt-1 text-white/55">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10">
          <form onSubmit={handleSubmit} className="w-full max-w-[560px] rounded-2xl border border-warm-400 bg-warm-50 p-7 shadow-warm dark:border-warm-800 dark:bg-warm-900 sm:p-8">
            {registrationResult ? (
              <div className="space-y-6">
                <div>
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-olive-500/10 text-olive-700 dark:bg-olive-500/20 dark:text-olive-500">
                    <CheckCircle2 size={26} />
                  </div>
                  <p className="text-sm font-semibold text-accent">Negocio creado correctamente</p>
                  <h2 className="mt-2 text-3xl font-semibold text-ink dark:text-warm-100">{registrationResult.company?.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-warm-700 dark:text-warm-600">Guarda este codigo. Lo necesitaras para iniciar sesion.</p>
                </div>

                <div className="rounded-2xl border border-warm-400 bg-warm-100 p-4 dark:border-warm-800 dark:bg-warm-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-warm-700 dark:text-warm-600">Codigo de compania</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <strong className="select-all text-2xl tracking-wide text-ink dark:text-warm-100">{registrationResult.company?.code}</strong>
                    <Button type="button" variant="outline" icon={Copy} onClick={() => copyCode(registrationResult.company?.code)}>Copiar codigo</Button>
                  </div>
                </div>

                <div className="grid gap-3 rounded-2xl border border-warm-300 bg-white/70 p-4 text-sm dark:border-warm-800 dark:bg-warm-900/70">
                  <div className="flex justify-between gap-4"><span className="text-warm-700 dark:text-warm-600">Admin</span><strong>{registrationResult.user?.name}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-warm-700 dark:text-warm-600">Email</span><strong className="text-right">{registrationResult.user?.email}</strong></div>
                </div>

                <Button type="button" className="w-full" onClick={goToLoginWithCode}>Iniciar sesion</Button>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-olive-500/10 text-olive-700 dark:bg-olive-500/20 dark:text-olive-500">
                    <ShieldCheck size={22} />
                  </div>
                  <p className="text-sm font-semibold text-accent">Acceso seguro</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-normal text-ink dark:text-warm-100">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-warm-700 dark:text-warm-600">{subtitle}</p>
                </div>

                <div className={`mb-5 grid ${canRegister ? "grid-cols-2" : "grid-cols-1"} rounded-xl bg-warm-200 p-1 text-sm font-semibold dark:bg-warm-950`}>
                  <button type="button" onClick={() => changeMode("login")} className={`h-10 rounded-lg transition ${mode === "login" ? "bg-warm-50 text-ink shadow-sm dark:bg-warm-900 dark:text-warm-100" : "text-warm-700 hover:text-ink dark:hover:text-warm-100"}`}>Iniciar sesion</button>
                  {canRegister && <button type="button" onClick={() => changeMode("register")} className={`h-10 rounded-lg transition ${mode === "register" ? "bg-warm-50 text-ink shadow-sm dark:bg-warm-900 dark:text-warm-100" : "text-warm-700 hover:text-ink dark:hover:text-warm-100"}`}>Crear negocio</button>}
                </div>

                <div className="mb-5">
                  <AlertMessage>{error}</AlertMessage>
                </div>

                <div className="space-y-4">
                  {mode === "register" && (
                    <LoginField icon={UserRound} label="Nombre del administrador" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} type="text" autoComplete="name" required />
                  )}

                  <LoginField icon={Mail} label="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" autoComplete="email" required />

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-warm-700 dark:text-warm-200">Contrasena</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-600" />
                      <input className="h-12 w-full rounded-xl border border-warm-500 bg-warm-50 pl-10 pr-12 text-ink outline-none transition focus:border-olive-500 focus:ring-4 focus:ring-olive-500/20 dark:border-warm-800 dark:bg-warm-950 dark:text-warm-100 dark:focus:ring-terracotta-300/20" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-600 hover:text-ink dark:hover:text-warm-100" aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {mode === "register" && <p className="mt-1.5 text-xs leading-relaxed text-warm-700 dark:text-warm-600">Minimo 8 caracteres, con letras y numeros.</p>}
                  </label>

                  {mode === "register" && (
                    <>
                      <LoginField icon={Lock} label="Confirmar contrasena" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} type="password" autoComplete="new-password" required />
                      <LoginField icon={Building2} label="Nombre del negocio" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} type="text" autoComplete="organization" required />
                      <LoginField icon={Building2} label="Nombre comercial opcional" value={form.tradeName} onChange={(event) => setForm({ ...form, tradeName: event.target.value })} type="text" autoComplete="organization" />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <LoginField icon={Building2} label="RNC opcional" value={form.rnc} onChange={(event) => setForm({ ...form, rnc: event.target.value })} type="text" />
                        <LoginField icon={Phone} label="Telefono opcional" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} type="text" />
                      </div>
                      <LoginField icon={MapPin} label="Direccion opcional" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} type="text" />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <LoginField icon={MapPin} label="Ciudad" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} type="text" />
                        <LoginField icon={MapPin} label="Pais" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} type="text" />
                      </div>
                    </>
                  )}

                  {mode === "login" && (
                    <LoginField icon={Building2} label="Codigo de compania" helper="Ej: REALENGO-4821" value={form.companyCode} onChange={(event) => setForm({ ...form, companyCode: event.target.value.toUpperCase() })} type="text" autoCapitalize="characters" autoComplete="organization" required className="uppercase" />
                  )}
                </div>

                <button disabled={loading} className="mt-6 h-12 w-full rounded-xl bg-olive-500 px-4 font-semibold text-white transition hover:bg-olive-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear negocio"}
                </button>

                <p className="mt-5 text-center text-xs leading-5 text-warm-700 dark:text-warm-600">
                  {mode === "login" ? (canRegister ? "Si aun no tienes negocio registrado, usa la opcion Crear negocio." : "Solicita acceso al administrador de tu empresa.") : "Al crear el negocio quedaras como administrador. El codigo se genera automaticamente."}
                </p>
              </>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
