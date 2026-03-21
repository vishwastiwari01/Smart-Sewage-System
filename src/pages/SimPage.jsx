import { useState } from "react";
import { useSimulation } from "../hooks/useSimulation";
import Sparkline from "../components/common/Sparkline";
import { LEVEL_LIMIT, GAS_LIMIT, statusColor } from "../data/mockData";

const SCENARIOS = [
  { id:"normal",   label:"Normal Operation",     tag:"Normal",   tagCls:"bg-green-50 text-green-700",   desc:"All sensors safe. Pump running." },
  { id:"warning",  label:"Rising Level Warning",  tag:"Warning",  tagCls:"bg-amber-100 text-amber-700",  desc:"Level approaching 8cm threshold." },
  { id:"overflow", label:"Sewage Overflow",        tag:"Critical", tagCls:"bg-error-container text-on-error-container", desc:"Level exceeds 10cm. MQTT alert." },
  { id:"gas",      label:"Toxic Gas Leak",         tag:"Critical", tagCls:"bg-error-container text-on-error-container", desc:"Gas ADC > 600. Emergency broadcast." },
  { id:"combined", label:"Overflow + Gas",         tag:"Critical", tagCls:"bg-error-container text-on-error-container", desc:"Both sensors critical simultaneously." },
  { id:"recovery", label:"Post-Overflow Recovery", tag:"Recovery", tagCls:"bg-blue-50 text-blue-700",    desc:"Level dropping after pump action." },
];

function statusHex(s) { return s==="CRITICAL"?"#ba1a1a":s==="WARNING"?"#d97706":"#16a34a"; }

