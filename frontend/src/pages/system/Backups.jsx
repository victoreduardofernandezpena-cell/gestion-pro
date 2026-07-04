import { Archive, Download, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import DataTable from "../../components/DataTable";
import { createBackup, deleteBackup, downloadBackup, listBackups, restoreBackup } from "../../services/backupService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate } from "../../utils/format";

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

export default function Backups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const loadBackups = async () => {
    try {
      setLoading(true);
      setError("");
      setBackups(await listBackups());
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los backups"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreate = async () => {
    try {
      setActionLoading("create");
      setMessage("");
      const backup = await createBackup();
      setMessage(`Backup creado: ${backup.filename}`);
      toast.success("Backup creado correctamente");
      await loadBackups();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo crear el backup"));
      setError(getErrorMessage(err, "No se pudo crear el backup"));
    } finally {
      setActionLoading("");
    }
  };

  const handleDownload = async (filename) => {
    try {
      setActionLoading(filename);
      await downloadBackup(filename);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo descargar el backup"));
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async (filename) => {
    try {
      setActionLoading(filename);
      await deleteBackup(filename);
      setMessage("Backup eliminado correctamente");
      toast.success("Backup eliminado");
      await loadBackups();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo eliminar el backup"));
      setError(getErrorMessage(err, "No se pudo eliminar el backup"));
    } finally {
      setActionLoading("");
    }
  };

  const handleRestore = async (filename) => {
    const confirmation = window.prompt(`Restaurar ${filename} reemplaza la base de datos actual. Escribe RESTAURAR para continuar.`);
    if (confirmation !== "RESTAURAR") return;
    try {
      setActionLoading(filename);
      await restoreBackup(filename);
    } catch (err) {
      toast.error(getErrorMessage(err, "Restauracion manual requerida por seguridad."));
      setError(getErrorMessage(err, "Restauracion manual requerida por seguridad."));
    } finally {
      setActionLoading("");
    }
  };

  const columns = [
    { key: "filename", header: "Archivo", render: (row) => <span className="font-medium text-slate-900">{row.filename}</span> },
    { key: "size", header: "Tamano", render: (row) => formatBytes(row.size) },
    { key: "createdAt", header: "Fecha", render: (row) => formatDate(row.createdAt) },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={() => handleDownload(row.filename)}>Descargar</Button>
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={() => handleRestore(row.filename)}>Restaurar</Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirmAction({ type: "delete", filename: row.filename })}>Eliminar</Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Sistema</p>
          <h1 className="text-3xl font-semibold text-slate-950">Backups</h1>
        </div>
        <Button onClick={handleCreate} loading={actionLoading === "create"} icon={Archive}>Crear backup</Button>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Restaurar backups automaticamente esta deshabilitado por seguridad. El boton registra el intento y muestra la advertencia correspondiente.
      </div>
      {error && <AlertMessage type="error">{error}</AlertMessage>}
      {message && <AlertMessage type="success">{message}</AlertMessage>}
      {loading ? (
        <p className="text-slate-500">Cargando backups...</p>
      ) : (
        <DataTable columns={columns} rows={backups} minWidth="900px" getRowKey={(row) => row.filename} emptyTitle="Sin backups" emptyDescription="Crea el primer backup desde esta pantalla." />
      )}
      <ConfirmDialog
        open={confirmAction?.type === "delete"}
        title="Eliminar backup"
        message={`Eliminar ${confirmAction?.filename}? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        onCancel={() => setConfirmAction(null)}
        onConfirm={async () => {
          const filename = confirmAction.filename;
          setConfirmAction(null);
          await handleDelete(filename);
        }}
      />
    </div>
  );
}
