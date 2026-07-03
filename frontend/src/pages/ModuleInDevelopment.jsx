import { Wrench } from "lucide-react";

export default function ModuleInDevelopment({ title = "Modulo" }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-soft">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-slate-100 text-slate-600">
        <Wrench size={24} />
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-slate-950">{title}</h1>
      <p className="mt-2 text-slate-500">Modulo en desarrollo.</p>
    </div>
  );
}
