import { useState } from "react";
import { useSimulation } from "../hooks/useSimulation";
import { CREWS } from "../data/mockData";

const GAS_THRESHOLDS = [
  { gas:"Hydrogen Sulfide (H₂S)", icon:"cloud",          safe:10,  warn:50,   crit:100,  unit:"ppm" },
  { gas:"Methane (CH₄)",          icon:"air",             safe:500, warn:1000, crit:5000, unit:"ppm" },
  { gas:"Ammonia (NH₃)",          icon:"scatter_plot",    safe:25,  warn:50,   crit:300,  unit:"ppm" },
  { gas:"Carbon Monoxide (CO)",   icon:"warning",         safe:50,  warn:100,  crit:400,  unit:"ppm" },
];

const PPE = [
  { id:"mask",    label:"Full-face Gas Mask (NIOSH)",        mandatory:true  },
  { id:"suit",    label:"Chemical-resistant Protective Suit", mandatory:true  },
  { id:"harness", label:"Safety Harness & Lifeline",          mandatory:true  },
  { id:"fan",     label:"Forced Air Ventilation Fan",          mandatory:true  },
  { id:"meter",   label:"4-Gas Personal Monitor",             mandatory:true  },
  { id:"radio",   label:"Two-way Radio / Emergency Comm",     mandatory:false },
  { id:"buddy",   label:"Buddy System — min. 2 workers",      mandatory:false },
  { id:"permit",  label:"Confined Space Entry Permit",         mandatory:false },
];

const NODE_GAS = {
  "HYD-OC-107": { h2s:89,  ch4:320, nh3:45, co:18 },
  "HYD-MP-203": { h2s:54,  ch4:280, nh3:38, co:22 },
  "HYD-LB-508": { h2s:32,  ch4:210, nh3:21, co:14 },
  "HYD-BH-101": { h2s:8,   ch4:140, nh3:12, co:8  },
};

function gasColor(current, warn, crit) {
  if (current >= crit)  return { text:"text-error",      bg:"bg-error-container",  border:"border-red-200",    hex:"#ba1a1a", label:"CRITICAL" };
  if (current >= warn)  return { text:"text-amber-700",  bg:"bg-amber-100",         border:"border-amber-200",  hex:"#d97706", label:"WARNING"  };
  return                       { text:"text-green-700",  bg:"bg-green-50",          border:"border-green-200",  hex:"#16a34a", label:"SAFE"     };
}

