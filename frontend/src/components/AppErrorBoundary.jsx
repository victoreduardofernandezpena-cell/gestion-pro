import { Component } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Button from "./Button";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("Pantalla detenida por un error inesperado", error, info);
    }
  }

  reload = () => {
    window.location.reload();
  };

  goHome = () => {
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-warm-100 px-4 py-10 text-ink transition-colors duration-200 dark:bg-warm-950 dark:text-warm-100">
        <div className="mx-auto max-w-xl rounded-2xl border border-warm-400 bg-warm-50 p-8 text-center shadow-soft dark:border-warm-800 dark:bg-warm-900">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/60">
            <AlertTriangle size={28} />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">Error de pantalla</p>
          <h1 className="mt-2 text-2xl font-semibold">No se pudo mostrar esta seccion</h1>
          <p className="mt-2 text-sm text-warm-700 dark:text-warm-500">Recarga la pagina. Si vuelve a pasar, revisa la accion que estabas realizando y vuelve al dashboard.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button icon={RefreshCw} onClick={this.reload}>Recargar</Button>
            <Button variant="outline" icon={Home} onClick={this.goHome}>Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }
}
