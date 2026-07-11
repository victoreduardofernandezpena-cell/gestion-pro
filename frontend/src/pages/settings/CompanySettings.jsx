import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Copy } from "lucide-react";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../components/Button";
import FormField from "../../components/FormField";
import { getCompanySettings, updateCompanySettings, uploadCompanyLogo } from "../../services/settingsService";
import { getErrorMessage } from "../../utils/errors";

export default function CompanySettings() {
  const [form, setForm] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api\/?$/, "");
  const getLogoSrc = (logoUrl) => {
    if (!logoUrl) return "";
    if (logoUrl.startsWith("http") || logoUrl.startsWith("data:image/")) return logoUrl;
    return `${apiBaseUrl}${logoUrl}`;
  };

  useEffect(() => {
    getCompanySettings()
      .then((data) => {
        setForm(data);
        setLogoPreview(getLogoSrc(data.logoUrl));
      })
      .catch((err) => setError(getErrorMessage(err, "No fue posible cargar empresa")));
  }, []);

  const selectLogo = (event) => {
    const file = event.target.files?.[0];
    setError("");
    setMessage("");
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      event.target.value = "";
      setLogoFile(null);
      return setError("El logo debe ser una imagen PNG, JPG, JPEG o WEBP");
    }
    if (file.size > 2 * 1024 * 1024) {
      event.target.value = "";
      setLogoFile(null);
      return setError("El logo no puede pesar mas de 2MB");
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async () => {
    if (!logoFile) return setError("Selecciona una imagen antes de subir");
    setUploadingLogo(true);
    setError("");
    setMessage("");
    try {
      const result = await uploadCompanyLogo(logoFile);
      setForm({ ...form, logoUrl: result.logoUrl });
      setLogoPreview(getLogoSrc(result.logoUrl));
      setLogoFile(null);
      setMessage(result.message || "Logo actualizado correctamente");
      toast.success("Logo actualizado correctamente");
    } catch (err) {
      const msg = getErrorMessage(err, "No fue posible subir el logo");
      setError(msg);
      toast.error(msg);
    } finally {
      setUploadingLogo(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    if (!form.businessName?.trim()) return setError("El nombre legal es obligatorio");
    if (Number(form.defaultTaxRate) < 0) return setError("El impuesto no puede ser negativo");
    setSaving(true);
    try {
      const updated = await updateCompanySettings(form);
      setForm(updated);
      setLogoPreview(getLogoSrc(updated.logoUrl));
      setMessage("Configuracion guardada");
      toast.success("Configuracion de empresa guardada");
    } catch (err) {
      const msg = getErrorMessage(err, "No fue posible guardar empresa");
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };
  const copyCompanyCode = async () => {
    try {
      await navigator.clipboard.writeText(form.companyCode || "");
      toast.success("Codigo de compania copiado");
    } catch {
      toast.error("No fue posible copiar el codigo");
    }
  };

  if (!form) return <div className="rounded-lg bg-white p-6 shadow-soft">Cargando empresa...</div>;
  const fields = [["businessName","Nombre legal"],["tradeName","Nombre comercial"],["rnc","RNC"],["phone","Telefono"],["email","Email"],["address","Direccion"],["city","Ciudad"],["country","Pais"],["website","Website"],["currency","Moneda"],["currencySymbol","Simbolo moneda"],["defaultTaxRate","Impuesto por defecto"]];
  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Configuracion</p>
        <h1 className="text-3xl font-semibold">Empresa</h1>
      </div>
      <AlertMessage>{error}</AlertMessage>
      {message && <AlertMessage type="success">{message}</AlertMessage>}

      <section className="rounded-2xl border border-warm-300 bg-warm-50 p-5 shadow-warm dark:border-warm-800 dark:bg-warm-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-warm-700 dark:text-warm-600">Codigo de compania</p>
            <h2 className="mt-2 select-all text-2xl font-semibold tracking-wide text-slate-950 dark:text-warm-100">{form.companyCode || "-"}</h2>
            <p className="mt-2 text-sm text-warm-700 dark:text-warm-600">Este codigo se usa para iniciar sesion en esta empresa. No se puede editar desde el panel.</p>
          </div>
          <Button type="button" variant="outline" icon={Copy} onClick={copyCompanyCode} disabled={!form.companyCode}>Copiar codigo</Button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">Logo empresarial</h2>
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <div className="grid min-h-36 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo de empresa" className="max-h-28 max-w-full object-contain" />
            ) : (
              <p className="text-center text-sm text-slate-500">Sin logo cargado</p>
            )}
          </div>
          <div className="space-y-3">
            <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={selectLogo} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:font-semibold file:text-white" />
            <p className="text-sm text-slate-500">PNG, JPG, JPEG o WEBP. Tamano maximo 2MB.</p>
            <Button onClick={uploadLogo} loading={uploadingLogo}>Subir logo</Button>
            <FormField label="Logo URL manual" value={form.logoUrl || ""} onChange={(value)=>{ setForm({...form, logoUrl:value}); setLogoPreview(getLogoSrc(value)); }} helper="Opcional. La subida de archivo es la opcion recomendada." />
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-soft md:grid-cols-2">
        {fields.map(([key,label]) => (
          <FormField key={key} label={label} type={key==="defaultTaxRate"?"number":"text"} value={form[key] || ""} onChange={(value)=>setForm({...form,[key]:value})} required={key==="businessName"} />
        ))}
      </section>
      <Button type="submit" loading={saving}>Guardar</Button>
    </form>
  );
}
