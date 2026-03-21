import { useState, useRef, useEffect } from "react";

const INIT_MSGS = [
  { id:1, sender:"SmartFlow AI",        initials:"AI", color:"#004ac6",   channel:"SYSTEM", time:"14:10", prio:"CRITICAL", text:"🚨 OVERFLOW ALERT — Old City Node HYD-OC-107. Level: 11.4cm. Threshold exceeded. Crew C1 dispatched.", count:847,  delivered:true },
  { id:2, sender:"Crew C1 – Ravi Kumar",initials:"RK", color:"#16a34a",   channel:"CREW",   time:"14:12", prio:"INFO",     text:"On route to Old City. ETA 12 min. Full PPE equipped. Node visible from Junction Rd.", reply:true },
  { id:3, sender:"SmartFlow AI",        initials:"AI", color:"#004ac6",   channel:"SYSTEM", time:"14:15", prio:"CRITICAL", text:"⛽ GAS ALERT — Mehdipatnam HYD-MP-203. H₂S: 540 ADC. Mandatory PPE before entry. Area cordoned.", count:1204, delivered:true },
  { id:4, sender:"GHMC Control",        initials:"GH", color:"#6a1edb", channel:"CORP",   time:"14:18", prio:"WARN",     text:"Acknowledged. Ward councillor notified. Media advisory being prepared for Mehdipatnam zone.", reply:true },
  { id:5, sender:"SmartFlow AI",        initials:"AI", color:"#004ac6",   channel:"SYSTEM", time:"14:21", prio:"WARN",     text:"⚠️ LB Nagar HYD-LB-508 approaching threshold — 7.1cm. Monitoring closely. Crew C5 on standby.", count:340,  delivered:true },
];

const QUICK_SCENARIOS = [
  { id:"overflow", color:"#ba1a1a", label:"Overflow Alert",        sender:"SmartFlow AI", prio:"CRITICAL", channel:"SYSTEM", text:"🌊 OVERFLOW CONFIRMED — Old City. Level 11.4cm. Crew C1+C2 dispatched. Public advisory issued. Road blocked near Darulshifa.",  count:1200 },
  { id:"gas",      color:"#ba1a1a", label:"Gas Detection",         sender:"SmartFlow AI", prio:"CRITICAL", channel:"SYSTEM", text:"☁️ TOXIC GAS EMERGENCY — Mehdipatnam. H₂S 720 ppm. ALL PERSONNEL EVACUATE. Emergency services notified. HAZMAT team dispatched.", count:2100 },
  { id:"dispatch", color:"#d97706", label:"Dispatch Crew C4",      sender:"Operations",   prio:"WARN",     channel:"CREW",   text:"🚶 Crew C4 Anand Sharma dispatched to LB Nagar Sector. ETA 9 min. Full PPE required. Gas meter issued.", count:4 },
  { id:"resolved", color:"#16a34a", label:"All Clear",             sender:"SmartFlow AI", prio:"INFO",     channel:"SYSTEM", text:"✅ ALL CLEAR — Old City incident resolved. Level 4.2cm. Normal operations resumed. Area reopened to public.", count:800 },
  { id:"maint",    color:"#004ac6", label:"Maintenance Notice",    sender:"Operations",   prio:"INFO",     channel:"PUBLIC", text:"🔧 Scheduled maintenance Zone 3 nodes on 2026-03-21 06:00–10:00 IST. Brief sensor downtime expected.", count:3200 },
];

const FILTERS = ["All","SYSTEM","CREW","CORP","PUBLIC"];

