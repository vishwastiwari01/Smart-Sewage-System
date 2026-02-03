import { useState, useEffect, useRef, useCallback } from "react";

/* ─── CONSTANTS ─────────────────────────────────────────────────────────── */
const LEVEL_LIMIT = 10;
const GAS_LIMIT   = 600;
const TICK_MS     = 2000;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const ts    = () => new Date().toLocaleTimeString();

/* ─── GLOBAL CSS (injected via <style> in component) ───────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Share+Tech+Mono&display=swap');
  :root {
    --bg:#060a12; --card:#0d1220; --border:#1e2a40;
    --txt:#c8d6e5; --dim:#4e5e73;
    --accent:#00d4ff; --safe:#00e676; --warn:#ffb740; --danger:#ff3b3b; --manual:#b388ff;
  }
  *       { box-sizing:border-box; margin:0; padding:0; }
  html,body,#root { min-height:100%; background:var(--bg); color:var(--txt);
                    font-family:'Share Tech Mono',monospace; }

  /* ── top bar ── */
  .topbar { background:#0a0f18; border-bottom:1px solid var(--border);
            padding:10px 22px; display:flex; align-items:center;
            justify-content:space-between; position:sticky; top:0; z-index:20; }
  .topbar-left  { display:flex; align-items:center; gap:14px; }
  .logo-icon    { width:36px; height:36px; border-radius:8px;
                  background:linear-gradient(135deg,var(--warn),var(--danger));
                  display:flex; align-items:center; justify-content:center; font-size:18px; }
  .topbar-title { font-family:'Orbitron',sans-serif; font-size:13px;
                  font-weight:700; letter-spacing:2px; color:#fff; }
  .topbar-sub   { font-size:9px; color:var(--dim); letter-spacing:1.8px;
                  margin-top:2px; text-transform:uppercase; }
  .badges       { display:flex; gap:8px; flex-wrap:wrap; }

  /* ── badge ── */
  .badge      { display:inline-flex; align-items:center; gap:6px;
                border-radius:6px; padding:4px 10px;
                font-size:10px; font-weight:600; letter-spacing:0.8px;
                text-transform:uppercase; transition:all .3s; }
  .badge-dot  { width:7px; height:7px; border-radius:50%; transition:all .3s; }

  /* ── alert banner ── */
  .alert-banner { background:linear-gradient(90deg,#3a0808,#520e0e,#3a0808);
                  border-bottom:2px solid var(--danger);
                  padding:10px 22px; display:flex; align-items:center; gap:14px;
                  animation:flashBg 1.3s ease-in-out infinite; }
  .alert-banner .a-icon   { font-size:24px; }
  .alert-banner .a-title  { font-family:'Orbitron',sans-serif; font-size:12px;
                            color:#ff8a8a; font-weight:700; letter-spacing:1px; }
  .alert-banner .a-detail { font-size:10px; color:#e08080; margin-top:2px; }

  /* ── main grid ── */
  .main-grid { display:grid; grid-template-columns:1fr 1fr 320px;
               gap:18px; padding:18px 22px; max-width:1340px; margin:0 auto; }

  /* ── card ── */
  .card       { background:var(--card); border:1px solid var(--border);
                border-radius:12px; padding:18px; }
  .card-label { font-family:'Orbitron',sans-serif; font-size:9px;
                color:var(--dim); letter-spacing:2px;
                text-transform:uppercase; margin-bottom:12px; }

  /* ── gauge row / legend ── */
  .gauge-row    { display:flex; justify-content:center; }
  .gauge-legend { display:flex; gap:14px; justify-content:center;
                  font-size:10px; margin-top:6px; }
  .gauge-legend span          { display:flex; align-items:center; gap:4px; }
  .legend-dot                 { width:8px; height:8px; border-radius:2px; display:inline-block; }

  /* ── actuator ── */
  .actuator-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .actuator-card { border-radius:10px; padding:14px 10px; text-align:center;
                   border:1px solid var(--border); transition:all .3s; }
  .act-icon  { font-size:20px; }
  .act-state { font-family:'Orbitron',sans-serif; font-size:16px;
               font-weight:700; margin-top:2px; }
  .act-label { font-size:10px; color:var(--dim); margin-top:3px; }
  .act-bar   { width:100%; height:3px; border-radius:2px; margin-top:8px; }

  /* ── toggle ── */
  .toggle-track { width:44px; height:24px; border-radius:12px;
                  position:relative; cursor:pointer; transition:background .3s; }
  .toggle-thumb { width:18px; height:18px; border-radius:50%; background:#fff;
                  position:absolute; top:3px; transition:left .25s;
                  box-shadow:0 1px 3px rgba(0,0,0,.4); }

  /* ── manual ON/OFF buttons ── */
  .manual-btn-row { display:flex; gap:8px; }
  .manual-btn     { flex:1; padding:8px 0; border-radius:6px; border:none;
                    cursor:pointer; font-family:'Share Tech Mono',monospace;
                    font-weight:600; font-size:13px; transition:all .2s; }

  /* ── fault injection buttons ── */
  .fault-btn     { width:100%; padding:11px 14px; border-radius:8px;
                   cursor:pointer; text-align:left;
                   font-family:'Share Tech Mono',monospace;
                   font-weight:600; font-size:12px; transition:all .2s;
                   display:flex; align-items:center; justify-content:space-between; }
  .fault-btn .tag { font-size:9px; font-weight:400; color:var(--dim); }

  /* ── mqtt box ── */
  .mqtt-box      { background:var(--bg); border:1px solid var(--border);
                   border-radius:10px; padding:12px; }
  .mqtt-topic    { font-size:10px; color:var(--dim); margin-bottom:2px; }
  .mqtt-topic .t { color:var(--accent); }
  .mqtt-payload  { font-size:11px; color:#7fdbff; background:var(--card);
                   padding:5px 9px; border-radius:5px; word-break:break-all; }

  /* ── event log ── */
  .log-head   { padding:10px 14px; border-bottom:1px solid var(--border);
                display:flex; align-items:center; justify-content:space-between; }
  .log-head .lbl  { font-family:'Orbitron',sans-serif; font-size:9px;
                    color:var(--dim); letter-spacing:2px; text-transform:uppercase; }
  .log-head .cnt  { font-size:9px; color:var(--dim); }
  .log-scroll { max-height:420px; overflow-y:auto; padding:8px; }
  .log-entry  { display:flex; gap:8px; padding:5px 8px; border-radius:5px;
                margin-bottom:3px; animation:fadeIn .3s ease; }
  .log-entry .lt  { font-size:9px; color:var(--dim); white-space:nowrap; padding-top:1px; }
  .log-entry .lm  { font-size:11px; line-height:1.4; }

  /* ── ref table ── */
  .ref-table      { width:100%; border-collapse:collapse; font-size:11px; }
  .ref-table th   { text-align:left; color:var(--dim); padding-bottom:4px;
                    font-weight:600; border-bottom:1px solid var(--border); }
  .ref-table td   { padding:3px 0; border-bottom:1px solid #111920; }
  .ref-table .key { font-size:10px; font-family:'Share Tech Mono',monospace; }

  /* ── scrollbar ── */
  ::-webkit-scrollbar       { width:6px; }
  ::-webkit-scrollbar-track { background:var(--card); }
  ::-webkit-scrollbar-thumb { background:#1e2a40; border-radius:3px; }

  /* ── keyframes ── */
  @keyframes flashBg { 0%,100%{opacity:1} 50%{opacity:.82} }
  @keyframes fadeIn  { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
`;

/* ─── RADIAL GAUGE ──────────────────────────────────────────────────────── */
function Gauge({ value, max, label, unit, danger, warning, color }) {
  const pct   = clamp(value / max, 0, 1);
  const angle = -135 + pct * 270;
  const rad   = (a) => (a * Math.PI) / 180;
  const cx = 60, cy = 60, r = 44;

  const arc = (startDeg, endDeg, radius) => {
    const s = rad(startDeg - 90), e = rad(endDeg - 90);
    const large = (endDeg - startDeg > 180) ? 1 : 0;
    return `M ${cx + radius * Math.cos(s)} ${cy + radius * Math.sin(s)}
            A ${radius} ${radius} 0 ${large} 1
              ${cx + radius * Math.cos(e)} ${cy + radius * Math.sin(e)}`;
  };

  const isDanger  = value >= danger;
  const isWarning = value >= warning && !isDanger;
  const sColor    = isDanger ? "var(--danger)" : isWarning ? "var(--warn)" : color;

  const needleRad = rad(angle - 90);
  const nx = cx + 30 * Math.cos(needleRad);
  const ny = cy + 30 * Math.sin(needleRad);

  return (
    <div style={{ textAlign:"center" }}>
      <svg viewBox="0 0 120 120" width={150} height={150}>
        <path d={arc(-135,135,r)} fill="none" stroke="#1a2233" strokeWidth={10} strokeLinecap="round"/>
        <path d={arc(-135,135,r)} fill="none" stroke="rgba(255,59,59,0.08)" strokeWidth={10} strokeLinecap="round"/>
        {pct > 0 && <path d={arc(-135, -135 + pct*270, r)} fill="none" stroke={sColor} strokeWidth={10} strokeLinecap="round" style={{transition:"all .6s ease"}}/>}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={sColor} strokeWidth={3} strokeLinecap="round" style={{transition:"all .6s ease"}}/>
        <circle cx={cx} cy={cy} r={5} fill={sColor} style={{transition:"fill .6s ease"}}/>
        <text x={cx} y={cy+16} textAnchor="middle" fill="#fff" fontSize={16} fontWeight="700" fontFamily="'Orbitron',sans-serif">
          {typeof value === "number" ? value.toFixed(1) : value}
        </text>
        <text x={cx} y={cy+30} textAnchor="middle" fill="var(--dim)" fontSize={8} fontFamily="'Share Tech Mono',monospace">{unit}</text>
      </svg>
      <div style={{ color:sColor, fontSize:12, fontWeight:600, marginTop:-6, letterSpacing:1, textTransform:"uppercase", fontFamily:"'Orbitron',sans-serif", transition:"color .4s" }}>
        {label}{isDanger && " ⚠"}
      </div>
    </div>
  );
}

/* ─── SPARKLINE ─────────────────────────────────────────────────────────── */
function Sparkline({ level }) {
  const histRef = useRef([]);
  const [history, setHistory] = useState([]);
  useEffect(() => {
    histRef.current = [...histRef.current.slice(-29), level];
    setHistory([...histRef.current]);
  }, [level]);

  const W=300, H=50;
  const pts = history.map((v,i) => `${(i/29)*W},${H - (v/25)*H}`).join(" ");
  const dangerY = H - (LEVEL_LIMIT/25)*H;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <line x1={0} y1={dangerY} x2={W} y2={dangerY} stroke="var(--danger)" strokeWidth={1} strokeDasharray="4 3" opacity={0.55}/>
      <text x={W-4} y={dangerY-4} textAnchor="end" fill="var(--danger)" fontSize={7} fontFamily="'Share Tech Mono',monospace">limit</text>
      {history.length > 1 && <polygon points={`0,${H} ${pts} ${W*((history.length-1)/29)},${H}`} fill="url(#spGrad)" opacity={0.22}/>}
      {history.length > 1 && <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round"/>}
      <defs>
        <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)"/>
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0}/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── BADGE ─────────────────────────────────────────────────────────────── */
function Badge({ active, color, children }) {
  const c = color || "var(--safe)";
  return (
    <div className="badge" style={{
      background: active ? c+"22" : "var(--card)",
      color:      active ? c      : "var(--dim)",
      border:     `1px solid ${active ? c+"55" : "var(--border)"}`
    }}>
      <span className="badge-dot" style={{ background: active ? c : "var(--dim)", boxShadow: active ? `0 0 6px ${c}` : "none" }}/>
      {children}
    </div>
  );
}

/* ─── TOGGLE ────────────────────────────────────────────────────────────── */
function Toggle({ on, onChange, color }) {
  return (
    <div className="toggle-track" style={{ background: on ? color : "var(--border)" }} onClick={() => onChange(!on)}>
      <div className="toggle-thumb" style={{ left: on ? 23 : 3 }}/>
    </div>
  );
}

/* ─── MAIN APP ──────────────────────────────────────────────────────────── */
export default function App() {
  const [level,        setLevel]        = useState(5.2);
  const [gas,          setGas]          = useState(320);
  const [relayOn,      setRelayOn]      = useState(true);
  const [buzzerOn,     setBuzzerOn]     = useState(false);
  const [alertActive,  setAlertActive]  = useState(false);
  const [manualMode,   setManualMode]   = useState(false);
  const [manualRelay,  setManualRelay]  = useState(true);
  const [logs,         setLogs]         = useState([]);
  const [fault,        setFault]        = useState(null);
  const logsRef        = useRef(null);
  const prevFault      = useRef(null);

  /* log helper */
  const addLog = useCallback((msg, type = "info") => {
    setLogs(prev => [...prev.slice(-59), { id: Date.now()+Math.random(), msg, type, time: ts() }]);
  }, []);

  /* ── simulation tick ── */
  useEffect(() => {
    const id = setInterval(() => {
      setLevel(prev => {
        if (fault === "overflow") return clamp(prev + 0.25 + Math.random()*0.45, 0, 24);
        return clamp(prev + (Math.random()-0.52)*0.55, 1.2, 9.4);
      });
      setGas(prev => {
        if (fault === "gas") return clamp(prev + 25 + Math.random()*45, 0, 1023);
        return clamp(prev + (Math.random()-0.5)*55, 90, 575);
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [fault]);

  /* ── ESP32 logic mirror ── */
  useEffect(() => {
    const over    = level >= LEVEL_LIMIT;
    const gasHigh = gas   > GAS_LIMIT;
    const alert   = over || gasHigh;

    if (!manualMode) {
      if (alert) {
        setRelayOn(false);
        setBuzzerOn(true);
      } else {
        setRelayOn(true);
        setBuzzerOn(false);
      }
    } else {
      setRelayOn(manualRelay);
      setBuzzerOn(false);
    }
    setAlertActive(alert && !manualMode);
  }, [level, gas, manualMode, manualRelay]);

  /* ── log on manual toggle ── */
  useEffect(() => {
    if (manualMode) addLog("Manual override ENABLED — auto-logic suspended", "manual");
    else            addLog("Manual override DISABLED — returning to AUTO", "info");
  }, [manualMode]);

  useEffect(() => {
    if (manualMode) addLog(`Manual relay → ${manualRelay ? "ON" : "OFF"}`, "manual");
  }, [manualRelay]);

  /* ── log on fault change ── */
  useEffect(() => {
    if (fault !== prevFault.current) {
      if      (fault === "overflow") addLog("🔴 FAULT INJECTED: Simulated sewage overflow", "alert");
      else if (fault === "gas")      addLog("🔴 FAULT INJECTED: Simulated gas leakage",     "alert");
      else if (prevFault.current)    addLog("✅ Fault cleared — returning to normal",        "info");
      prevFault.current = fault;
    }
  }, [fault]);

  /* ── log on alert trigger ── */
  useEffect(() => {
    if (alertActive) addLog(`⚠ OVERFLOW / GAS DETECTED — level=${level.toFixed(1)}cm gas=${gas}`, "alert");
  }, [alertActive]);

  /* ── auto-scroll log ── */
  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  /* live payload string */
  const mqttPayload = JSON.stringify({ level: +level.toFixed(2), gas });

  /* ─── RENDER ──────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* ── TOP BAR ── */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="logo-icon">🚰</div>
          <div>
            <div className="topbar-title">SEWAGE OVERFLOW MONITOR</div>
            <div className="topbar-sub">Smart City IoT · Node-RED + MQTT · ESP32</div>
          </div>
        </div>
        <div className="badges">
          <Badge active={true}     color="var(--accent)">WiFi Connected</Badge>
          <Badge active={true}     color="#b388ff">MQTT Live</Badge>
          <Badge active={relayOn}  color="var(--safe)">{relayOn ? "Pump ON" : "Pump OFF"}</Badge>
          <Badge active={buzzerOn} color="var(--danger)">{buzzerOn ? "Buzzer ON" : "Buzzer OFF"}</Badge>
        </div>
      </div>

      {/* ── ALERT BANNER ── */}
      {alertActive && (
        <div className="alert-banner">
          <span className="a-icon">⚠️</span>
          <div>
            <div className="a-title">ALERT: OVERFLOW / GAS DETECTED</div>
            <div className="a-detail">
              Pump OFF · Buzzer active · Level: {level.toFixed(1)} cm (limit {LEVEL_LIMIT}) · Gas: {gas} (limit {GAS_LIMIT})
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <div className="main-grid">

        {/* ──── COL 1: GAUGES ──── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Level gauge card */}
          <div className="card">
            <div className="card-label">Sewage Level</div>
            <div className="gauge-row">
              <Gauge value={level} max={25} label="Level" unit="cm" danger={LEVEL_LIMIT} warning={LEVEL_LIMIT*0.8} color="var(--accent)"/>
            </div>
            <div className="gauge-legend">
              <span><span className="legend-dot" style={{background:"var(--safe)"}}/>Safe &lt;{LEVEL_LIMIT*0.8} cm</span>
              <span><span className="legend-dot" style={{background:"var(--warn)"}}/>Warn {LEVEL_LIMIT*0.8}–{LEVEL_LIMIT}</span>
              <span><span className="legend-dot" style={{background:"var(--danger)"}}/>Alert &gt;{LEVEL_LIMIT}</span>
            </div>
          </div>

          {/* Gas gauge card */}
          <div className="card">
            <div className="card-label">Gas Concentration</div>
            <div className="gauge-row">
              <Gauge value={gas} max={1023} label="Gas (ADC)" unit="ADC units" danger={GAS_LIMIT} warning={GAS_LIMIT*0.85} color="#b388ff"/>
            </div>
            <div className="gauge-legend">
              <span><span className="legend-dot" style={{background:"var(--safe)"}}/>Safe &lt;{Math.round(GAS_LIMIT*0.85)}</span>
              <span><span className="legend-dot" style={{background:"var(--warn)"}}/>Warn {Math.round(GAS_LIMIT*0.85)}–{GAS_LIMIT}</span>
              <span><span className="legend-dot" style={{background:"var(--danger)"}}/>Alert &gt;{GAS_LIMIT}</span>
            </div>
          </div>

          {/* Sparkline */}
          <div className="card">
            <div className="card-label">Recent Level History</div>
            <Sparkline level={level}/>
          </div>
        </div>

        {/* ──── COL 2: CONTROLS ──── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Actuators */}
          <div className="card">
            <div className="card-label">Actuator Status</div>
            <div className="actuator-grid">
              {/* Relay */}
              <div className="actuator-card" style={{ background: relayOn  ? "rgba(0,230,118,.12)" : "var(--bg)",
                                                      borderColor: relayOn  ? "rgba(0,230,118,.3)"  : "var(--border)" }}>
                <div className="act-icon">⚡</div>
                <div className="act-state" style={{ color: relayOn ? "var(--safe)" : "var(--danger)" }}>{relayOn ? "ON" : "OFF"}</div>
                <div className="act-label">Relay (Pump)</div>
                {relayOn && <div className="act-bar" style={{ background:"var(--safe)", boxShadow:"0 0 8px var(--safe)" }}/>}
              </div>
              {/* Buzzer */}
              <div className="actuator-card" style={{ background: buzzerOn ? "rgba(255,59,59,.12)" : "var(--bg)",
                                                      borderColor: buzzerOn ? "rgba(255,59,59,.3)"  : "var(--border)" }}>
                <div className="act-icon">🔊</div>
                <div className="act-state" style={{ color: buzzerOn ? "var(--danger)" : "var(--dim)" }}>{buzzerOn ? "ON" : "OFF"}</div>
                <div className="act-label">Buzzer Alarm</div>
                {buzzerOn && <div className="act-bar" style={{ background:"var(--danger)", boxShadow:"0 0 8px var(--danger)" }}/>}
              </div>
            </div>
          </div>

          {/* Manual Override */}
          <div className="card" style={{ background: manualMode ? "#1a1530" : "var(--card)",
                                         borderColor: manualMode ? "#b388ff55" : "var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div className="card-label" style={{ marginBottom:0, color: manualMode ? "var(--manual)" : "var(--dim)" }}>
                Manual Override {manualMode && "🔒"}
              </div>
              <Toggle on={manualMode} onChange={setManualMode} color="var(--manual)"/>
            </div>
            {manualMode ? (
              <>
                <div style={{ fontSize:11, color:"var(--manual)", marginBottom:8 }}>Relay (Pump) Control</div>
                <div className="manual-btn-row">
                  <button className="manual-btn" onClick={() => setManualRelay(true)}
                    style={{ background: manualRelay  ? "var(--safe)"  : "var(--card)",
                             color:      manualRelay  ? "#fff"         : "var(--dim)" }}>ON</button>
                  <button className="manual-btn" onClick={() => setManualRelay(false)}
                    style={{ background: !manualRelay ? "var(--danger)" : "var(--card)",
                             color:      !manualRelay ? "#fff"          : "var(--dim)" }}>OFF</button>
                </div>
                <div style={{ fontSize:10, color:"var(--dim)", marginTop:10 }}>
                  Publishes to: <code style={{ color:"var(--manual)", background:"#1a1530", padding:"1px 6px", borderRadius:4 }}>sewage/manual</code>
                </div>
              </>
            ) : (
              <div style={{ fontSize:11, color:"var(--dim)" }}>ESP32 firmware controls all actuators automatically.</div>
            )}
          </div>

          {/* Fault Injection */}
          <div className="card">
            <div className="card-label">Fault Injection Testing</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button className="fault-btn" onClick={() => setFault("overflow")}
                style={{ border:`1px solid ${fault==="overflow"?"#7f1d1d":"#3a1010"}`,
                         background: fault==="overflow" ? "#991b1b" : "var(--bg)",
                         color:      fault==="overflow" ? "#fecaca" : "var(--danger)" }}>
                <span>🚨 Simulate Sewage Overflow</span>
                <span className="tag">level → exceeds {LEVEL_LIMIT} cm</span>
              </button>
              <button className="fault-btn" onClick={() => setFault("gas")}
                style={{ border:`1px solid ${fault==="gas"?"#78350f":"#3a1e10"}`,
                         background: fault==="gas" ? "#92400e" : "var(--bg)",
                         color:      fault==="gas" ? "#fed7aa" : "var(--warn)" }}>
                <span>☠️ Simulate Gas Leakage</span>
                <span className="tag">gas → exceeds {GAS_LIMIT}</span>
              </button>
              <button className="fault-btn" onClick={() => setFault(null)}
                style={{ border:`1px solid ${fault===null?"#166534":"#1a3a1e"}`,
                         background: fault===null ? "#166534" : "var(--bg)",
                         color:      fault===null ? "#bbf7d0" : "var(--safe)" }}>
                <span>✅ Clear Faults — Normal</span>
                <span className="tag">baseline simulation</span>
              </button>
            </div>
          </div>

          {/* MQTT Payload */}
          <div className="mqtt-box">
            <div className="card-label" style={{ marginBottom:8 }}>MQTT Live Payload</div>
            <div className="mqtt-topic">Topic: <span className="t">sewage/data</span></div>
            <div className="mqtt-payload">{mqttPayload}</div>
            {alertActive && (
              <>
                <div className="mqtt-topic" style={{ marginTop:10, color:"var(--dim)" }}>Topic: <span style={{ color:"var(--danger)" }}>sewage/alert</span></div>
                <div className="mqtt-payload" style={{ color:"#ffaaaa" }}>⚠ OVERFLOW / GAS DETECTED</div>
              </>
            )}
          </div>
        </div>

        {/* ──── COL 3: EVENT LOG + REF TABLE ──── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Log */}
          <div className="card" style={{ padding:0, display:"flex", flexDirection:"column", flex:1 }}>
            <div className="log-head">
              <span className="lbl">Event Log</span>
              <span className="cnt">{logs.length} events</span>
            </div>
            <div className="log-scroll" ref={logsRef}>
              {logs.length === 0 && <div style={{ color:"var(--dim)", fontSize:12, textAlign:"center", padding:24 }}>Awaiting events…</div>}
              {logs.map(log => {
                const bc = log.type==="alert" ? "var(--danger)" : log.type==="manual" ? "var(--manual)" : "var(--accent)";
                const bg = log.type==="alert" ? "rgba(255,59,59,.1)" : log.type==="manual" ? "rgba(179,136,255,.08)" : "transparent";
                return (
                  <div key={log.id} className="log-entry" style={{ background:bg, borderLeft:`3px solid ${bc}` }}>
                    <span className="lt">{log.time}</span>
                    <span className="lm" style={{ color: log.type==="alert" ? "#ffaaaa" : log.type==="manual" ? "var(--manual)" : "var(--txt)" }}>{log.msg}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reference card */}
          <div className="card">
            <div className="card-label">MQTT Topics & ESP32 Pins</div>
            <table className="ref-table">
              <thead><tr><th>Topic / Pin</th><th>Role</th></tr></thead>
              <tbody>
                {[
                  ["sewage/data",  "JSON {level, gas}",          "var(--accent)"],
                  ["sewage/alert", "Alert message",              "var(--danger)"],
                  ["sewage/manual","ON/OFF cmd (sub)",           "var(--manual)"],
                  ["GPIO 5 / 18",  "TRIG / ECHO (HC-SR04)",     "var(--accent)"],
                  ["GPIO 34",      "Gas ADC (potentiometer)",   "#b388ff"],
                  ["GPIO 26",      "Relay IN",                  "var(--safe)"],
                  ["GPIO 27",      "Buzzer",                    "var(--warn)"],
                ].map(([k,v,c]) => (
                  <tr key={k}>
                    <td className="key" style={{ color:c }}>{k}</td>
                    <td style={{ color:"var(--dim)" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
