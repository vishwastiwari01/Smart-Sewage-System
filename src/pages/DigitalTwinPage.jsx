import { useState, useEffect, useRef } from "react";
import { NODES_INITIAL, statusColor, getStatus } from "../data/mockData";

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

const PIPES = [
  { from:"HYD-AM-209", to:"HYD-MP-203" },
  { from:"HYD-MP-203", to:"HYD-BH-101" },
  { from:"HYD-BH-101", to:"HYD-OC-107" },
  { from:"HYD-SC-305", to:"HYD-BH-101" },
  { from:"HYD-SC-305", to:"HYD-KK-412" },
  { from:"HYD-KK-412", to:"HYD-KP-004" },
  { from:"HYD-OC-107", to:"HYD-LB-508" },
  { from:"HYD-LB-508", to:"HYD-HT-601" },
];

const TWIN_POS = {
  "HYD-AM-209": { x: 80,  y: 160 },
  "HYD-MP-203": { x: 200, y: 260 },
  "HYD-BH-101": { x: 320, y: 170 },
  "HYD-SC-305": { x: 420, y:  80 },
  "HYD-KK-412": { x: 530, y: 150 },
  "HYD-KP-004": { x: 650, y:  80 },
  "HYD-OC-107": { x: 340, y: 310 },
  "HYD-LB-508": { x: 480, y: 340 },
  "HYD-HT-601": { x: 620, y: 280 },
};

function useFlowSim() {
  const [nodes, setNodes] = useState(() =>
    NODES_INITIAL.map(n => ({ ...n, flow: +(1 + Math.random()*3).toFixed(2) }))
  );
  useEffect(() => {
    const id = setInterval(() => {
      setNodes(prev => prev.map(n => {
        const level = clamp(n.level + (Math.random()-.48)*.25, 0, 14);
        const gas   = clamp(n.gas   + (Math.random()-.5) *12, 50, 850);
        const flow  = clamp(n.flow  + (Math.random()-.5) *.2, 0.5, 8);
        return { ...n, level:+level.toFixed(2), gas:Math.round(gas), flow:+flow.toFixed(2), status:getStatus(level,gas) };
      }));
    }, 1800);
    return () => clearInterval(id);
  }, []);
  return nodes;
}

function statusHex(s) {
  return s==="CRITICAL"?"#DC2626":s==="WARNING"?"#B45309":"#16A34A";
}