export default function SafetyPage() {
  const { nodes } = useSimulation();
  const [checked,      setChecked]    = useState({});
  const [activeNodeId, setActiveNode] = useState("HYD-OC-107");

  const toggle       = id => setChecked(p => ({ ...p, [id]: !p[id] }));
  const allMandatory = PPE.filter(p => p.mandatory).every(p => checked[p.id]);

  const gasData    = NODE_GAS[activeNodeId] || NODE_GAS["HYD-BH-101"];
  const activeNode = nodes.find(n => n.id === activeNodeId);
  const isDangerous = activeNode?.status === "CRITICAL" || activeNode?.status === "WARNING";
  const gasReadings = [gasData.h2s, gasData.ch4, gasData.nh3, gasData.co];

  return (
    <div style={{ flex:1, minHeight:0, display:'flex', overflow:'hidden' }}>

      {/* ── MAIN ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface flex flex-col">

        {/* Danger banner */}
        {isDangerous && (
          <div className="flex gap-3 items-start p-4 bg-error-container border-l-4 border-error border-b border-red-200 shrink-0">
            <span className="material-symbols-outlined text-error text-2xl shrink-0">do_not_disturb_on</span>
            <div>
              <div className="text-sm font-bold text-error mb-1">
                DANGEROUS CONDITIONS — {activeNode?.name} ({activeNodeId})
              </div>
              <div className="text-xs text-on-surface-variant leading-relaxed">
                Elevated gas levels detected.{" "}
                <strong className="text-amber-700">ALL crew MUST wear full PPE before entering confined space.</strong>{" "}
                Deploy ventilation fan first. Ensure gas readings are below safe thresholds before commencing work.
              </div>
            </div>
          </div>
        )}

        {/* Stat strip */}
        <div className="grid grid-cols-4 border-b border-outline-variant/10 bg-surface-container-lowest shrink-0">
          {[
            { label:"Active Crews",    val:CREWS.filter(c=>c.status!=="STANDBY").length, sub:"In the field",    cls:"text-primary" },
            { label:"Hazardous Nodes", val:nodes.filter(n=>n.status!=="NORMAL").length,  sub:"Gas > threshold", cls:"text-error" },
            { label:"PPE Compliance",  val:"87%",  sub:"This shift",  cls:"text-green-600" },
            { label:"Safety Alerts",   val:3,      sub:"Last 24h",    cls:"text-amber-600" },
          ].map((s,i) => (
            <div key={s.label} className={`px-5 py-3.5 ${i<3?"border-r border-outline-variant/10":""}`}>
              <div className="font-label text-[9.5px] font-bold uppercase tracking-wider text-outline mb-1">{s.label}</div>
              <div className={`text-2xl font-bold font-label ${s.cls}`}>{s.val}</div>
              <div className="font-label text-[9px] text-outline">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="p-4 grid grid-cols-2 gap-4">

          {/* Gas monitoring card */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">science</span>
                <span className="text-xs font-semibold text-on-surface">Toxic Gas Monitoring</span>
              </div>
              <select value={activeNodeId} onChange={e=>setActiveNode(e.target.value)}
                className="font-label text-[10px] border border-outline-variant/30 rounded-lg px-2 py-1 bg-surface-container text-on-surface outline-none">
                {Object.keys(NODE_GAS).map(id => (
                  <option key={id} value={id}>{id.split("-").slice(1).join("-")}</option>
                ))}
              </select>
            </div>
            <div className="p-4 space-y-5">
              {GAS_THRESHOLDS.map((g, i) => {
                const current = gasReadings[i];
                const style   = gasColor(current, g.warn, g.crit);
                const pct     = Math.min((current / g.crit) * 100, 100);
                return (
                  <div key={g.gas}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{g.icon}</span>
                        <div>
                          <div className="text-xs font-semibold text-on-surface">{g.gas}</div>
                          <div className="font-label text-[9.5px] text-outline">
                            Safe &lt;{g.safe} · Warn &lt;{g.warn} · Crit &lt;{g.crit} {g.unit}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-label text-lg font-bold" style={{ color:style.hex }}>{current}</div>
                        <span className={`font-label text-[9px] px-1.5 py-0.5 rounded font-semibold ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden relative">
                      <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:style.hex }}/>
                    </div>
                    {/* Threshold markers */}
                    <div className="relative h-2 mt-0.5">
                      <div className="absolute top-0 w-px h-2 bg-green-500 opacity-60" style={{ left:`${(g.safe/g.crit)*100}%` }}/>
                      <div className="absolute top-0 w-px h-2 bg-amber-500 opacity-60" style={{ left:`${(g.warn/g.crit)*100}%` }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PPE Checklist */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">health_and_safety</span>
                <span className="text-xs font-semibold text-on-surface">Pre-Entry Safety Checklist</span>
              </div>
              <span className={`font-label text-[9px] px-2 py-0.5 rounded-full font-semibold ${allMandatory?"bg-green-50 text-green-700 border border-green-200":"bg-error-container text-on-error-container"}`}>
                {allMandatory ? "✓ CLEARED" : "NOT READY"}
              </span>
            </div>
            <div className="p-4">
              <div className="space-y-1 mb-4">
                {PPE.map(item => (
                  <label key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-surface-container transition-colors">
                    <input type="checkbox" checked={!!checked[item.id]} onChange={()=>toggle(item.id)}
                      className="w-4 h-4 rounded cursor-pointer" style={{ accentColor:item.mandatory?"#ba1a1a":"#004ac6" }}/>
                    <div className="flex-1">
                      <div className={`text-xs font-medium ${checked[item.id]?"text-on-surface line-through opacity-60":"text-on-surface"}`}>
                        {item.label}
                      </div>
                      {item.mandatory && (
                        <div className="font-label text-[9px] text-error mt-0.5">MANDATORY</div>
                      )}
                    </div>
                    {checked[item.id] && (
                      <span className="material-symbols-outlined text-green-600 text-[16px]">check_circle</span>
                    )}
                  </label>
                ))}
              </div>
              <button disabled={!allMandatory}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
                  ${allMandatory
                    ? "bg-green-500 text-white hover:bg-green-600 active:scale-[.99]"
                    : "bg-error-container text-on-error-container cursor-not-allowed opacity-80"}`}>
                <span className="material-symbols-outlined text-[17px]">{allMandatory?"check_circle":"lock"}</span>
                {allMandatory ? "Authorize Entry" : `Complete ${PPE.filter(p=>p.mandatory&&!checked[p.id]).length} mandatory items`}
              </button>
            </div>
          </div>

          {/* Worker cards */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden col-span-2">
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">engineering</span>
                <span className="text-xs font-semibold text-on-surface">Field Worker Safety Status</span>
              </div>
              <div className="font-label text-[10px] text-outline">Real-time PPE + location</div>
            </div>
            <div className="p-4 grid grid-cols-5 gap-3">
              {CREWS.map(crew => {
                const inField = crew.status==="ON_SITE"||crew.status==="DISPATCHED";
                const statusCls = crew.status==="ON_SITE"?"bg-error-container text-on-error-container":crew.status==="DISPATCHED"?"bg-amber-100 text-amber-700":crew.status==="RESOLVED"?"bg-green-50 text-green-700":"bg-surface-container text-outline";
                const emoji = crew.status==="ON_SITE"?"🧑‍🔧":crew.status==="DISPATCHED"?"🚶":crew.status==="RESOLVED"?"✅":"💤";
                return (
                  <div key={crew.id} className="bg-surface-container rounded-xl p-3 text-center">
                    <div className="text-2xl mb-2">{emoji}</div>
                    <div className="text-xs font-semibold text-on-surface mb-1 truncate">{crew.name.split(" ")[0]}</div>
                    <div className="font-label text-[9px] text-outline mb-2 truncate">{crew.task.slice(0,20)}…</div>
                    <span className={`font-label text-[8.5px] px-1.5 py-0.5 rounded font-semibold ${statusCls}`}>
                      {crew.status.replace("_"," ")}
                    </span>
                    {inField && (
                      <div className="mt-2 px-1.5 py-0.5 bg-blue-50 rounded text-[9px] font-label text-blue-700">
                        📟 Gas monitor ON
                      </div>
                    )}
                    <div className="mt-1 font-label text-[9px] text-outline">{crew.exp}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT sidebar ── */}
      <aside className="w-[264px] bg-surface-container-low border-l border-outline-variant/10 overflow-y-auto custom-scrollbar shrink-0">

        <div className="p-4 border-b border-outline-variant/10">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Emergency Contacts</div>
          {[
            { role:"GHMC Control Room",          num:"1800-425-0011", icon:"apartment" },
            { role:"Fire & Emergency",            num:"101",           icon:"local_fire_department" },
            { role:"Poison Control",              num:"1800-116-117",  icon:"emergency" },
            { role:"Site Safety Officer",         num:"+91 94405 78321",icon:"engineering" },
            { role:"Ambulance",                   num:"108",           icon:"ambulance" },
          ].map(c => (
            <div key={c.role} className="flex items-center gap-3 py-2.5 border-b border-outline-variant/10 last:border-0">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-on-surface truncate">{c.role}</div>
                <div className="font-label text-[10.5px] text-primary mt-0.5">{c.num}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-b border-outline-variant/10">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Gas Exposure Protocol</div>
          {[
            { n:1, icon:"directions_run",  text:"Exit confined space immediately" },
            { n:2, icon:"air",             text:"Move upwind to fresh air" },
            { n:3, icon:"checkroom",       text:"Remove contaminated clothing" },
            { n:4, icon:"call",            text:"Call emergency services — 108" },
            { n:5, icon:"do_not_disturb",  text:"Do NOT re-enter until cleared" },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3 py-2.5 border-b border-outline-variant/10 last:border-0">
              <div className="w-5 h-5 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-label text-[9px] font-bold shrink-0 mt-0.5">
                {s.n}
              </div>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0">{s.icon}</span>
              <p className="text-xs text-on-surface leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="p-4">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Today's Safety Log</div>
          {[
            ["Entry Permits Issued","4","text-primary"],
            ["PPE Inspections","12","text-green-600"],
            ["Gas Alerts","3","text-error"],
            ["Near-miss Reports","0","text-green-600"],
            ["Injuries","0","text-green-600"],
            ["Crew Hours Logged","28h","text-on-surface"],
          ].map(([l,v,c]) => (
            <div key={l} className="flex justify-between py-2 border-b border-outline-variant/10 last:border-0">
              <span className="text-xs text-on-surface-variant">{l}</span>
              <span className={`font-label text-[11px] font-bold ${c}`}>{v}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
