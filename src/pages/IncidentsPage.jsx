import { useState } from "react";
import { INCIDENTS_INITIAL, CREWS } from "../data/mockData";

const SEV_STYLE  = { CRITICAL:"bg-error-container text-on-error-container", WARNING:"bg-amber-100 text-amber-700", LOW:"bg-green-50 text-green-700", INFO:"bg-blue-50 text-blue-700" };
const STAT_STYLE = { IN_PROGRESS:"bg-amber-100 text-amber-700", DISPATCHED:"bg-blue-50 text-blue-700", OPEN:"bg-surface-container text-outline", RESOLVED:"bg-green-50 text-green-700" };
let _id = 2848;

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState(INCIDENTS_INITIAL);
  const [selected,  setSelected]  = useState(incidents[0]);
  const [filter,    setFilter]    = useState("ALL");
  const [showForm,  setShowForm]  = useState(false);
  const [form, setForm] = useState({ location:"", type:"Overflow", severity:"WARNING", description:"" });

  const FILTERS = ["ALL","OPEN","IN_PROGRESS","DISPATCHED","RESOLVED","CRITICAL","WARNING"];
  const filtered = filter==="ALL" ? incidents : incidents.filter(i=>i.status===filter||i.severity===filter);
  const counts   = { open:incidents.filter(i=>i.status==="OPEN").length, active:incidents.filter(i=>["IN_PROGRESS","DISPATCHED"].includes(i.status)).length, critical:incidents.filter(i=>i.severity==="CRITICAL").length, resolved:incidents.filter(i=>i.status==="RESOLVED").length };

  const resolve = id => { setIncidents(p=>p.map(i=>i.id===id?{...i,status:"RESOLVED"}:i)); setSelected(s=>s?.id===id?{...s,status:"RESOLVED"}:s); };
  const assign  = (iid,cid) => { setIncidents(p=>p.map(i=>i.id===iid?{...i,crew:cid,status:"DISPATCHED"}:i)); setSelected(s=>s?.id===iid?{...s,crew:cid,status:"DISPATCHED"}:s); };
  const submit  = () => {
    if (!form.location.trim()) return;
    const inc = { id:`INC-${_id++}`, node:"HYD-OC-107", ...form, status:"OPEN", crew:null, reported:new Date().toLocaleTimeString("en-IN",{hour12:false}).slice(0,5), eta:null };
    setIncidents(p=>[inc,...p]); setSelected(inc); setShowForm(false);
    setForm({ location:"", type:"Overflow", severity:"WARNING", description:"" });
  };

  const TL = [
    { text:"Sensor detected abnormal reading", done:true },
    { text:"System validated & created incident", done:true },
    { text:"Maintenance crew dispatched", done:!!selected?.crew },
    { text:"Crew arrived on site", done:selected?.status==="IN_PROGRESS" },
    { text:"Incident resolved", done:selected?.status==="RESOLVED" },
  ];

  return (
    <div style={{ flex:1, minHeight:0, display:'flex', overflow:'hidden' }}>
      {/* Main list */}
      <div className="flex-1 flex flex-col overflow-hidden bg-surface">
        {/* Stats */}
        <div className="grid grid-cols-4 border-b border-outline-variant/10 shrink-0">
          {[
            { l:"Open",     v:counts.open,     s:"Awaiting crew",  c:"text-on-surface" },
            { l:"Active",   v:counts.active,   s:"In progress",    c:"text-amber-600" },
            { l:"Critical", v:counts.critical, s:"Overflow / Gas", c:"text-error" },
            { l:"Resolved", v:counts.resolved, s:"Closed today",   c:"text-green-600" },
          ].map((s,i)=>(
            <div key={s.l} className={`bg-surface-container-lowest px-5 py-3.5 ${i<3?"border-r border-outline-variant/10":""}`}>
              <div className="font-label text-[9.5px] font-bold uppercase tracking-wider text-outline mb-1">{s.l}</div>
              <div className={`text-2xl font-bold font-label ${s.c}`}>{s.v}</div>
              <div className="font-label text-[9px] text-outline">{s.s}</div>
            </div>
          ))}
        </div>

        {/* Filter + new incident */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low border-b border-outline-variant/10 flex-wrap shrink-0">
          {FILTERS.map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`px-3 py-1 text-[11px] font-medium rounded-lg transition-all
                ${filter===f?"bg-primary text-white shadow-sm":"text-on-surface-variant hover:bg-surface-container-lowest border border-outline-variant/20"}`}>
              {f.replace("_"," ")}
            </button>
          ))}
          <button onClick={()=>setShowForm(s=>!s)} className="ml-auto flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold bg-on-surface text-surface rounded-lg hover:bg-on-surface/90 transition-all">
            <span className="material-symbols-outlined text-[14px]">{showForm?"close":"add"}</span>
            {showForm?"Cancel":"New Incident"}
          </button>
        </div>

        {/* New incident form */}
        {showForm && (
          <div className="px-4 py-3 bg-surface-container-lowest border-b border-outline-variant/10 grid grid-cols-4 gap-3 items-end shrink-0">
            <div>
              <label className="font-label text-[9.5px] uppercase tracking-wider text-outline block mb-1">Location</label>
              <input className="w-full text-sm border border-outline-variant/30 rounded-lg px-3 py-2 bg-surface-container-low outline-none focus:border-primary text-on-surface" placeholder="e.g. Ameerpet · Main Road" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))}/>
            </div>
            <div>
              <label className="font-label text-[9.5px] uppercase tracking-wider text-outline block mb-1">Type</label>
              <select className="w-full text-sm border border-outline-variant/30 rounded-lg px-3 py-2 bg-surface-container-low outline-none text-on-surface" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                {["Overflow","Gas Leak","High Level","Sensor","Maintenance"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="font-label text-[9.5px] uppercase tracking-wider text-outline block mb-1">Severity</label>
              <select className="w-full text-sm border border-outline-variant/30 rounded-lg px-3 py-2 bg-surface-container-low outline-none text-on-surface" value={form.severity} onChange={e=>setForm(p=>({...p,severity:e.target.value}))}>
                {["CRITICAL","WARNING","LOW"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={submit} className="py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">add</span>Create
            </button>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-container-low z-10">
              <tr>
                {["ID","Location","Type","Severity","Status","Crew","Time",""].map(h=>(
                  <th key={h} className="font-label text-[9.5px] font-bold uppercase tracking-wider text-outline py-2.5 px-4 text-left border-b border-outline-variant/10">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inc=>{
                const crew=CREWS.find(c=>c.id===inc.crew);
                return (
                  <tr key={inc.id} onClick={()=>setSelected(inc)} className={`border-b border-outline-variant/10 cursor-pointer hover:bg-surface-container-low transition-colors ${selected?.id===inc.id?"bg-primary/5":""}`}>
                    <td className="py-2.5 px-4"><span className="font-label text-[10.5px] text-primary">{inc.id}</span></td>
                    <td className="py-2.5 px-4">
                      <div className="text-xs font-semibold text-on-surface">{inc.location.split("·")[0].trim()}</div>
                      <div className="font-label text-[9.5px] text-outline">{inc.node}</div>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-on-surface-variant">{inc.type}</td>
                    <td className="py-2.5 px-4"><span className={`font-label text-[9px] px-1.5 py-0.5 rounded font-semibold ${SEV_STYLE[inc.severity]||""}`}>{inc.severity}</span></td>
                    <td className="py-2.5 px-4"><span className={`font-label text-[9px] px-1.5 py-0.5 rounded font-semibold ${STAT_STYLE[inc.status]||""}`}>{inc.status.replace("_"," ")}</span></td>
                    <td className="py-2.5 px-4 text-xs">{crew?crew.name.split(" ")[0]:<span className="text-outline">—</span>}</td>
                    <td className="py-2.5 px-4 font-label text-[10px] text-outline">{inc.reported}</td>
                    <td className="py-2.5 px-4" onClick={e=>e.stopPropagation()}>
                      {inc.status!=="RESOLVED" && (
                        <button onClick={()=>resolve(inc.id)} className="text-[10px] px-2.5 py-1 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-500 hover:text-white transition-all font-medium">
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT detail panel */}
      <aside className="w-[320px] bg-surface-container-low border-l border-outline-variant/10 overflow-y-auto custom-scrollbar shrink-0">
        {selected ? (
          <>
            <div className="p-4 bg-surface-container-lowest border-b border-outline-variant/10">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-label text-[10px] text-outline mb-1">{selected.id}</div>
                  <div className="text-sm font-bold text-on-surface">{selected.type}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">{selected.location}</div>
                </div>
                <div className="flex flex-col gap-1.5 items-end">
                  <span className={`font-label text-[9px] px-1.5 py-0.5 rounded font-semibold ${SEV_STYLE[selected.severity]||""}`}>{selected.severity}</span>
                  <span className={`font-label text-[9px] px-1.5 py-0.5 rounded font-semibold ${STAT_STYLE[selected.status]||""}`}>{selected.status.replace("_"," ")}</span>
                </div>
              </div>
              <div className="bg-surface-container text-xs text-on-surface-variant rounded-lg p-3 leading-relaxed mb-4">{selected.description||"No description."}</div>
              <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Timeline</div>
              <div className="pl-4 relative">
                {TL.map((step,i)=>(
                  <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                    <div className={`absolute -left-4 top-0.5 w-2.5 h-2.5 rounded-full border-2 ${step.done?"border-green-500 bg-green-50":"border-outline-variant bg-surface-container"}`}/>
                    {i<TL.length-1 && <div className="absolute -left-3.5 top-3 w-0.5 h-full bg-outline-variant/30"/>}
                    <p className={`text-xs leading-relaxed ${step.done?"text-on-surface font-medium":"text-outline"}`}>{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-b border-outline-variant/10">
              <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Assign Crew</div>
              {CREWS.map(crew=>(
                <div key={crew.id} className={`p-3 rounded-xl mb-2 cursor-pointer transition-all border ${selected.crew===crew.id?"border-primary/30 bg-primary/5":"border-outline-variant/15 bg-surface-container-lowest hover:bg-surface-container-low"} ${crew.status==="ON_SITE"&&selected.crew!==crew.id?"opacity-40":""}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs font-semibold text-on-surface">{crew.name}</div>
                      <div className="font-label text-[9.5px] text-outline">Team {crew.team} · {crew.exp}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`font-label text-[9px] px-1.5 py-0.5 rounded font-semibold ${crew.status==="ON_SITE"?"bg-error-container text-on-error-container":crew.status==="DISPATCHED"?"bg-amber-100 text-amber-700":crew.status==="RESOLVED"?"bg-green-50 text-green-700":"bg-surface-container text-outline"}`}>
                        {crew.status.replace("_"," ")}
                      </span>
                      {selected.crew===crew.id
                        ? <span className="font-label text-[9px] text-primary font-semibold">✓ Assigned</span>
                        : crew.status==="STANDBY"
                          ? <button onClick={()=>assign(selected.id,crew.id)} className="font-label text-[9px] px-2 py-0.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all">Assign</button>
                          : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 flex gap-2">
              <button className="flex-1 py-2 text-xs font-medium rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-colors">Export PDF</button>
              {selected.status!=="RESOLVED" && (
                <button onClick={()=>resolve(selected.id)} className="flex-1 py-2 text-xs font-medium rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-500 hover:text-white transition-all">
                  ✓ Mark Resolved
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="p-4 font-label text-[10.5px] text-outline">Select an incident to view details.</div>
        )}
      </aside>
    </div>
  );
}