export default function MessagesPage() {
  const [msgs,     setMsgs]     = useState(INIT_MSGS);
  const [text,     setText]     = useState("");
  const [recs,     setRecs]     = useState(["corp"]);
  const [prio,     setPrio]     = useState("INFO");
  const [filter,   setFilter]   = useState("All");
  const [smsSent,  setSmsSent]  = useState(2847);
  const feedRef = useRef(null);

  useEffect(() => { feedRef.current?.scrollTo({ top:feedRef.current.scrollHeight, behavior:"smooth" }); }, [msgs]);

  const toggleRec = id => setRecs(p => p.includes(id) ? p.filter(r=>r!==id) : [...p,id]);

  function send() {
    if (!text.trim()) return;
    const m = {
      id:Date.now(), sender:"Operations · You", initials:"OP", color:"#d97706",
      channel:"MANUAL", time:new Date().toLocaleTimeString("en-IN",{hour12:false}).slice(0,5),
      prio, text, count:recs.length*250+80, delivered:true,
    };
    setMsgs(p => [...p,m]);
    setSmsSent(s => s + m.count);
    setText("");
  }

  function trigger(sc) {
    const m = {
      id:Date.now(), initials:sc.sender.slice(0,2).toUpperCase(), color:sc.color||"#004ac6",
      time:new Date().toLocaleTimeString("en-IN",{hour12:false}).slice(0,5), delivered:true,
      ...sc,
    };
    setMsgs(p => [...p,m]);
    setSmsSent(s => s + (sc.count||0));
  }

  const filtered = filter==="All" ? msgs : msgs.filter(m=>m.channel===filter);

  const bubbleBg = (m) => {
    if (m.reply) return "#eeeeee";
    return m.prio==="CRITICAL"?"#fef2f2":m.prio==="WARN"?"#fffbeb":"#eff6ff";
  };
  const bubbleBd = (m) => {
    if (m.reply) return "#e2e2e2";
    return m.prio==="CRITICAL"?"#fecaca":m.prio==="WARN"?"#fde68a":"#bfdbfe";
  };

  return (
    <div className="page-full">

      {/* ── LEFT: Compose ── */}
      <div className="sidebar-left" style={{ width:272 }}>
        <div className="panel-section">
          <div className="section-title">Recipients</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
            {[["public","Public SMS","#ba1a1a"],["corp","GHMC Corp","#004ac6"],["crew","Field Crew","#d97706"],["media","Media","#16a34a"]].map(([id,lbl,c]) => (
              <div key={id} onClick={() => toggleRec(id)} style={{
                padding:"4px 10px", borderRadius:5, fontSize:11, fontWeight:600, cursor:"pointer", border:"1px solid", transition:"all .15s",
                background: recs.includes(id) ? c+"18" : "#eeeeee",
                borderColor:recs.includes(id) ? c+"40" : "#e2e2e2",
                color:      recs.includes(id) ? c : "#434655",
              }}>{lbl}</div>
            ))}
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            placeholder="Type alert message…" rows={4}
            style={{ width:"100%", background:"#eeeeee", border:"1px solid #e2e2e2", borderRadius:6, padding:"8px 10px", fontSize:12, color:"#1a1c1c", resize:"none", outline:"none", fontFamily:"Inter, sans-serif", marginBottom:8 }}/>
          <div style={{ display:"flex", gap:5, marginBottom:9 }}>
            {[["INFO","#004ac6"],["WARN","#d97706"],["CRITICAL","#ba1a1a"]].map(([p,c]) => (
              <div key={p} onClick={() => setPrio(p)} style={{
                flex:1, textAlign:"center", padding:"5px", borderRadius:5, fontSize:10, fontWeight:700, cursor:"pointer", border:"1px solid", transition:"all .15s",
                background: prio===p ? c+"18" : "#eeeeee", borderColor: prio===p ? c+"40" : "#e2e2e2", color: prio===p ? c : "#434655",
              }}>{p}</div>
            ))}
          </div>
          <button onClick={send} className="btn btn-primary" style={{ width:"100%", justifyContent:"center" }}>📤 Send Alert</button>
        </div>

        <div className="panel-section">
          <div className="section-title">Quick Scenario Triggers</div>
          {QUICK_SCENARIOS.map(sc => (
            <button key={sc.id} onClick={() => trigger(sc)} style={{
              width:"100%", background:"#f3f3f3", border:"1px solid #e2e2e2", borderRadius:6, padding:"8px 11px", marginBottom:5, cursor:"pointer", textAlign:"left", transition:"all .15s", display:"flex", gap:8, alignItems:"center",
            }}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:sc.color,flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:"#1a1c1c" }}>{sc.label}</div>
                <div style={{ fontSize:10, color:"#737686", marginTop:1 }}>{sc.text.slice(0,48)}…</div>
              </div>
            </button>
          ))}
        </div>

        <div className="panel-section">
          <div className="section-title">Broadcast Stats</div>
          {[["SMS sent today",smsSent.toLocaleString(),"#004ac6"],["Crew notified","12","#d97706"],["Corp alerts","6","#6a1edb"],["Incidents resolved","3","#16a34a"]].map(([l,v,c]) => (
            <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #e2e2e2",fontSize:11 }}>
              <span style={{ color:"#434655" }}>{l}</span>
              <span style={{ fontFamily:"JetBrains Mono, monospace",fontWeight:700,color:c }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CENTRE: Feed ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 14px", borderBottom:"1px solid #e2e2e2", background:"#ffffff", flexShrink:0, gap:8 }}>
          <div style={{ fontWeight:700, fontSize:13 }}>SmartFlow Operations Channel</div>
          <div style={{ display:"flex", gap:5 }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter===f?"btn-primary":"btn-ghost"}`} style={{ height:24,fontSize:10,padding:"0 8px" }}>{f}</button>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ height:24,fontSize:10 }} onClick={() => setMsgs([])}>Clear</button>
          </div>
        </div>

        <div ref={feedRef} style={{ flex:1, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:11 }}>
          {filtered.map(m => (
            <div key={m.id} className="anim-fade">
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                <div style={{ width:26,height:26,borderRadius:7,background:m.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:m.color,border:"1px solid "+m.color+"30",flexShrink:0 }}>{m.initials}</div>
                <span style={{ fontSize:12, fontWeight:600, color:m.color }}>{m.sender}</span>
                <span style={{ fontSize:9.5, color:"#737686", fontFamily:"JetBrains Mono, monospace" }}>{m.time}</span>
                <span className="badge b-neutral" style={{ fontSize:8 }}>{m.channel}</span>
                {m.prio==="CRITICAL" && <span className="badge b-crit" style={{ fontSize:8 }}>CRITICAL</span>}
              </div>
              <div style={{ borderRadius:8, padding:"10px 12px", background:bubbleBg(m), border:"1px solid "+bubbleBd(m), marginLeft:33 }}>
                <div style={{ fontSize:12, lineHeight:1.65, marginBottom:6 }}>{m.text}</div>
                <div style={{ display:"flex", gap:12, fontSize:9.5, color:"#737686", fontFamily:"JetBrains Mono, monospace" }}>
                  <span>{m.prio||"INFO"}</span>
                  {m.count && <span>{m.count.toLocaleString()} recipients</span>}
                  {m.delivered && <span style={{ color:"#16a34a" }}>✓✓ Delivered</span>}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign:"center", color:"#737686", paddingTop:40 }}>No messages in this channel.</div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Crew status ── */}
      <div className="sidebar-right" style={{ width:260 }}>
        <div className="panel-section">
          <div className="section-title">Field Worker Status</div>
          {[
            { name:"Crew C1 — Ravi Kumar",   loc:"Old City · Node #07",    badge:"b-crit",    status:"ON-SITE",  prog:70  },
            { name:"Crew C2 — Suresh Reddy", loc:"Mehdipatnam · Node #03", badge:"b-warn",    status:"EN ROUTE", prog:40  },
            { name:"Crew C3 — Prasad Naidu", loc:"GHMC Depot",              badge:"b-neutral", status:"STANDBY",  prog:0   },
            { name:"Crew C4 — Anand Sharma", loc:"Kompally · Node #02",     badge:"b-safe",    status:"RESOLVED", prog:100 },
            { name:"Crew C5 — Kavitha Devi", loc:"GHMC Depot",              badge:"b-neutral", status:"STANDBY",  prog:0   },
          ].map(w => {
            const progColor = w.prog===100?"#16a34a":w.prog>50?"#004ac6":"#d97706";
            return (
              <div key={w.name} style={{ borderRadius:6,border:"1px solid #e2e2e2",background:"#f3f3f3",padding:"9px 11px",marginBottom:6 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3 }}>
                  <span style={{ fontSize:11.5,fontWeight:600 }}>{w.name.split("—")[1]?.trim()}</span>
                  <span className={`badge ${w.badge}`} style={{ fontSize:8 }}>{w.status}</span>
                </div>
                <div style={{ fontSize:9.5,color:"#434655",fontFamily:"JetBrains Mono, monospace",marginBottom:5 }}>{w.loc}</div>
                <div className="gauge-track" style={{ height:3 }}>
                  <div className="gauge-fill" style={{ width:`${w.prog}%`,background:progColor }}/>
                </div>
              </div>
            );
          })}
        </div>

        <div className="panel-section">
          <div className="section-title">Public Alert Broadcasts</div>
          {[
            { title:"Old City Overflow",     body:"Residents near Darulshifa advised to avoid area. Overflow in progress.", sms:"847",  ago:"13 min", color:"#ba1a1a" },
            { title:"Mehdipatnam Gas Warn",  body:"Elevated gas near X Road. Avoid area. Keep windows closed.",            sms:"1,204", ago:"21 min", color:"#d97706" },
          ].map(a => (
            <div key={a.title} style={{ borderRadius:7, border:`1px solid ${a.color}30`, background:a.color+"08", padding:"9px 11px", marginBottom:7 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5 }}>
                <span style={{ fontSize:11.5,fontWeight:700,color:a.color }}>{a.title}</span>
                <span className={a.color.includes("crit")?"badge b-crit":"badge b-warn"} style={{ fontSize:8 }}>ACTIVE</span>
              </div>
              <div style={{ fontSize:11,color:"#434655",lineHeight:1.5,marginBottom:5 }}>{a.body}</div>
              <div style={{ display:"flex",gap:12,fontSize:9.5,color:"#737686",fontFamily:"JetBrains Mono, monospace" }}>
                <span>{a.sms} SMS</span><span>{a.ago} ago</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