export default function SimPage() {
  const { nodes, scenario, setScenario, paused, setPaused, mqttLog } = useSimulation("HYD-OC-107");
  const [manualLevel, setManualLevel] = useState(5);
  const [manualGas,   setManualGas]   = useState(300);
  const [autoMode,    setAutoMode]    = useState(true);

  const target     = nodes.find(n=>n.id==="HYD-OC-107")||nodes[0];
  const level      = autoMode ? target.level : manualLevel;
  const gas        = autoMode ? target.gas   : manualGas;
  const pump       = level > LEVEL_LIMIT*.8 ? "ON" : level < LEVEL_LIMIT*.4 ? "OFF" : "AUTO";
  const buzzer     = level >= LEVEL_LIMIT || gas >= GAS_LIMIT;
  const levelPct   = Math.min(level/LEVEL_LIMIT*100,100);
  const gasPct     = Math.min(gas/GAS_LIMIT*100,100);
  const levelColor = levelPct>=100?"#ba1a1a":levelPct>=75?"#d97706":"#16a34a";
  const gasColor   = gasPct  >=100?"#ba1a1a":gasPct  >=75?"#d97706":"#16a34a";

  return (
    <div className="flex h-full overflow-hidden">
      {/* LEFT */}
      <aside className="w-[272px] bg-surface-container-low border-r border-outline-variant/10 overflow-y-auto custom-scrollbar shrink-0">
        <div className="p-4 border-b border-outline-variant/10">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Simulation Scenarios</div>
          {SCENARIOS.map(sc=>(
            <button key={sc.id} onClick={()=>{setScenario(sc.id);setAutoMode(true);}}
              className={`w-full text-left p-3 rounded-xl mb-2 border transition-all ${scenario===sc.id?"border-primary/30 bg-surface-container-lowest shadow-sm":"border-outline-variant/15 bg-surface-container-lowest/50 hover:bg-surface-container-lowest"}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-on-surface">{sc.label}</span>
                <span className={`font-label text-[9px] px-1.5 py-0.5 rounded font-semibold ${sc.tagCls}`}>{sc.tag}</span>
              </div>
              <p className="font-label text-[10px] text-outline">{sc.desc}</p>
            </button>
          ))}
        </div>

        <div className="p-4 border-b border-outline-variant/10">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Manual Override</div>
          {[
            { name:"Sewage Level", unit:"cm",  val:autoMode?level:manualLevel, max:15, step:.1, color:levelColor, set:v=>{setManualLevel(+v);setAutoMode(false);} },
            { name:"Gas ADC",      unit:"ADC", val:autoMode?gas:manualGas,     max:900,step:5,  color:gasColor,   set:v=>{setManualGas(+v);setAutoMode(false);} },
          ].map(s=>(
            <div key={s.name} className="mb-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-on-surface-variant">{s.name}</span>
                <span className="font-label font-bold" style={{ color:s.color }}>{typeof s.val==="number"?s.val.toFixed(s.max===15?1:0):s.val} {s.unit}</span>
              </div>
              <input type="range" min={0} max={s.max} step={s.step} value={s.val}
                onChange={e=>s.set(e.target.value)} className="w-full h-1.5 rounded-full cursor-pointer"
                style={{ accentColor:s.color }}/>
            </div>
          ))}
          {[
            { label:"Auto Simulation", val:autoMode, set:setAutoMode },
            { label:"Pause",           val:paused,   set:setPaused },
          ].map(s=>(
            <div key={s.label} className="flex justify-between items-center py-2.5 border-t border-outline-variant/10">
              <span className="text-xs text-on-surface-variant">{s.label}</span>
              <button onClick={()=>s.set(!s.val)}
                className={`w-9 h-5 rounded-full transition-all relative ${s.val?"bg-primary":"bg-surface-container-high"}`}>
                <span className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${s.val?"left-4":"left-0.5"}`}/>
              </button>
            </div>
          ))}
        </div>

        <div className="p-4">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Network Snapshot</div>
          <div className="grid grid-cols-3 gap-1.5">
            {nodes.slice(0,6).map(n=>(
              <div key={n.id} className="rounded-lg p-2" style={{ background:statusHex(n.status)+"12", border:`1px solid ${statusHex(n.status)}30` }}>
                <div className="font-label text-[9px] text-outline mb-1">{n.id.split("-")[1]}</div>
                <div className="font-label text-sm font-bold" style={{ color:statusHex(n.status) }}>{n.level.toFixed(1)}</div>
                <div className="font-label text-[8.5px] text-outline">cm</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* CENTRE — Wokwi */}
      <div className="flex-1 flex flex-col overflow-hidden bg-surface">
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-lowest border-b border-outline-variant/10 shrink-0">
          <div>
            <div className="text-sm font-bold text-on-surface">ESP32 Wokwi Simulation</div>
            <div className="font-label text-[10px] text-outline mt-0.5">Smart Sewage Monitor v2.0 · Node HYD-OC-107 · Old City</div>
          </div>
          <div className="flex gap-2">
            <a href="https://wokwi.com/projects/454919432469366785" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all">
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>Open in Wokwi
            </a>
            <button onClick={()=>{setScenario("normal");setAutoMode(true);}}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-colors">
              Reset
            </button>
          </div>
        </div>
        <iframe src="https://wokwi.com/projects/454919432469366785" title="ESP32 Simulation"
          className="flex-1 border-none" style={{ background:"#f5f5f5" }}/>
      </div>

      {/* RIGHT */}
      <aside className="w-[260px] bg-surface-container-low border-l border-outline-variant/10 overflow-y-auto custom-scrollbar shrink-0">
        <div className="p-4 border-b border-outline-variant/10">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Live Readings · HYD-OC-107</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { l:"RELAY/PUMP", v:pump,          on:pump==="ON",  okCls:"bg-green-50 border-green-200 text-green-700", offCls:"bg-surface-container border-outline-variant/20 text-outline" },
              { l:"BUZZER",     v:buzzer?"ON":"OFF", on:buzzer,   okCls:"bg-error-container border-red-200 text-on-error-container", offCls:"bg-surface-container border-outline-variant/20 text-outline" },
            ].map(a=>(
              <div key={a.l} className={`p-3 rounded-xl border text-center transition-all ${a.on?a.okCls:a.offCls}`}>
                <div className="font-label text-[9px] uppercase tracking-wider mb-1.5 opacity-70">{a.l}</div>
                <div className="font-label text-sm font-bold">{a.v}</div>
              </div>
            ))}
          </div>

          {[
            { label:"Sewage Level", val:level.toFixed(1), unit:"cm",  pct:levelPct, color:levelColor, limit:`${LEVEL_LIMIT}cm` },
            { label:"Gas Sensor",   val:gas,              unit:"ADC", pct:gasPct,   color:gasColor,   limit:`${GAS_LIMIT} ADC` },
          ].map(g=>(
            <div key={g.label} className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-on-surface-variant">{g.label}</span>
                <span className="font-label font-bold" style={{ color:g.color }}>{g.val} <span className="text-outline font-normal text-[10px]">{g.unit}</span></span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full transition-all" style={{ width:`${g.pct}%`, background:g.color }}/>
              </div>
              <div className="flex justify-between font-label text-[9px] text-outline">
                <span>0</span><span>Limit: {g.limit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-b border-outline-variant/10">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-2">Level History</div>
          <Sparkline data={target.history?.map(h=>h.level)} color={levelColor} threshold={LEVEL_LIMIT} maxY={15} height={64}/>
        </div>

        <div className="p-4 border-b border-outline-variant/10">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-2">Gas History</div>
          <Sparkline data={target.history?.map(h=>h.gas)} color={gasColor} threshold={GAS_LIMIT} maxY={900} height={64}/>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline">MQTT Payloads</div>
            <span className="font-label text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold">LIVE</span>
          </div>
          <div className="bg-surface-container rounded-lg p-3 font-label text-[10px] h-36 overflow-y-auto custom-scrollbar space-y-1">
            {mqttLog.slice(0,20).map(m=>(
              <div key={m.id} style={{ color:m.status==="CRITICAL"?"#ba1a1a":m.status==="WARNING"?"#d97706":"#737686" }}>
                <span className="text-outline">[{m.ts}] </span>
                <span className="text-primary">{m.nodeId?.split("-")[1]}</span>
                {` L:${m.level?.toFixed(1)} G:${m.gas}`}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
