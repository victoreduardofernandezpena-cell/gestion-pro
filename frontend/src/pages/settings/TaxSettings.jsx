import { useEffect, useState } from "react";
import { Edit2, Star, ToggleLeft, ToggleRight } from "lucide-react";
import AlertMessage from "../../components/AlertMessage";
import DataTable from "../../components/DataTable";
import FormField from "../../components/FormField";
import { changeTaxStatus, createTax, getTaxes, setDefaultTax, updateTax } from "../../services/settingsService";
import { getErrorMessage } from "../../utils/errors";

const empty = { name: "", rate: 18, description: "", isDefault: false };
export default function TaxSettings() {
  const [rows,setRows]=useState([]),[form,setForm]=useState(empty),[editing,setEditing]=useState(null),[error,setError]=useState("");
  const load=()=>getTaxes().then(setRows).catch((err)=>setError(getErrorMessage(err,"No fue posible cargar impuestos")));
  useEffect(()=>{load();},[]);
  const submit=async(e)=>{e.preventDefault();setError("");if(!form.name.trim())return setError("El nombre es obligatorio");if(Number(form.rate)<0)return setError("La tasa no puede ser negativa");try{editing?await updateTax(editing,form):await createTax(form);setForm(empty);setEditing(null);load();}catch(err){setError(getErrorMessage(err,"No fue posible guardar impuesto"));}};
  const columns=[{key:"name",header:"Nombre",className:"font-medium"},{key:"rate",header:"Tasa",render:r=>`${Number(r.rate)}%`},{key:"description",header:"Descripcion"},{key:"isDefault",header:"Default",render:r=>r.isDefault?"Si":"No"},{key:"isActive",header:"Estado",render:r=>r.isActive?"Activo":"Inactivo"},{key:"actions",header:"Acciones",align:"right",render:r=><div className="flex justify-end gap-2"><button onClick={()=>{setEditing(r.id);setForm({name:r.name,rate:Number(r.rate),description:r.description||"",isDefault:r.isDefault});}} className="rounded-lg border p-2"><Edit2 size={16}/></button><button onClick={()=>setDefaultTax(r.id).then(load)} className="rounded-lg border p-2"><Star size={16}/></button><button onClick={()=>changeTaxStatus(r.id,!r.isActive).then(load)} className="rounded-lg border p-2">{r.isActive?<ToggleRight size={16}/>:<ToggleLeft size={16}/>}</button></div>}];
  return <div className="space-y-6"><div><p className="text-sm font-semibold uppercase tracking-wide text-accent">Configuracion</p><h1 className="text-3xl font-semibold">Impuestos</h1></div><AlertMessage>{error}</AlertMessage><section className="grid gap-6 xl:grid-cols-[360px_1fr]"><form onSubmit={submit} className="rounded-lg border bg-white p-5 shadow-soft"><h2 className="mb-4 font-semibold">{editing?"Editar":"Crear"} impuesto</h2><FormField label="Nombre" value={form.name} onChange={v=>setForm({...form,name:v})} required/><FormField label="Tasa" type="number" min={0} value={form.rate} onChange={v=>setForm({...form,rate:v})} required/><FormField label="Descripcion" value={form.description} onChange={v=>setForm({...form,description:v})}/><label className="mb-4 flex gap-2 text-sm"><input type="checkbox" checked={form.isDefault} onChange={e=>setForm({...form,isDefault:e.target.checked})}/> Default</label><button className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">Guardar</button></form><DataTable columns={columns} rows={rows} minWidth="860px" emptyTitle="Sin impuestos"/></section></div>;
}