export default function DigitalTwinPage() {
  const nodes  = useFlowSim();
  const [sel, setSel] = useState(null);
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const selNode = sel ? nodeMap[sel] : null;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 290px", height:"100%", overflow:"hidden" }}>

      {/* SVG twin */}
      <div style={{ position:"relative", overflow:"hidden", background:"#f9f9f9", borderRight:"1px solid #e2e2e2" }}>
        <div style={{ position:"absolute", top:14, left:16, zIndex:10 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#1a1c1c", marginBottom:2 }}>Digital Twin — Sewage Flow Simulation</div>
          <div style={{ fontSize:11, color:"#737686" }}>Real-time pipe flow model · {nodes.length} nodes · Click a node to inspect</div>
        </div>

        <svg viewBox="0 0 760 430" style={{ width:"100%", height:"100%", display:"block" }} preserveAspectRatio="xMidYMid meet">
          {/* Grid */}
          <rect width="760" height="430" fill="#f9f9f9"/>
          <defs>
            <pattern id="dt-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="#e2e2e2" strokeWidth=".5" opacity=".6"/>
            </pattern>
          </defs>
          <rect width="760" height="430" fill="url(#dt-grid)"/>

          {/* Pipes + flow particles */}
          {PIPES.map(pipe => {
            const from = TWIN_POS[pipe.from];
            const to   = TWIN_POS[pipe.to];
            if (!from || !to) return null;
            const fn     = nodeMap[pipe.from];
            const color  = fn ? statusHex(fn.status) : "#2563EB";
            const isHigh = fn?.level > 7;
            return (
              <g key={pipe.from+pipe.to}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={color} strokeWidth={isHigh?3:1.5} opacity={isHigh?.25:.12}/>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={color} strokeWidth={isHigh?1.5:1} opacity={.45}
                  strokeDasharray={isHigh?"none":"6 3"}/>
                {[0,2,4].map(d => (
                  <circle key={d} r={isHigh?3:2} fill={color} opacity={.85}>
                    <animateMotion dur={`${isHigh?3:6}s`} begin={`${d}s`} repeatCount="indefinite"
                      path={`M${from.x},${from.y} L${to.x},${to.y}`}/>
                  </circle>
                ))}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const pos   = TWIN_POS[n.id];
            if (!pos) return null;
            const color = statusHex(n.status);
            const r     = n.status==="CRITICAL"?14:n.status==="WARNING"?12:10;
            const isSel = sel===n.id;
            return (
              <g key={n.id} style={{ cursor:"pointer" }} onClick={() => setSel(sel===n.id?null:n.id)}>
                {n.status==="CRITICAL" && (
                  <circle cx={pos.x} cy={pos.y} r={r+10} fill={color} opacity={.05}>
                    <animate attributeName="r" values={`${r+3};${r+18};${r+3}`} dur="2.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values=".08;.01;.08" dur="2.5s" repeatCount="indefinite"/>
                  </circle>
                )}
                {isSel && <circle cx={pos.x} cy={pos.y} r={r+5} fill="none" stroke={color} strokeWidth="2" opacity=".35"/>}
                <circle cx={pos.x} cy={pos.y} r={r+2.5} fill="#fff" stroke={color} strokeWidth={isSel?2:1.5}/>
                <circle cx={pos.x} cy={pos.y} r={r} fill={color} opacity={.9}/>
                <text x={pos.x} y={pos.y+3.5} fill="#fff" fontSize="7" fontFamily="'JetBrains Mono',monospace" textAnchor="middle" fontWeight="700">
                  {n.id.split("-")[1]}
                </text>
                <text x={pos.x} y={pos.y+r+13} fill={color} fontSize="8" fontFamily="'JetBrains Mono',monospace" textAnchor="middle" fontWeight="500">
                  {n.flow} L/s
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating cards for non-normal nodes */}
        {nodes.filter(n=>n.status!=="NORMAL").map(n => {
          const pos = TWIN_POS[n.id];
          if (!pos) return null;
          const color = statusHex(n.status);
          return (
            <div key={n.id} style={{
              position:"absolute", left:pos.x-52, top:pos.y-46,
              width:104, background:"#fff", border:`1px solid ${color}40`,
              borderLeft:`2px solid ${color}`, borderRadius:6, padding:"5px 8px",
              fontSize:10, boxShadow:"0 1px 3px rgba(0,0,0,0.08)", pointerEvents:"none",
            }}>
              <div style={{ fontFamily:"JetBrains Mono, monospace", fontSize:9, color, fontWeight:600, marginBottom:2 }}>
                {n.id.split("-").slice(1).join("-")}
              </div>
              <div style={{ color:"#434655", marginBottom:3 }}>{n.name}</div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"#1a1c1c", fontFamily:"JetBrains Mono, monospace", fontWeight:600 }}>{n.level.toFixed(1)}<span style={{ color:"#737686" }}>cm</span></span>
                <span style={{ color:n.gas>500?"#ba1a1a":"#434655", fontFamily:"JetBrains Mono, monospace" }}>{n.gas}<span style={{ color:"#737686" }}>adc</span></span>
              </div>
              <div className="gauge-track" style={{ marginTop:4 }}>
                <div className="gauge-fill" style={{ width:`${Math.min(n.level/14*100,100)}%`, background:color }}/>
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div style={{ position:"absolute", bottom:14, left:14, display:"flex", gap:14, background:"rgba(255,255,255,.9)", border:"1px solid #e2e2e2", borderRadius:6, padding:"6px 12px", fontSize:10.5 }}>
          {[["Normal","#16A34A"],["Warning","#B45309"],["Critical","#DC2626"]].map(([l,c]) => (
            <div key={l} style={{ display:"flex", gap:5, alignItems:"center" }}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:c }}/>
              <span style={{ color:"#434655" }}>{l}</span>
            </div>
          ))}
          <div style={{ width:1, background:"#e2e2e2" }}/>
          <div style={{ display:"flex", gap:5, alignItems:"center" }}>
            <div style={{ width:16,height:1.5,background:"#2563EB",borderRadius:1 }}/>
            <span style={{ color:"#434655" }}>Flow direction</span>
          </div>
        </div>
      </div>

      {/* RIGHT panel */}
      <div className="sidebar-right" style={{ width:290 }}>
        {selNode ? (
          <>
            <div className="panel-section">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontFamily:"JetBrains Mono, monospace", fontSize:11, color:"#737686", marginBottom:3 }}>{selNode.id}</div>
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:1 }}>{selNode.name}</div>
                  <div style={{ fontSize:11, color:"#737686" }}>{selNode.area}</div>
                </div>
                <span className={`badge ${selNode.status==="CRITICAL"?"b-crit":selNode.status==="WARNING"?"b-warn":"b-safe"}`}>{selNode.status}</span>
              </div>

              {/* Pipe fill cylinder */}
              <div style={{ display:"flex", justifyContent:"center", margin:"14px 0" }}>
                <div style={{ position:"relative", width:56, height:110 }}>
                  <div style={{ width:56, height:110, borderRadius:8, border:`1px solid ${statusHex(selNode.status)}40`, background:"#f3f3f3", overflow:"hidden", position:"relative" }}>
                    <div style={{
                      position:"absolute", bottom:0, width:"100%",
                      height:`${Math.min(selNode.level/14*100,100)}%`,
                      background:statusHex(selNode.status),
                      opacity:.7,
                      transition:"height 1.2s cubic-bezier(.4,0,.2,1)",
                    }}/>
                  </div>
                  <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", fontFamily:"JetBrains Mono, monospace", fontSize:12, fontWeight:700, color:"#1a1c1c" }}>
                    {selNode.level.toFixed(1)}
                  </div>
                  <div style={{ textAlign:"center", marginTop:5, fontSize:9.5, color:"#737686" }}>cm level</div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {[
                  { l:"Flow Rate", v:`${selNode.flow} L/s`, c:"#004ac6" },
                  { l:"Gas ADC",   v:selNode.gas,           c:selNode.gas>500?"#ba1a1a":selNode.gas>300?"#d97706":"#16a34a" },
                  { l:"Pump",      v:selNode.pump,          c:selNode.pump==="ON"?"#16a34a":"#434655" },
                  { l:"Temp",      v:`${selNode.temp}°C`,   c:"#1a1c1c" },
                ].map(r => (
                  <div key={r.l} style={{ background:"#f3f3f3", borderRadius:5, padding:"8px 10px", border:"1px solid #e2e2e2" }}>
                    <div style={{ fontSize:9.5, color:"#737686", fontWeight:500, textTransform:"uppercase", letterSpacing:".04em", marginBottom:2 }}>{r.l}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:r.c, fontFamily:"JetBrains Mono, monospace" }}>{r.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-section">
              <div className="section-title">Connected Pipes</div>
              {PIPES.filter(p => p.from===selNode.id || p.to===selNode.id).map(pipe => {
                const otherId = pipe.from===selNode.id ? pipe.to : pipe.from;
                const other   = nodeMap[otherId];
                const dir     = pipe.from===selNode.id ? "→ Outflow to" : "← Inflow from";
                return (
                  <div key={pipe.from+pipe.to} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #e2e2e2", fontSize:12, alignItems:"center" }}>
                    <div>
                      <div style={{ fontWeight:500 }}>{other?.name}</div>
                      <div style={{ fontSize:10.5, color:"#737686", marginTop:1 }}>{dir}</div>
                    </div>
                    <span className={`badge ${other?.status==="CRITICAL"?"b-crit":other?.status==="WARNING"?"b-warn":"b-safe"}`}>{other?.status}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="panel-section">
            <div style={{ fontSize:12, color:"#737686", lineHeight:1.7 }}>
              Click any node on the diagram to see real-time flow data, pipe connections, and sewage level.
            </div>
          </div>
        )}

        <div className="panel-section">
          <div className="section-title">Network Flow Stats</div>
          {[
            { l:"Total flow rate",     v:`${nodes.reduce((s,n)=>s+n.flow,0).toFixed(1)} L/s`, c:"#004ac6" },
            { l:"Avg sewage level",    v:`${(nodes.reduce((s,n)=>s+n.level,0)/nodes.length).toFixed(1)} cm`, c:"#1a1c1c" },
            { l:"Active pumps",        v:nodes.filter(n=>n.pump==="ON").length,                c:"#16a34a" },
            { l:"Blockage risk nodes", v:nodes.filter(n=>n.level>7).length,                   c:"#d97706" },
            { l:"Critical nodes",      v:nodes.filter(n=>n.status==="CRITICAL").length,        c:"#ba1a1a" },
          ].map(r => (
            <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #e2e2e2", fontSize:12 }}>
              <span style={{ color:"#434655" }}>{r.l}</span>
              <span style={{ fontFamily:"JetBrains Mono, monospace", fontWeight:600, color:r.c }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
