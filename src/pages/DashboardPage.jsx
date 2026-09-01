import { useState, Suspense, lazy } from "react";
import { useSimulation } from "../hooks/useSimulation";
import { useWeather } from "../hooks/useWeather";
import Sparkline from "../components/common/Sparkline";
import { statusBadge, statusColor, LEVEL_LIMIT, GAS_LIMIT, CREWS } from "../data/mockData";

const HyderabadMap = lazy(() => import("../components/common/HyderabadMap"));

function statusHex(s) { return s==="CRITICAL"?"#ba1a1a":s==="WARNING"?"#d97706":"#16a34a"; }
function statusBg(s)  { return s==="CRITICAL"?"bg-error-container text-on-error-container":s==="WARNING"?"bg-amber-100 text-amber-700":"bg-green-50 text-green-700"; }

export default function DashboardPage() {
  const { nodes, critCount, warnCount } = useSimulation();
  const { rainfall, currentWeather, loading: weatherLoading, lastUpdated, floodRisk } = useWeather();
  const [selId, setSelId] = useState(null);
  const sel = selId ? nodes.find(n=>n.id===selId) : null;

  return (
    <div style={{ flex:1, minHeight:0, display:'flex', overflow:'hidden' }}>
      {/* LEFT sidebar */}
      <aside className="w-[232px] bg-surface-container-low flex flex-col border-r border-outline-variant/10 shrink-0">
        <div className="p-3 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
          <div className="flex flex-col">
             <span className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-1">Network</span>
             <span className="text-sm font-bold text-on-surface">{nodes.length} Nodes</span>
          </div>
          <div className="flex gap-1.5">
            {critCount > 0 && <span className="font-label text-[10px] px-2 py-1 bg-error-container text-on-error-container rounded-md font-bold">{critCount} CRIT</span>}
            {warnCount > 0 && <span className="font-label text-[10px] px-2 py-1 bg-amber-100 text-amber-700 rounded-md font-bold">{warnCount} WARN</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 pt-3 pb-1 sticky top-0 bg-surface-container-low z-10">
            <span className="font-label text-[10px] font-bold uppercase tracking-wider text-outline">Live Sensor Nodes</span>
          </div>
          <div className="px-2 pb-2 space-y-1">
            {nodes.map(n => (
              <div key={n.id} onClick={()=>setSelId(n.id===selId?null:n.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all border-l-4
                  ${n.id===selId?"bg-primary/5":"bg-white/50 hover:bg-white"}
                  ${n.status==="CRITICAL"?"border-error":n.status==="WARNING"?"border-amber-500":"border-green-500"}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold text-on-surface truncate">{n.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-label ${statusBg(n.status)}`}>{n.status}</span>
                </div>
                <div className="flex justify-between font-label text-[10px]">
                  <span className="text-outline">{n.level.toFixed(1)} cm water level</span>
                  <span style={{ color: statusHex(n.status) }} className="font-semibold">{Math.round(n.level/LEVEL_LIMIT*100)}%</span>
                </div>
                <div className="mt-1.5 h-0.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width:`${Math.min(n.level/LEVEL_LIMIT*100,100)}%`, background:statusHex(n.status) }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* CENTRE */}
      <section className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-surface">
        {/* Live Weather Strip */}
        <div className="flex items-center gap-3 px-4 py-2 bg-surface-container-lowest border-b border-outline-variant/10 shrink-0 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
            <span className="font-label text-[10px] font-bold text-outline uppercase tracking-wider">Live Weather · Hyderabad</span>
          </div>
          <div className="h-3 w-px bg-outline-variant/30 shrink-0"/>
          {weatherLoading ? (
            <span className="font-label text-[10px] text-outline">Fetching…</span>
          ) : currentWeather ? (
            <>
              <div className="flex items-center gap-1 shrink-0">
                <span className="material-symbols-outlined text-[14px] text-primary">thermostat</span>
                <span className="font-label text-[10.5px] font-semibold text-on-surface">{currentWeather.temp}°C</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="material-symbols-outlined text-[14px] text-outline">air</span>
                <span className="font-label text-[10.5px] text-on-surface-variant">{currentWeather.windspeed} km/h</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="material-symbols-outlined text-[14px] text-outline">humidity</span>
                <span className="font-label text-[10.5px] text-on-surface-variant">{currentWeather.humidity}%</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="material-symbols-outlined text-[14px] text-blue-500">water_drop</span>
                <span className="font-label text-[10.5px] font-semibold text-blue-600">{rainfall[0]?.mm ?? 0}mm rain now</span>
              </div>
              <div className={`font-label text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                floodRisk==='HIGH'?'bg-error-container text-on-error-container':
                floodRisk==='MODERATE'?'bg-amber-100 text-amber-700':
                'bg-green-50 text-green-700'
              }`}>{floodRisk} FLOOD RISK</div>
              {lastUpdated && <span className="font-label text-[9px] text-outline shrink-0">Updated {lastUpdated}</span>}
            </>
          ) : (
            <span className="font-label text-[10px] text-outline">Weather unavailable</span>
          )}
        </div>

        {/* Map */}
        <div className="h-[340px] relative bg-surface-container overflow-hidden shrink-0">
          {/* Overlay chips */}
          <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-2">
            <div className="bg-white/95 backdrop-blur text-xs font-semibold px-3 py-2 rounded-lg shadow border border-outline-variant/20 flex flex-col gap-1.5">
              <span>Hyderabad Sewage Network</span>
              <div className="flex items-center gap-1.5 text-[11px] font-label text-outline">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>
                {nodes.filter(n=>n.status==="NORMAL").length} normal
                {critCount>0 && <><span className="text-outline-variant">·</span><span className="text-error font-semibold">{critCount} critical</span></>}
              </div>
            </div>
          </div>
          <div className="absolute top-3 right-3 z-10 flex gap-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10.5px] font-label shadow-sm border border-outline-variant/20">
            {[["#16a34a","Normal"],["#d97706","Warning"],["#ba1a1a","Critical"]].map(([c,l])=>(
              <span key={l} className="flex items-center gap-1.5 text-outline">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background:c }}/>
                {l}
              </span>
            ))}
          </div>
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-surface-container font-label text-[11px] text-outline">Loading map…</div>}>
            <HyderabadMap nodes={nodes} onNodeClick={n=>setSelId(n.id===selId?null:n.id)} selectedId={selId}/>
          </Suspense>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-4 border-b border-outline-variant/10 shrink-0">
          {[
            { label:"Active Nodes",    val:nodes.length,  sub:"All online",         color:"text-on-surface" },
            { label:"Critical Alerts", val:critCount,     sub:"Overflow / gas",     color:"text-error" },
            { label:"Warnings",        val:warnCount,     sub:"Approaching limit",  color:"text-amber-600" },
            { label:"Pumps Active",    val:nodes.filter(n=>n.pump==="ON").length, sub:"Auto-triggered", color:"text-green-600" },
          ].map((s,i) => (
            <div key={s.label} className={`bg-surface-container-lowest px-5 py-3.5 hover:bg-surface-container transition-colors cursor-default ${i<3?"border-r border-outline-variant/10":""}`}>
              <div className="font-label text-[9.5px] font-semibold uppercase tracking-wider text-outline mb-1.5">{s.label}</div>
              <div className={`text-2xl font-bold font-label ${s.color}`}>{s.val}</div>
              <div className="font-label text-[9px] text-outline mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Node cards grid */}
        <div className="p-4 grid grid-cols-3 gap-3">
          {nodes.slice(0,6).map(n => (
            <div key={n.id} onClick={()=>setSelId(n.id===selId?null:n.id)}
              className={`bg-surface-container-lowest rounded-xl border cursor-pointer transition-all hover:shadow-md
                ${n.id===selId?"border-primary/30 shadow-sm":"border-outline-variant/15"}
                ${n.status==="CRITICAL"?"border-l-4 border-l-error":n.status==="WARNING"?"border-l-4 border-l-amber-500":"border-l-4 border-l-green-500"}`}>
              <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-outline-variant/10">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background:statusHex(n.status) }}/>
                  <span className="font-label text-[10px] font-semibold text-on-surface">{n.id}</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-label font-semibold ${statusBg(n.status)}`}>{n.status}</span>
              </div>
              <div className="p-3">
                <div className="flex flex-col gap-1.5 mb-3">
                  {[
                    { l:"LEVEL", v:`${n.level.toFixed(1)}`, u:"cm", c:statusHex(n.status) },
                    { l:"PUMP",  v:n.pump, u:"", c:n.pump==="ON"?"#16a34a":"#737686" },
                  ].map(r => (
                    <div key={r.l} className="flex justify-between items-end">
                      <div className="font-label text-[9px] text-outline uppercase tracking-wider">{r.l}</div>
                      <div className="font-label text-xs font-bold" style={{ color:r.c }}>{r.v} <span className="text-[9px] text-outline font-normal">{r.u}</span></div>
                    </div>
                  ))}
                </div>
                <Sparkline data={n.history?.map(h=>h.level)} color={statusHex(n.status)} threshold={LEVEL_LIMIT} maxY={15} height={38}/>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RIGHT sidebar */}
      <aside className="w-[256px] bg-surface-container-low border-l border-outline-variant/10 overflow-y-auto custom-scrollbar shrink-0 flex flex-col gap-6 p-5">
        {sel ? (
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-label text-[10px] text-outline mb-1">{sel.id}</div>
                  <div className="text-sm font-bold text-on-surface">{sel.name}</div>
                  <div className="font-label text-[10px] text-outline mt-0.5">{sel.ward} · {sel.area}</div>
                </div>
                <span className={`text-[9px] px-2 py-1 rounded-full font-label font-semibold ${statusBg(sel.status)}`}>{sel.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { l:"Level",  v:`${sel.level.toFixed(1)} cm`, c:statusHex(sel.status) },
                  { l:"Gas",    v:`${sel.gas} ADC`,             c:sel.gas>=GAS_LIMIT?"#ba1a1a":"#1a1c1c" },
                  { l:"Pump",   v:sel.pump,                     c:sel.pump==="ON"?"#16a34a":"#737686" },
                  { l:"Temp",   v:`${sel.temp}°C`,              c:"#1a1c1c" },
                ].map(r => (
                  <div key={r.l} className="bg-surface-container rounded-lg p-2.5">
                    <div className="font-label text-[9px] text-outline uppercase tracking-wide mb-1">{r.l}</div>
                    <div className="font-label text-sm font-bold" style={{ color:r.c }}>{r.v}</div>
                  </div>
                ))}
              </div>
              <div className="font-label text-[9.5px] text-outline mb-2 bg-surface-container rounded px-2 py-1">
                {sel.lat.toFixed(4)}°N · {sel.lng.toFixed(4)}°E
              </div>
              <Sparkline data={sel.history?.map(h=>h.level)} color={statusHex(sel.status)} threshold={LEVEL_LIMIT} maxY={15} height={50}/>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 text-[11px] py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-colors font-medium">History</button>
                <button className="flex-1 text-[11px] py-1.5 rounded-lg bg-error-container text-on-error-container hover:bg-error hover:text-white transition-colors font-medium">Dispatch</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 shadow-sm">
            <p className="font-label text-[10.5px] text-outline leading-relaxed">Click any node on the map to inspect live sensor data.</p>
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-label text-[10px] font-bold uppercase tracking-wider text-outline">Active Alerts</span>
            {critCount>0 && <span className="font-label text-[9px] px-1.5 py-0.5 bg-error-container text-on-error-container rounded font-bold">LIVE</span>}
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-3 shadow-sm">
            {nodes.filter(n=>n.status!=="NORMAL").length===0
              ? <p className="font-label text-[10.5px] text-outline">All nodes operating normally.</p>
              : nodes.filter(n=>n.status!=="NORMAL").map(n => (
                <div key={n.id} onClick={()=>setSelId(n.id===selId?null:n.id)}
                  className="flex gap-2 py-2 border-b border-outline-variant/10 cursor-pointer hover:bg-surface-container-low transition-colors last:border-0">
                  <div className="w-1 rounded-full self-stretch" style={{ background:statusHex(n.status) }}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-on-surface truncate">{n.name}</div>
                    <div className="font-label text-[10px] text-outline mt-0.5">{n.level.toFixed(1)} cm · {n.status === "CRITICAL" ? "Overflow risk" : "Approaching limit"}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
        
        {/* Live Weather Alerts */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-label text-[10px] font-bold uppercase tracking-wider text-outline">Meteorological Alerts</span>
            {rainfall.some(r => r.mm >= 15) ? (
              <span className="font-label text-[9px] px-1.5 py-0.5 bg-error-container text-on-error-container rounded animate-pulse font-bold">LIVE</span>
            ) : (
              <span className="font-label text-[9px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-bold">CLEAR</span>
            )}
          </div>
          {weatherLoading ? (
            <p className="font-label text-[10.5px] text-outline">Fetching latest IMD bulletins...</p>
          ) : rainfall.some(r => r.mm >= 15) ? (
            <div className="bg-error-container/50 border border-error/20 p-3 rounded-xl shadow-sm">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-error text-[16px] mt-0.5">thunderstorm</span>
                <div>
                  <div className="text-xs font-bold text-on-error-container">Heavy Rainfall Advisory</div>
                  <p className="font-label text-[9px] text-on-error-container/80 mt-1 leading-relaxed">
                    IMD Alert: Heavy to very heavy rainfall predicted in the next 0-3 hours. High risk of localized urban flooding. Emergency crews advised to standby.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant/20 p-3 rounded-xl flex gap-2 items-center shadow-sm">
               <span className="material-symbols-outlined text-green-600 text-[16px]">cloud_done</span>
               <p className="font-label text-[10.5px] text-outline">No severe weather warnings for Hyderabad region.</p>
            </div>
          )}
        </div>

        <div>
          <span className="font-label text-[10px] font-bold uppercase tracking-wider text-outline block mb-3">Rainfall Forecast</span>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-3 shadow-sm">
            {rainfall.map(r => (
              <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-outline-variant/10 last:border-0">
                <span className="text-xs text-on-surface-variant">{r.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${Math.min(r.mm/35*100,100)}%`, background:r.color }}/>
                  </div>
                  <span className="font-label text-[10px] font-bold w-9 text-right" style={{ color:r.color }}>{r.mm}mm</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="font-label text-[10px] font-bold uppercase tracking-wider text-outline block mb-3">Field Crews</span>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-3 shadow-sm">
            {CREWS.map(c => (
              <div key={c.id} className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-0">
                <div>
                  <div className="text-xs font-semibold text-on-surface">{c.name}</div>
                  <div className="font-label text-[9.5px] text-outline">Team {c.team}</div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-label font-semibold
                  ${c.status==="ON_SITE"?"bg-error-container text-on-error-container":
                    c.status==="DISPATCHED"?"bg-amber-100 text-amber-700":
                    c.status==="RESOLVED"?"bg-green-50 text-green-700":"bg-surface-container text-outline"}`}>
                  {c.status.replace("_"," ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
