import { useState, useEffect } from "react";
import { PREDICTIONS, genSpark } from "../data/mockData";
import Sparkline from "../components/common/Sparkline";

const MODELS = {
  LSTM:    { name:"LSTM Neural Network",  acc:"91.4%", desc:"Trained on 18 months of sensor history. Best for temporal flow patterns." },
  XGBoost: { name:"XGBoost Classifier",   acc:"88.7%", desc:"Gradient boosting on 42 engineered features including rainfall and gas trends." },
  Prophet: { name:"Facebook Prophet",     acc:"86.2%", desc:"Time-series decomposition with seasonality and external rainfall regressors." },
};

function statusHex(p) { return p>=80?"#ba1a1a":p>=50?"#d97706":"#16a34a"; }
function statusBg(p)  { return p>=80?"bg-error-container text-on-error-container":p>=50?"bg-amber-100 text-amber-700":"bg-green-50 text-green-700"; }

function Ring({ pct, size=100 }) {
  const color = statusHex(pct);
  const r = size/2 - 9, circ = 2*Math.PI*r, dash = Math.min(pct/100,1)*circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#eeeeee" strokeWidth="8"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={circ*.25} strokeLinecap="round"
        style={{ transition:"stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}/>
      <text x={size/2} y={size/2+6} textAnchor="middle" fill={color}
        fontSize={size>80?15:12} fontWeight="800" fontFamily="'JetBrains Mono',monospace">{pct}%</text>
    </svg>
  );
}

export default function AIPage() {
  const [model,    setModel]    = useState("LSTM");
  const [selected, setSelected] = useState(PREDICTIONS[0]);
  const [forecast, setForecast] = useState([]);
  const [running,  setRunning]  = useState(false);

  useEffect(() => { setForecast(genSpark(selected.probability, 14, 24)); }, [selected, model]);

  function runModel() { setRunning(true); setTimeout(()=>setRunning(false), 1800); }

  const p     = selected;
  const color = statusHex(p.probability);

  return (
    <div className="flex h-full overflow-hidden">
      {/* LEFT */}
      <aside className="w-[268px] bg-surface-container-low border-r border-outline-variant/10 overflow-y-auto custom-scrollbar shrink-0">
        <div className="p-4 border-b border-outline-variant/10">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">AI Model</div>
          {Object.entries(MODELS).map(([key,m]) => (
            <div key={key} onClick={()=>setModel(key)}
              className={`p-3 rounded-xl mb-2 cursor-pointer transition-all border ${model===key?"border-primary/30 bg-primary/5":"border-outline-variant/15 bg-surface-container-lowest hover:bg-surface-container-low"}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-on-surface">{m.name}</span>
                <span className={`font-label text-[9px] px-1.5 py-0.5 rounded font-semibold ${model===key?"bg-primary text-white":"bg-surface-container text-outline"}`}>{m.acc}</span>
              </div>
              <p className="font-label text-[10px] text-outline leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="p-4">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Overflow Risk — All Nodes</div>
          {PREDICTIONS.map(pr => {
            const c = statusHex(pr.probability);
            return (
              <div key={pr.node} onClick={()=>setSelected(pr)}
                className={`p-3 rounded-xl mb-2 cursor-pointer transition-all border ${selected.node===pr.node?"border-primary/30 bg-primary/5":"border-outline-variant/15 bg-surface-container-lowest hover:bg-surface-container-low"}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-on-surface">{pr.location}</span>
                  <span className="font-label text-sm font-bold" style={{ color:c }}>{pr.probability}%</span>
                </div>
                <div className="h-1 bg-surface-container rounded-full overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all" style={{ width:`${pr.probability}%`, background:c }}/>
                </div>
                <div className="flex justify-between font-label text-[9.5px] text-outline">
                  <span>{pr.trend==="rising"?"↑ Rising":pr.trend==="falling"?"↓ Falling":"→ Stable"}</span>
                  <span>ETA {pr.hoursLeft<1?`${Math.round(pr.hoursLeft*60)}min`:`${pr.hoursLeft}h`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* CENTRE */}
      <section className="flex-1 overflow-y-auto custom-scrollbar bg-surface">
        <div className="flex items-center justify-between px-5 py-3 bg-surface-container-lowest border-b border-outline-variant/10 sticky top-0 z-10">
          <div>
            <div className="text-sm font-bold text-on-surface">Overflow Risk Prediction</div>
            <div className="font-label text-[10px] text-outline mt-0.5">
              {MODELS[model].name} · Confidence: <span className={`font-semibold ${p.confidence==="HIGH"?"text-error":p.confidence==="MEDIUM"?"text-amber-600":"text-green-600"}`}>{p.confidence}</span> · Updated {p.lastUpdated}
            </div>
          </div>
          <button onClick={runModel} disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60">
            {running
              ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Running…</>
              : <><span className="material-symbols-outlined text-[15px]">play_arrow</span>Run Prediction</>}
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Main card */}
          <div className={`bg-surface-container-lowest rounded-2xl border-l-4 p-5 border border-outline-variant/10`}
            style={{ borderLeftColor:color }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-label text-[9.5px] text-outline uppercase tracking-wider mb-2">{model} PREDICTION · {p.node}</div>
                <div className="text-lg font-bold text-on-surface mb-4">📍 {p.location}</div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { l:"Overflow Risk",      v:`${p.probability}%`,     c:color },
                    { l:"Time to Overflow",   v:p.hoursLeft<1?`${Math.round(p.hoursLeft*60)}min`:`${p.hoursLeft}h`, c:color },
                    { l:"Rainfall Forecast",  v:`${p.rainfall}mm/hr`,    c:"#004ac6" },
                  ].map(r => (
                    <div key={r.l} className="bg-surface-container rounded-xl p-3">
                      <div className="font-label text-[9px] text-outline uppercase tracking-wider mb-1">{r.l}</div>
                      <div className="text-xl font-bold font-label" style={{ color:r.c }}>{r.v}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-3 text-sm leading-relaxed font-medium"
                  style={{ background:color+"15", color, border:`1px solid ${color}30` }}>
                  <strong>AI Recommendation: </strong>
                  {p.probability>=80?"IMMEDIATE ACTION — Dispatch crew now. Activate backup pump. Issue public advisory.":
                   p.probability>=50?"ELEVATED RISK — Schedule inspection within 2 hours. Monitor closely.":
                   "LOW RISK — Continue standard monitoring."}
                </div>
              </div>
              <Ring pct={p.probability} size={104}/>
            </div>
          </div>

          {/* Forecast sparkline */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant/10">
              <div className="text-xs font-semibold text-on-surface">24-Hour Risk Forecast</div>
              <div className="font-label text-[10px] text-outline">{p.location} · {model}</div>
            </div>
            <div className="p-4">
              <Sparkline data={forecast} color={color} threshold={80} maxY={100} height={88}/>
              <div className="flex justify-between font-label text-[9.5px] text-outline mt-1">
                <span>Now</span><span>+24 hours</span>
              </div>
            </div>
          </div>

          {/* Feature importance */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant/10">
              <div className="text-xs font-semibold text-on-surface">Model Feature Importance</div>
              <div className="font-label text-[10px] text-outline">{model} — top 5 inputs</div>
            </div>
            <div className="p-4 space-y-3">
              {[
                { f:"Historical Sewage Level (7-day rolling)", w:0.34, c:"#004ac6" },
                { f:"IMD Rainfall Forecast (next 6h)",         w:0.28, c:"#d97706" },
                { f:"Gas Concentration Trend",                 w:0.18, c:"#6a1edb" },
                { f:"Ambient Temperature + Season",            w:0.12, c:"#006780" },
                { f:"Time of Day + Day of Week",               w:0.08, c:"#16a34a" },
              ].map(f => (
                <div key={f.f}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-on-surface-variant">{f.f}</span>
                    <span className="font-label font-semibold" style={{ color:f.c }}>{(f.w*100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${f.w*100}%`, background:f.c }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT */}
      <aside className="w-[256px] bg-surface-container-low border-l border-outline-variant/10 overflow-y-auto custom-scrollbar shrink-0">
        <div className="p-4 border-b border-outline-variant/10">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Model Performance</div>
          {[
            { l:"Accuracy",      v:MODELS[model].acc, c:"text-green-600" },
            { l:"Precision",     v:"89.3%",   c:"text-primary" },
            { l:"Recall",        v:"93.1%",   c:"text-amber-600" },
            { l:"F1 Score",      v:"91.2%",   c:"text-purple-600" },
            { l:"MAE",           v:"0.42 cm", c:"text-on-surface" },
            { l:"Training data", v:"18 months",c:"text-on-surface" },
            { l:"Inference",     v:"<200ms",  c:"text-on-surface" },
          ].map(r => (
            <div key={r.l} className="flex justify-between py-1.5 border-b border-outline-variant/10 last:border-0">
              <span className="text-xs text-on-surface-variant">{r.l}</span>
              <span className={`font-label text-[10.5px] font-semibold ${r.c}`}>{r.v}</span>
            </div>
          ))}
        </div>

        <div className="p-4 border-b border-outline-variant/10">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Recommended Actions</div>
          {(p.probability>=80?[
            { icon:"warning",      text:"Dispatch crew — critical priority" },
            { icon:"water",        text:"Activate backup pump relay" },
            { icon:"campaign",     text:"Issue public SMS advisory" },
            { icon:"call",         text:"Notify GHMC control room" },
            { icon:"fence",        text:"Prepare flood barrier" },
          ]:p.probability>=50?[
            { icon:"schedule",     text:"Schedule crew inspection (2h)" },
            { icon:"sensors",      text:"Increase sensor polling rate" },
            { icon:"chat",         text:"Alert ward councillor" },
          ]:[
            { icon:"check_circle", text:"Continue standard monitoring" },
            { icon:"data_usage",   text:"Log data for model training" },
          ]).map((a,i) => (
            <div key={i} className="flex items-center gap-2.5 py-2 border-b border-outline-variant/10 last:border-0">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{a.icon}</span>
              <span className="text-xs text-on-surface">{a.text}</span>
            </div>
          ))}
        </div>

        <div className="p-4">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Risk Overview — All Nodes</div>
          <div className="grid grid-cols-3 gap-2">
            {PREDICTIONS.map(pr => (
              <div key={pr.node} onClick={()=>setSelected(pr)} className="flex flex-col items-center gap-1 cursor-pointer">
                <Ring pct={pr.probability} size={58}/>
                <div className="font-label text-[9px] text-outline text-center leading-tight">{pr.location.split(" ")[0]}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
