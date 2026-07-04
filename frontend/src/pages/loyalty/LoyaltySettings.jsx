import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormField from "../../components/FormField";
import { getLoyaltySettings, updateLoyaltySettings } from "../../services/loyaltyService";
import { getErrorMessage } from "../../utils/errors";

export default function LoyaltySettings() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmSave, setConfirmSave] = useState(false);

  useEffect(() => {
    getLoyaltySettings().then(setSettings).catch((err) => setError(getErrorMessage(err, "No se pudo cargar configuracion")));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSettings(await updateLoyaltySettings(settings));
      setMessage("Configuracion guardada");
      toast.success("Configuracion de fidelizacion guardada");
      setError("");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo guardar configuracion"));
      setError(getErrorMessage(err, "No se pudo guardar configuracion"));
    }
  };

  if (!settings) return <div className="rounded-lg bg-white p-6 shadow-soft">Cargando configuracion...</div>;

  return (
    <form onSubmit={(event) => { event.preventDefault(); setConfirmSave(true); }} className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Fidelizacion</p>
        <h1 className="text-3xl font-semibold text-slate-950">Configuracion</h1>
      </div>
      <AlertMessage>{error}</AlertMessage>
      {message && <AlertMessage type="success">{message}</AlertMessage>}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <p className="mb-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          Por cada RD${Number(settings.amountPerPoint)} comprados, el cliente gana RD${Number(settings.rewardValue)}.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Monto por recompensa" type="number" min={1} value={settings.amountPerPoint} onChange={(value) => setSettings({ ...settings, amountPerPoint: value })} />
          <FormField label="Valor de recompensa" type="number" min={1} value={settings.rewardValue} onChange={(value) => setSettings({ ...settings, rewardValue: value })} />
          <FormField label="Compra minima" type="number" min={0} value={settings.minimumPurchaseAmount} onChange={(value) => setSettings({ ...settings, minimumPurchaseAmount: value })} />
          <FormField label="Canje minimo" type="number" min={0} value={settings.minimumRedeemAmount} onChange={(value) => setSettings({ ...settings, minimumRedeemAmount: value })} />
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.allowRedeem} onChange={(event) => setSettings({ ...settings, allowRedeem: event.target.checked })} /> Permitir canje</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.isActive} onChange={(event) => setSettings({ ...settings, isActive: event.target.checked })} /> Programa activo</label>
        </div>
        <Button type="submit" className="mt-6">Guardar configuracion</Button>
      </section>
      <ConfirmDialog
        open={confirmSave}
        title="Guardar configuracion"
        message="La nueva regla se aplicara a recompensas futuras. Las transacciones anteriores no cambian."
        confirmText="Guardar"
        variant="primary"
        onCancel={() => setConfirmSave(false)}
        onConfirm={async () => {
          setConfirmSave(false);
          await submit({ preventDefault() {} });
        }}
      />
    </form>
  );
}
