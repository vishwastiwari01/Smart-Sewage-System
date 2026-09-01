import { useState, useEffect } from "react";
import { PREDICTIONS, genSpark } from "../data/mockData";
import { useWeather } from "../hooks/useWeather";
import Sparkline from "../components/common/Sparkline";

const MODELS = {
  LSTM:    { name:"LSTM Neural Network",  acc:"91.4%", desc:"Trained on 18 months of sensor history. Best for temporal flow patterns & rainfall spikes." },
  XGBoost: { name:"XGBoost Classifier",   acc:"88.7%", desc:"Gradient boosting on 42 engineered features. Fast inference, ideal for real-time alerts." },
  Prophet: { name:"Facebook Prophet",     acc:"86.2%", desc:"Time-series decomposition with seasonality. Best for long-range 24h flood outlook." },
};

function riskHex(p)  { return p>=80?"#ba1a1a":p>=50?"#d97706":"#16a34a"; }
function riskBg(p)   { return p>=80?"bg-error-container text-on-error-container":p>=50?"bg-amber-100 text-amber-700":"bg-green-50 text-green-700"; }
function riskLabel(p){ return p>=80?"HIGH RISK":p>=50?"MODERATE":"LOW RISK"; }

function WMOIcon({ code, isDay }) {
  if (code === 0)             return <span className="material-symbols-outlined">wb_sunny</span>;
  if (code <= 3)              return <span className="material-symbols-outlined">partly_cloudy_day</span>;
  if (code <= 48)             return <span className="material-symbols-outlined">foggy</span>;
  if (code <= 67)             return <span className="material-symbols-outlined">rainy</span>;
  if (code <= 77)             return <span className="material-symbols-outlined">weather_snowy</span>;
  if (code <= 82)             return <span className="material-symbols-outlined">rainy</span>;
  if (code <= 99)             return <span className="material-symbols-outlined">thunderstorm</span>;
  return <span className="material-symbols-outlined">cloud</span>;
}

