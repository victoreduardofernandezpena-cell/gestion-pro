import { useEffect, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import AppearanceSettings from "../components/AppearanceSettings";
import FormField from "../components/FormField";
import SummaryCard from "../components/SummaryCard";
import { ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { changeProfilePassword, getProfile, updateProfile } from "../services/profileService";
import { roleLabels } from "../services/userService";
import { getErrorMessage } from "../utils/errors";
import { formatDate } from "../utils/format";

export default function Profile() {
  const { updateStoredUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
      setForm({ name: data.name, email: data.email });
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar perfil"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const submitProfile = async (event) => {
    event.preventDefault();
    setError(""); setMessage("");
    if (!form.name.trim()) return setError("El nombre es obligatorio");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Email invalido");
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      setProfile(updated);
      updateStoredUser(updated);
      setMessage("Perfil actualizado");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible actualizar perfil"));
    } finally {
      setSaving(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setError(""); setMessage("");
    if (passwordForm.newPassword.length < 8) return setError("La nueva contrasena debe tener al menos 8 caracteres");
    if (!/[A-Za-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) return setError("La nueva contrasena debe incluir al menos una letra y un numero");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setError("Las contrasenas no coinciden");
    setSaving(true);
    try {
      await changeProfilePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage("Contrasena actualizada");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cambiar contrasena"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-lg bg-white p-6 shadow-soft dark:bg-slate-900 dark:text-slate-100">Cargando perfil...</div>;

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-wide text-accent">Perfil</p><h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Mi Perfil</h1></div>
      <AlertMessage>{error}</AlertMessage>
      {message && <AlertMessage type="success">{message}</AlertMessage>}
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Usuario" value={profile?.name} icon={UserRound} />
        <SummaryCard title="Rol" value={roleLabels[profile?.role]} icon={ShieldCheck} tone="blue" />
        <SummaryCard title="Ultimo login" value={profile?.lastLoginAt ? formatDate(profile.lastLoginAt) : "-"} icon={ShieldCheck} tone="green" />
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={submitProfile} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-100">Editar perfil</h2>
          <FormField label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <FormField label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
          <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60">Guardar</button>
        </form>
        <form onSubmit={submitPassword} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-100">Cambiar contrasena</h2>
          <FormField label="Contrasena actual" type="password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })} required />
          <FormField label="Nueva contrasena" type="password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })} required />
          <FormField label="Confirmar contrasena" type="password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })} required />
          <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60">Actualizar contrasena</button>
        </form>
      </section>
      <AppearanceSettings />
    </div>
  );
}
