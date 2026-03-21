import { useState } from "react";

const MODES = ["Citizen", "Field Crew", "Admin"];

function PhoneFrame({ children, title, accent = "#38BDF8" }) {
  return (
    <div style={{ width:220, background:"#f3f3f3", borderRadius:28, border:"1px solid #e2e2e2", overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.7)", flexShrink:0 }}>
      {/* Status bar */}
      <div style={{ background:"#f9f9f9", padding:"8px 14px 4px", display:"flex", justifyContent:"space-between", fontSize:8, color:"#737686", fontFamily:"JetBrains Mono, monospace" }}>
        <span>9:41</span>
        <div style={{ display:"flex", gap:3 }}><span>●●●</span><span>WiFi</span><span>🔋</span></div>
      </div>
      {/* App header */}
      <div style={{ background:accent+"18", borderBottom:"1px solid "+accent+"30", padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:22, height:22, borderRadius:6, background:`linear-gradient(135deg, #1D4ED8, ${accent})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", fontWeight:800 }}>SF</div>
        <div>
          <div style={{ fontSize:11, fontWeight:800, color:"#1a1c1c" }}>{title}</div>
          <div style={{ fontSize:8, color:"#737686", fontFamily:"JetBrains Mono, monospace" }}>SmartFlow Hyderabad</div>
        </div>
      </div>
      {/* Content */}
      <div style={{ padding:"10px 10px", minHeight:380, background:"#ffffff" }}>{children}</div>
      {/* Bottom nav */}
      <div style={{ background:"#f3f3f3", borderTop:"1px solid #1A1F2E", display:"flex", padding:"6px 0" }}>
        {["🏠","🗺","📋","👤"].map((icon,i)=>(
          <div key={i} style={{ flex:1, textAlign:"center", fontSize:14, opacity:i===0?1:0.4 }}>{icon}</div>
        ))}
      </div>
    </div>
  );
}

function CitizenApp() {
  const [reported, setReported] = useState(false);
  return (
    <PhoneFrame title="Citizen Portal" accent="#38BDF8">
      {/* Greeting */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11, color:"#434655" }}>Good afternoon,</div>
        <div style={{ fontSize:14, fontWeight:800, color:"#1a1c1c" }}>Mohammed Riyaz 👋</div>
      </div>

      {/* Alert banner */}
      <div style={{ background:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.25)", borderRadius:8, padding:"8px 10px", marginBottom:10, fontSize:10, color:"#F43F5E" }}>
        ⚠️ Sewage overflow near your area (Old City). Crew dispatched.
      </div>

      {/* Report button */}
      {!reported ? (
        <button onClick={()=>setReported(true)} style={{
          width:"100%", background:"linear-gradient(135deg,#1D4ED8,#38BDF8)", border:"none", borderRadius:10, padding:"12px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", marginBottom:10
        }}>
          📍 Report Sewage Issue
        </button>
      ) : (
        <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:10, padding:"12px", marginBottom:10, textAlign:"center" }}>
          <div style={{ fontSize:18, marginBottom:4 }}>✅</div>
          <div style={{ fontSize:11, fontWeight:700, color:"#22C55E" }}>Complaint Submitted!</div>
          <div style={{ fontSize:9, color:"#737686", fontFamily:"'Geist Mono',monospace", marginTop:2 }}>REF: CMP-1822</div>
        </div>
      )}

      {/* My complaints */}
      <div style={{ fontSize:9, color:"#737686", fontFamily:"'Geist Mono',monospace", marginBottom:6, letterSpacing:".08em" }}>MY COMPLAINTS</div>
      {[
        { id:"CMP-1821", type:"Overflow",  status:"In Progress", color:"#F59E0B" },
        { id:"CMP-1819", type:"Blockage",  status:"Open",        color:"#38BDF8" },
        { id:"CMP-1815", type:"Overflow",  status:"Resolved",    color:"#22C55E" },
      ].map(c=>(
        <div key={c.id} style={{ background:"#eeeeee", borderRadius:6, padding:"8px 10px", marginBottom:5, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:10, fontWeight:600, color:"#1a1c1c" }}>{c.type}</div>
            <div style={{ fontSize:8, color:"#737686", fontFamily:"'Geist Mono',monospace" }}>{c.id}</div>
          </div>
          <div style={{ fontSize:8, fontWeight:700, padding:"2px 6px", borderRadius:3, background:c.color+"18", color:c.color, border:`1px solid ${c.color}30` }}>{c.status.toUpperCase()}</div>
        </div>
      ))}

      <div style={{ marginTop:10, fontSize:9, color:"#737686", fontFamily:"'Geist Mono',monospace", marginBottom:5 }}>NEARBY STATUS</div>
      <div style={{ background:"#eeeeee", borderRadius:6, padding:"8px 10px", fontSize:9 }}>
        <div style={{ display:"flex", justifyContent:"space-between", color:"#434655", marginBottom:4 }}>
          <span>Old City Node</span><span style={{ color:"#F43F5E", fontWeight:700 }}>CRITICAL</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", color:"#434655" }}>
          <span>Repair ETA</span><span style={{ color:"#38BDF8", fontFamily:"'Geist Mono',monospace" }}>~22 min</span>
        </div>
      </div>
    </PhoneFrame>
  );
}

function CrewApp() {
  const [taskStatus, setTaskStatus] = useState("PENDING");
  return (
    <PhoneFrame title="Field Crew" accent="#F59E0B">
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11, color:"#434655" }}>Crew C1 ·</div>
        <div style={{ fontSize:14, fontWeight:800, color:"#1a1c1c" }}>Ravi Kumar 🔧</div>
      </div>

      {/* Active task */}
      <div style={{ background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.25)", borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
        <div style={{ fontSize:9, color:"#F43F5E", fontFamily:"'Geist Mono',monospace", marginBottom:4 }}>🚨 ACTIVE TASK — CRITICAL</div>
        <div style={{ fontSize:12, fontWeight:700, color:"#1a1c1c", marginBottom:4 }}>Sewage Overflow — Old City</div>
        <div style={{ fontSize:9, color:"#434655", marginBottom:8 }}>Darulshifa Rd · Node HYD-OC-107</div>
        <div style={{ display:"flex", gap:6 }}>
          {taskStatus === "PENDING" && (
            <>
              <button onClick={()=>setTaskStatus("ACCEPTED")} style={{ flex:1, background:"#22C55E", border:"none", borderRadius:6, padding:"6px", color:"#000", fontSize:9, fontWeight:700, cursor:"pointer" }}>✓ Accept</button>
              <button style={{ flex:1, background:"#eeeeee", border:"1px solid #2E3448", borderRadius:6, padding:"6px", color:"#434655", fontSize:9, cursor:"pointer" }}>Reject</button>
            </>
          )}
          {taskStatus === "ACCEPTED" && (
            <button onClick={()=>setTaskStatus("DONE")} style={{ flex:1, background:"#38BDF8", border:"none", borderRadius:6, padding:"6px", color:"#000", fontSize:9, fontWeight:700, cursor:"pointer" }}>📤 Mark Complete</button>
          )}
          {taskStatus === "DONE" && (
            <div style={{ flex:1, textAlign:"center", color:"#22C55E", fontSize:10, fontWeight:700 }}>✅ Completed!</div>
          )}
        </div>
      </div>

      {/* Gas warning */}
      <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:8, padding:"8px 10px", marginBottom:10 }}>
        <div style={{ fontSize:9, color:"#F59E0B", fontWeight:700 }}>⚠️ Gas Alert at destination</div>
        <div style={{ fontSize:9, color:"#434655", marginTop:2 }}>H₂S: 540 ppm · Wear full PPE</div>
      </div>

      {/* Route */}
      <div style={{ background:"#eeeeee", borderRadius:8, padding:"8px 10px", marginBottom:10 }}>
        <div style={{ fontSize:9, color:"#737686", fontFamily:"'Geist Mono',monospace", marginBottom:5 }}>NAVIGATION</div>
        <div style={{ fontSize:10, color:"#1a1c1c", marginBottom:4 }}>📍 Charminar Road → Darulshifa</div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"#38BDF8", fontFamily:"'Geist Mono',monospace" }}>
          <span>2.3 km</span><span>~8 min</span>
        </div>
      </div>

      {/* Gas readings at site */}
      <div style={{ fontSize:9, color:"#737686", fontFamily:"'Geist Mono',monospace", marginBottom:5 }}>SITE GAS MONITOR</div>
      {[["H₂S","540 ppm","#F43F5E"],["CH₄","280 ppm","#F59E0B"],["NH₃","38 ppm","#22C55E"]].map(([g,v,c])=>(
        <div key={g} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #1A1F2E", fontSize:9 }}>
          <span style={{ color:"#434655" }}>{g}</span>
          <span style={{ color:c, fontFamily:"'Geist Mono',monospace", fontWeight:700 }}>{v}</span>
        </div>
      ))}
    </PhoneFrame>
  );
}

function AdminApp() {
  return (
    <PhoneFrame title="Admin Console" accent="#A78BFA">
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11, color:"#434655" }}>GHMC Admin</div>
        <div style={{ fontSize:14, fontWeight:800, color:"#1a1c1c" }}>City Dashboard 🏙</div>
      </div>

      {/* Quick stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, marginBottom:10 }}>
        {[
          ["Nodes","9","#38BDF8"],["Critical","2","#F43F5E"],["Crews","4","#F59E0B"],["Alerts","5","#A78BFA"]
        ].map(([l,v,c])=>(
          <div key={l} style={{ background:"#eeeeee", borderRadius:7, padding:"8px 10px", textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:8, color:"#737686", fontFamily:"'Geist Mono',monospace" }}>{l.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Critical nodes */}
      <div style={{ fontSize:9, color:"#737686", fontFamily:"'Geist Mono',monospace", marginBottom:5 }}>CRITICAL NODES</div>
      {[
        { node:"HYD-OC-107", area:"Old City",    level:"11.4cm", gas:"720 ADC" },
        { node:"HYD-MP-203", area:"Mehdipatnam", level:"8.7cm",  gas:"540 ADC" },
      ].map(n=>(
        <div key={n.node} style={{ background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.25)", borderRadius:7, padding:"8px 10px", marginBottom:5 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:9, fontWeight:700, color:"#1a1c1c", fontFamily:"'Geist Mono',monospace" }}>{n.node}</span>
            <span style={{ fontSize:8, padding:"1px 5px", background:"rgba(244,63,94,0.2)", color:"#F43F5E", borderRadius:3, fontFamily:"'Geist Mono',monospace" }}>CRITICAL</span>
          </div>
          <div style={{ display:"flex", gap:10, fontSize:8, color:"#434655", fontFamily:"'Geist Mono',monospace" }}>
            <span>💧 {n.level}</span><span>☁️ {n.gas}</span>
          </div>
        </div>
      ))}

      {/* Performance */}
      <div style={{ fontSize:9, color:"#737686", fontFamily:"'Geist Mono',monospace", margin:"10px 0 5px" }}>SYSTEM PERFORMANCE</div>
      {[["Response time","34 min","#22C55E"],["Uptime","99.7%","#22C55E"],["Sensor health","87%","#F59E0B"]].map(([l,v,c])=>(
        <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #1A1F2E", fontSize:9 }}>
          <span style={{ color:"#434655" }}>{l}</span>
          <span style={{ color:c, fontFamily:"'Geist Mono',monospace", fontWeight:700 }}>{v}</span>
        </div>
      ))}
    </PhoneFrame>
  );
}

export default function MobilePage() {
  const [mode, setMode] = useState("Citizen");

  return (
    <div style={{ height:"100%", overflow:"auto", background:"#f9f9f9" }}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid #e2e2e2", background:"#ffffff", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:15, fontWeight:800 }}>SmartFlow Mobile App</div>
          <div style={{ fontSize:12, color:"#434655" }}>Three-role Flutter application — Citizen · Field Crew · Admin</div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {MODES.map(m=>(
            <button key={m} onClick={()=>setMode(m)} className={`btn btn-sm ${mode===m?"btn-primary":"btn-ghost"}`}>{m}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:24 }}>
        {/* Phone previews */}
        <div style={{ display:"flex", gap:30, justifyContent:"center", alignItems:"flex-start", flexWrap:"wrap", marginBottom:32 }}>
          <CitizenApp/>
          <CrewApp/>
          <AdminApp/>
        </div>

        {/* Feature grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, maxWidth:900, margin:"0 auto" }}>
          {[
            { mode:"🏙 Citizen Mode",   color:"#004ac6", features:["Report sewage overflow with photo","Auto-detect GPS location","Track repair progress live","Receive SMS notifications","View nearby node status"] },
            { mode:"🔧 Field Crew Mode", color:"#d97706", features:["View & accept assigned tasks","Navigate to incident location","Real-time gas level alerts","Upload repair photos","Update task completion status"] },
            { mode:"⚙️ Admin Mode",     color:"#6a1edb", features:["Full city infrastructure view","Assign crews to incidents","Monitor sensor data","Analyze performance metrics","Export incident reports"] },
          ].map(s=>(
            <div key={s.mode} className="card">
              <div className="card-header">
                <div className="card-title" style={{ color:s.color }}>{s.mode}</div>
                <span className="badge b-neutral">Flutter</span>
              </div>
              <div className="card-body">
                {s.features.map((f,i)=>(
                  <div key={i} style={{ padding:"5px 0", borderBottom:"1px solid #e2e2e2", fontSize:12, color:"#434655", display:"flex", gap:7 }}>
                    <span style={{ color:s.color }}>→</span>{f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tech stack */}
        <div className="card" style={{ maxWidth:900, margin:"14px auto 0" }}>
          <div className="card-header">
            <div className="card-title">📦 Technology Stack</div>
          </div>
          <div className="card-body" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {[
              { layer:"Frontend",   tech:"Flutter 3.x", sub:"iOS · Android · Web" },
              { layer:"State Mgmt", tech:"Riverpod",    sub:"Reactive state" },
              { layer:"Maps",       tech:"Mapbox SDK",  sub:"GPS + routing" },
              { layer:"Backend",    tech:"FastAPI",     sub:"REST + WebSocket" },
              { layer:"Auth",       tech:"Firebase",    sub:"JWT + OAuth" },
              { layer:"Realtime",   tech:"MQTT + FCM",  sub:"Push notifications" },
              { layer:"Storage",    tech:"Supabase",    sub:"PostgreSQL + S3" },
              { layer:"CI/CD",      tech:"GitHub Actions",sub:"Auto deploy" },
            ].map(t=>(
              <div key={t.layer} style={{ background:"#eeeeee", borderRadius:7, padding:"10px 12px" }}>
                <div style={{ fontSize:9, color:"#737686", fontFamily:"JetBrains Mono, monospace", marginBottom:3 }}>{t.layer.toUpperCase()}</div>
                <div style={{ fontSize:12, fontWeight:700, color:"#004ac6" }}>{t.tech}</div>
                <div style={{ fontSize:10, color:"#737686" }}>{t.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