function Ring({ pct, size=100 }) {
  const color = riskHex(pct);
  const r = size/2-9, circ=2*Math.PI*r, dash=Math.min(pct/100,1)*circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#eeeeee" strokeWidth="8"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={circ*.25} strokeLinecap="round"
        style={{ transition:"stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fill={color}
        fontSize={size>80?14:11} fontWeight="800" fontFamily="'JetBrains Mono',monospace">{pct}%</text>
      <text x={size/2} y={size/2+17} textAnchor="middle" fill="#737686"
        fontSize="7" fontFamily="'JetBrains Mono',monospace">RISK</text>
    </svg>
  );
}

export default function AIPage() {
  const [model,    setModel]    = useState("LSTM");
  const [selected, setSelected] = useState(PREDICTIONS[0]);
  const [forecast, setForecast] = useState([]);
  const [running,  setRunning]  = useState(false);
  const [runCount, setRunCount] = useState(0);

  const { rainfall, currentWeather, loading: weatherLoading, lastUpdated, floodRisk } = useWeather();

  useEffect(() => { setForecast(genSpark(selected.probability, 14, 24)); }, [selected, model, runCount]);

  function runModel() {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      // Blend live rainfall into the prediction variance
      const liveRain = rainfall[0]?.mm ?? 0;
      const rainBoost = Math.min(liveRain * 1.5, 15); // live rain pushes risk up
      const variance  = Math.floor(Math.random()*5) - 2 + rainBoost;
      const newProb   = Math.max(0, Math.min(100, selected.probability + variance));
      setSelected(prev => ({
        ...prev,
        probability:  newProb,
        rainfall:     liveRain || prev.rainfall,
        lastUpdated:  new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }),
      }));
      setRunCount(rc => rc+1);
    }, 1800);
  }

  const p     = selected;
  const color = riskHex(p.probability);

  return (
    <div style={{ flex:1, minHeight:0, display:'flex', overflow:'hidden' }}>
      {/* LEFT sidebar */}
      <aside className="w-[268px] bg-surface-container-low border-r border-outline-variant/10 overflow-y-auto custom-scrollbar shrink-0 flex flex-col gap-0">

        {/* Live Weather Card */}
        <div className="m-3 mb-0 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant/10">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
              <span className="font-label text-[10px] font-bold uppercase tracking-wider text-outline">Live Weather · Hyderabad</span>
            </div>
            {lastUpdated && <span className="font-label text-[9px] text-outline">{lastUpdated}</span>}
          </div>
          {weatherLoading ? (
            <div className="p-4 text-center font-label text-[10px] text-outline">Fetching live data…</div>
          ) : currentWeather ? (
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[28px] text-primary">
                    {currentWeather.weathercode <= 3 ? "wb_sunny" :
                     currentWeather.weathercode <= 48 ? "foggy" :
                     currentWeather.weathercode <= 82 ? "rainy" : "thunderstorm"}
                  </span>
                  <div>
                    <div className="text-2xl font-bold text-on-surface">{currentWeather.temp}°C</div>
                    <div className="font-label text-[9px] text-outline">Feels like {(currentWeather.temp - 2).toFixed(1)}°C</div>
                  </div>
                </div>
                <div className={`text-[10px] font-bold px-2 py-1 rounded-lg font-label ${
                  floodRisk === 'HIGH' ? 'bg-error-container text-on-error-container' :
                  floodRisk === 'MODERATE' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-50 text-green-700'
                }`}>
                  {floodRisk} FLOOD RISK
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {[
                  { icon:"air",      label:"Wind",     val:`${currentWeather.windspeed} km/h` },
                  { icon:"humidity", label:"Humidity", val:`${currentWeather.humidity}%` },
                  { icon:"water_drop", label:"Rain Now", val:`${rainfall[0]?.mm ?? 0}mm` },
                  { icon:"schedule", label:"Updated",  val: lastUpdated || "--" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5 bg-surface-container rounded-lg px-2 py-1.5">
                    <span className="material-symbols-outlined text-[13px] text-outline">{s.icon}</span>
                    <div>
                      <div className="font-label text-[8px] text-outline uppercase">{s.label}</div>
                      <div className="font-semibold text-on-surface text-[10px]">{s.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 font-label text-[10px] text-outline">Weather unavailable</div>
          )}
        </div>

        {/* 0-3 hr Nowcast */}
        <div className="m-3 mb-0 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-outline-variant/10">
            <span className="font-label text-[10px] font-bold uppercase tracking-wider text-outline">0–3 Hr Rainfall Nowcast</span>
          </div>
          <div className="p-3 space-y-1.5">
            {rainfall.map(r => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="font-label text-[9px] text-outline w-10 shrink-0">{r.label}</span>
                <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width:`${Math.min(r.mm/30*100,100)}%`, background:r.color }}/>
                </div>
                <div className="flex items-center gap-1.5 w-20 shrink-0">
                  <span className="font-label text-[9px] font-bold w-8 text-right" style={{ color:r.color }}>{r.mm}mm</span>
                  <span className="font-label text-[8px] text-outline bg-surface-container px-1 py-0.5 rounded">{r.prob}%</span>
                </div>
              </div>
            ))}
            <div className="font-label text-[8.5px] text-outline pt-1">Source: Open-Meteo · IMD-calibrated</div>
          </div>
        </div>

        {/* AI Model selector */}
        <div className="p-3">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-2">AI Model</div>
          {Object.entries(MODELS).map(([key,m]) => (
            <div key={key} onClick={() => setModel(key)}
              className={`p-3 rounded-xl mb-2 cursor-pointer transition-all border ${model===key?"border-primary/30 bg-primary/5":"border-outline-variant/15 bg-surface-container-lowest hover:bg-surface-container-low"}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-on-surface">{m.name}</span>
                <span className={`font-label text-[9px] px-1.5 py-0.5 rounded font-semibold ${model===key?"bg-primary text-white":"bg-surface-container text-outline"}`}>{m.acc}</span>
              </div>
              <p className="font-label text-[9.5px] text-outline leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>

        {/* Overflow Risk — All Nodes */}
        <div className="px-3 pb-3">
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-2">Flood Risk — All Zones</div>
          {PREDICTIONS.map(pr => {
            const c = riskHex(pr.probability);
            return (
              <div key={pr.node} onClick={() => setSelected(pr)}
                className={`p-3 rounded-xl mb-1.5 cursor-pointer transition-all border ${selected.node===pr.node?"border-primary/30 bg-primary/5":"border-outline-variant/15 bg-surface-container-lowest hover:bg-surface-container-low"}`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-on-surface">{pr.location}</span>
                  <span className="font-label text-sm font-bold" style={{ color:c }}>{pr.probability}%</span>
                </div>
                <div className="h-1.5 bg-surface-container rounded-full overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all" style={{ width:`${pr.probability}%`, background:c }}/>
                </div>
                <div className="flex justify-between font-label text-[9px] text-outline">
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
        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 py-3 bg-surface-container-lowest border-b border-outline-variant/10 sticky top-0 z-10">
          <div>
            <div className="text-sm font-bold text-on-surface">Urban Flood Nowcasting System</div>
            <div className="font-label text-[10px] text-outline mt-0.5">
              {MODELS[model].name} · Confidence: <span className={`font-semibold ${p.confidence==="HIGH"?"text-error":p.confidence==="MEDIUM"?"text-amber-600":"text-green-600"}`}>{p.confidence}</span>
              {" · "} Updated {p.lastUpdated}
              {!weatherLoading && lastUpdated && <span className="ml-2 text-green-600">· Live weather {lastUpdated}</span>}
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

          {/* Live Weather Alert Banner — shown when risk is not LOW */}
          {!weatherLoading && floodRisk !== 'LOW' && (
            <div className={`rounded-xl p-4 flex items-start gap-3 border ${
              floodRisk === 'HIGH'
                ? 'bg-error-container/40 border-error/30'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <span className={`material-symbols-outlined text-[22px] mt-0.5 ${floodRisk==='HIGH'?'text-error':'text-amber-600'}`}>
                {floodRisk==='HIGH'?'thunderstorm':'water_drop'}
              </span>
              <div>
                <div className={`text-sm font-bold ${floodRisk==='HIGH'?'text-on-error-container':'text-amber-800'}`}>
                  IMD / Open-Meteo Live Alert — {floodRisk} Flood Risk Detected
                </div>
                <p className={`font-label text-[10px] mt-1 leading-relaxed ${floodRisk==='HIGH'?'text-on-error-container/80':'text-amber-700'}`}>
                  {floodRisk==='HIGH'
                    ? `Heavy rainfall expected (${Math.max(...rainfall.map(r=>r.mm))}mm/hr peak). Drainage networks at risk of surcharge. Emergency crews should be on standby. Road closures likely in low-lying zones.`
                    : `Moderate rainfall forecast (${Math.max(...rainfall.map(r=>r.mm))}mm/hr peak). Monitor Old City, Mehdipatnam and LB Nagar drains closely. Pump stations should be pre-activated.`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Main prediction card */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden shadow-sm" style={{ borderLeft:`4px solid ${color}` }}>
            <div className="flex items-start gap-4 p-5">
              <div className="flex-1">
                <div className="font-label text-[9.5px] text-outline uppercase tracking-wider mb-2">{model} · {p.node}</div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[18px]" style={{ color }}>location_on</span>
                  <span className="text-lg font-bold text-on-surface">{p.location}</span>
                  <span className={`font-label text-[9px] px-2 py-0.5 rounded-full font-bold ${riskBg(p.probability)}`}>{riskLabel(p.probability)}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { l:"Overflow Risk",    v:`${p.probability}%`,   c:color, icon:"warning" },
                    { l:"Time to Overflow", v:p.hoursLeft<1?`${Math.round(p.hoursLeft*60)}min`:`${p.hoursLeft}h`, c:color, icon:"timer" },
                    { l:"Live Rainfall",    v:`${rainfall[0]?.mm ?? p.rainfall}mm/hr`, c:"#004ac6", icon:"water_drop" },
                  ].map(r => (
                    <div key={r.l} className="bg-surface-container rounded-xl p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="material-symbols-outlined text-[12px] text-outline">{r.icon}</span>
                        <div className="font-label text-[8.5px] text-outline uppercase tracking-wider">{r.l}</div>
                      </div>
                      <div className="text-xl font-bold font-label" style={{ color:r.c }}>{r.v}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-3.5 text-sm leading-relaxed font-medium flex items-start gap-2"
                  style={{ background:color+"15", border:`1px solid ${color}30` }}>
                  <span className="material-symbols-outlined text-[16px] mt-0.5" style={{ color }}>smart_toy</span>
                  <div style={{ color }}>
                    <strong>AI Recommendation: </strong>
                    {p.probability>=80?"IMMEDIATE ACTION — Dispatch crew now. Activate backup pump. Issue public advisory.":
                     p.probability>=50?"ELEVATED RISK — Schedule inspection within 2 hours. Monitor closely.":
                     "LOW RISK — Continue standard monitoring. No immediate action required."}
                  </div>
                </div>
              </div>
              <Ring pct={p.probability} size={108}/>
            </div>
          </div>

          {/* 0–3 Hour Nowcast Grid */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden shadow-sm">
            <div className="flex justify-between items-center px-5 py-3 border-b border-outline-variant/10">
              <div>
                <div className="text-xs font-bold text-on-surface">0–3 Hour Street-Level Inundation Nowcast</div>
                <div className="font-label text-[9.5px] text-outline mt-0.5">Coupled rainfall × drainage capacity model · Live data</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
                <span className="font-label text-[9px] text-outline">Open-Meteo LIVE</span>
              </div>
            </div>
            <div className="p-4 grid grid-cols-4 gap-3">
              {PREDICTIONS.map(pr => {
                // Blend live rainfall into street-level depth estimation
                const liveRainFactor = (rainfall[0]?.mm || 0) / 10;
                const estimatedDepth = ((pr.probability / 100) * 18 * (1 + liveRainFactor)).toFixed(1);
                const c = riskHex(pr.probability);
                return (
                  <div key={pr.node} onClick={() => setSelected(pr)}
                    className={`rounded-xl p-3 border cursor-pointer transition-all ${selected.node===pr.node?"border-primary/30 shadow-sm":"border-outline-variant/15"}`}
                    style={{ background: c + "0d" }}>
                    <div className="font-label text-[9px] text-outline mb-1 truncate">{pr.location}</div>
                    <div className="text-lg font-bold font-label" style={{ color:c }}>{estimatedDepth}</div>
                    <div className="font-label text-[8px] text-outline mb-1.5">cm est. depth</div>
                    <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${pr.probability}%`, background:c }}/>
                    </div>
                    <div className="font-label text-[8.5px] mt-1" style={{ color:c }}>
                      {pr.trend==="rising"?"↑":pr.trend==="falling"?"↓":"→"} {pr.probability}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 24-Hour Risk Forecast */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden shadow-sm">
            <div className="flex justify-between items-center px-5 py-3 border-b border-outline-variant/10">
              <div className="text-xs font-bold text-on-surface">24-Hour Risk Forecast</div>
              <div className="font-label text-[10px] text-outline">{p.location} · {model}</div>
            </div>
            <div className="p-4">
              <Sparkline data={forecast} color={color} threshold={80} maxY={100} height={88}/>
              <div className="flex justify-between font-label text-[9.5px] text-outline mt-1">
                <span>Now</span><span>+6h</span><span>+12h</span><span>+18h</span><span>+24 hours</span>
              </div>
            </div>
          </div>

          {/* Feature importance */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden shadow-sm">
            <div className="flex justify-between items-center px-5 py-3 border-b border-outline-variant/10">
              <div className="text-xs font-bold text-on-surface">Model Feature Importance</div>
              <div className="font-label text-[10px] text-outline">{model} — top 5 inputs</div>
            </div>
            <div className="p-4 space-y-3">
              {[
                { f:"Historical Sewage Level (7-day rolling)",  w:0.34, c:"#004ac6" },
                { f:"Live Rainfall Nowcast (Open-Meteo)",        w:0.28, c:"#d97706" },
                { f:"DEM Terrain / Elevation Profile",           w:0.18, c:"#6a1edb" },
                { f:"Drain Hydraulic Capacity (graph model)",    w:0.12, c:"#006780" },
                { f:"Time of Day + Monsoon Season Index",        w:0.08, c:"#16a34a" },
              ].map(f => (
                <div key={f.f}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-on-surface-variant">{f.f}</span>
                    <span className="font-label font-bold" style={{ color:f.c }}>{(f.w*100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width:`${f.w*100}%`, background:f.c }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT sidebar */}
      <aside className="w-[240px] bg-surface-container-low border-l border-outline-variant/10 overflow-y-auto custom-scrollbar shrink-0 flex flex-col gap-5 p-4">
        {/* Model Performance */}
        <div>
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Model Performance</div>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm">
            {[
              { l:"Accuracy",      v:MODELS[model].acc, c:"text-green-600" },
              { l:"Precision",     v:"89.3%",    c:"text-primary" },
              { l:"Recall",        v:"93.1%",    c:"text-amber-600" },
              { l:"F1 Score",      v:"91.2%",    c:"text-purple-600" },
              { l:"MAE",           v:"0.42 cm",  c:"text-on-surface" },
              { l:"Training data", v:"18 months",c:"text-on-surface" },
              { l:"Inference",     v:"<200ms",   c:"text-on-surface" },
            ].map(r => (
              <div key={r.l} className="flex justify-between px-3 py-2 border-b border-outline-variant/10 last:border-0">
                <span className="text-xs text-on-surface-variant">{r.l}</span>
                <span className={`font-label text-[10px] font-semibold ${r.c}`}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Actions */}
        <div>
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Recommended Actions</div>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm">
            {(p.probability>=80?[
              { icon:"warning",      text:"Dispatch crew — critical priority", c:"text-error" },
              { icon:"water",        text:"Activate backup pump relay", c:"text-on-surface" },
              { icon:"campaign",     text:"Issue public SMS advisory", c:"text-on-surface" },
              { icon:"call",         text:"Notify GHMC control room", c:"text-on-surface" },
              { icon:"fence",        text:"Prepare flood barriers", c:"text-on-surface" },
            ]:p.probability>=50?[
              { icon:"schedule",     text:"Schedule crew inspection (2h)", c:"text-on-surface" },
              { icon:"sensors",      text:"Increase sensor polling rate", c:"text-on-surface" },
              { icon:"chat",         text:"Alert ward councillor", c:"text-on-surface" },
            ]:[
              { icon:"check_circle", text:"Continue standard monitoring", c:"text-green-600" },
              { icon:"data_usage",   text:"Log data for model training", c:"text-on-surface" },
            ]).map((a,i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-outline-variant/10 last:border-0">
                <span className={`material-symbols-outlined text-[15px] ${a.c}`}>{a.icon}</span>
                <span className="text-xs text-on-surface">{a.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Risk Grid */}
        <div>
          <div className="font-label text-[10px] font-bold uppercase tracking-wider text-outline mb-3">Risk Overview — All Nodes</div>
          <div className="grid grid-cols-3 gap-2">
            {PREDICTIONS.map(pr => (
              <div key={pr.node} onClick={() => setSelected(pr)} className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className="transition-transform group-hover:scale-105">
                  <Ring pct={pr.probability} size={60}/>
                </div>
                <div className="font-label text-[8.5px] text-outline text-center leading-tight">{pr.location.split(" ")[0]}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
