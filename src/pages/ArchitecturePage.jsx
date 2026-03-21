export default function ArchitecturePage() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-surface-container-lowest border-b border-outline-variant/10 sticky top-0 z-10">
        <div>
          <div className="text-sm font-bold text-on-surface">System Architecture</div>
          <div className="font-label text-[10px] text-outline mt-0.5">SmartFlow v3.0 — Full deployment blueprint for Hyderabad Municipal Corporation</div>
        </div>
        <span className="font-label text-[9px] px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold">B.TECH FINAL YEAR PROJECT</span>
      </div>

      <div className="p-5 space-y-5 max-w-5xl">

        {/* Architecture SVG diagram */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
            <div className="text-xs font-semibold text-on-surface">🏗 End-to-End System Architecture</div>
            <div className="font-label text-[10px] text-outline">IoT → Cloud → AI → Dashboard</div>
          </div>
          <div className="p-4 overflow-x-auto">
            <svg viewBox="0 0 860 370" style={{ width:"100%", minWidth:700, display:"block" }}>
              <defs>
                <marker id="arr-dn" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
                  <polygon points="0 0,7 2.5,0 5" fill="#737686"/>
                </marker>
                <marker id="arr-blue" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
                  <polygon points="0 0,7 2.5,0 5" fill="#004ac6"/>
                </marker>
                <marker id="arr-green" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
                  <polygon points="0 0,7 2.5,0 5" fill="#16a34a"/>
                </marker>
              </defs>

              {/* LAYER 1 label */}
              <text x="30" y="18" fill="#737686" fontSize="8.5" fontFamily="'JetBrains Mono',monospace" fontWeight="700" letterSpacing=".09em">LAYER 1 — IoT SENSOR NODES</text>
              {[
                ["ESP32 #1","Mehdipatnam","#ba1a1a", 30],
                ["ESP32 #2","Old City",   "#ba1a1a",150],
                ["ESP32 #3","Banjara",    "#d97706",270],
                ["ESP32 #4","Kukatpally","#16a34a",390],
                ["ESP32 #5","Hitech",    "#16a34a",510],
              ].map(([label,loc,color,x],i) => (
                <g key={i}>
                  <rect x={x} y={25} width={108} height={52} rx="8"
                    fill={color+"10"} stroke={color+"40"} strokeWidth="1.2"/>
                  <text x={x+54} y={43} textAnchor="middle" fill={color}
                    fontSize="9" fontFamily="'JetBrains Mono',monospace" fontWeight="700">⚡ {label}</text>
                  <text x={x+54} y={56} textAnchor="middle" fill="#434655"
                    fontSize="8" fontFamily="'JetBrains Mono',monospace">{loc}</text>
                  <text x={x+54} y={69} textAnchor="middle" fill="#737686"
                    fontSize="7.5" fontFamily="'JetBrains Mono',monospace">HC-SR04 · MQ-2 · Relay</text>
                  <line x1={x+54} y1={79} x2={x+54} y2={106}
                    stroke="#004ac6" strokeWidth="1" strokeDasharray="4 3" markerEnd="url(#arr-blue)"/>
                  <text x={x+54} y={96} textAnchor="middle" fill="#004ac6"
                    fontSize="7" fontFamily="'JetBrains Mono',monospace">MQTT</text>
                </g>
              ))}

              {/* LAYER 2 label */}
              <text x="30" y="122" fill="#737686" fontSize="8.5" fontFamily="'JetBrains Mono',monospace" fontWeight="700" letterSpacing=".09em">LAYER 2 — MESSAGE BROKER</text>
              <rect x={30} y={128} width={570} height={46} rx="8"
                fill="rgba(0,74,198,0.05)" stroke="rgba(0,74,198,0.25)" strokeWidth="1.2"/>
              <text x="315" y="148" textAnchor="middle" fill="#004ac6"
                fontSize="10" fontFamily="'JetBrains Mono',monospace" fontWeight="700">
                🔀 Mosquitto MQTT Broker — Cloud VM (Port 1883 / 8883 TLS)
              </text>
              <text x="315" y="163" textAnchor="middle" fill="#434655"
                fontSize="8.5" fontFamily="'JetBrains Mono',monospace">
                Topic: sewage/data/{"{"+"node_id"+"}"} · QoS 1 · Retain enabled · TLS encrypted
              </text>

              {/* Arrows 2→3 */}
              {[100,220,340].map(x=>(
                <line key={x} x1={x} y1={176} x2={x} y2={198}
                  stroke="#737686" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#arr-dn)"/>
              ))}

              {/* LAYER 3 label */}
              <text x="30" y="213" fill="#737686" fontSize="8.5" fontFamily="'JetBrains Mono',monospace" fontWeight="700" letterSpacing=".09em">LAYER 3 — DATA PROCESSING & AI ENGINE</text>
              {[
                ["FastAPI",     "Backend",        "REST + WebSocket",     "#6a1edb","#6a1edb10", 30],
                ["TimescaleDB", "Time-Series",    "PostgreSQL+TS",        "#006780","#00678010",160],
                ["AI Engine",   "LSTM/XGBoost",   "Overflow Prediction",  "#d97706","#d9770610",290],
                ["Redis",       "Cache",          "Session + PubSub",     "#004ac6","#004ac610",420],
                ["Celery",      "Worker",         "Async Tasks",          "#16a34a","#16a34a10",550],
              ].map(([title,sub,detail,color,bg,x],i) => (
                <g key={i}>
                  <rect x={x} y={220} width={118} height={52} rx="8"
                    fill={bg} stroke={color+"40"} strokeWidth="1.2"/>
                  <text x={x+59} y={237} textAnchor="middle" fill={color}
                    fontSize="9.5" fontFamily="'JetBrains Mono',monospace" fontWeight="700">{title}</text>
                  <text x={x+59} y={250} textAnchor="middle" fill="#434655"
                    fontSize="8" fontFamily="'JetBrains Mono',monospace">{sub}</text>
                  <text x={x+59} y={264} textAnchor="middle" fill="#737686"
                    fontSize="7.5" fontFamily="'JetBrains Mono',monospace">{detail}</text>
                  <line x1={x+59} y1={274} x2={x+59} y2={298}
                    stroke="#16a34a" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#arr-green)"/>
                </g>
              ))}

              {/* LAYER 4 label */}
              <text x="30" y="312" fill="#737686" fontSize="8.5" fontFamily="'JetBrains Mono',monospace" fontWeight="700" letterSpacing=".09em">LAYER 4 — CLIENTS</text>
              {[
                ["React",        "Dashboard",  "Vercel CDN",      "#004ac6","#004ac610", 30],
                ["Flutter",      "Mobile",     "iOS + Android",   "#6a1edb","#6a1edb10",160],
                ["GHMC",         "Portal",     "Admin panel",     "#16a34a","#16a34a10",290],
                ["SMS Gateway",  "Twilio",     "Public alerts",   "#d97706","#d9770610",420],
                ["Grafana",      "Monitor",    "DevOps",          "#737686","#73768610",550],
              ].map(([title,sub,detail,color,bg,x],i) => (
                <g key={i}>
                  <rect x={x} y={320} width={118} height={46} rx="8"
                    fill={bg} stroke={color+"40"} strokeWidth="1.2"/>
                  <text x={x+59} y={337} textAnchor="middle" fill={color}
                    fontSize="9.5" fontFamily="'JetBrains Mono',monospace" fontWeight="700">{title}</text>
                  <text x={x+59} y={350} textAnchor="middle" fill="#434655"
                    fontSize="8" fontFamily="'JetBrains Mono',monospace">{sub}</text>
                  <text x={x+59} y={362} textAnchor="middle" fill="#737686"
                    fontSize="7.5" fontFamily="'JetBrains Mono',monospace">{detail}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Tech stack grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { title:"🔌 IoT Hardware Layer", color:"text-error", border:"border-red-200", bg:"bg-red-50",
              items:[["Microcontroller","ESP32 (Dual-core 240MHz)"],["Level Sensor","HC-SR04 Ultrasonic"],["Gas Sensor","MQ-2 / MQ-135"],["Temp Sensor","DS18B20 (1-Wire)"],["Actuator","5V Relay Module"],["Protocol","MQTT over WiFi / GSM"],["Power","Solar + Li-Ion backup"]] },
            { title:"⚙️ Backend & Infrastructure", color:"text-purple-700", border:"border-purple-200", bg:"bg-purple-50",
              items:[["API Framework","Python FastAPI"],["MQTT Broker","Mosquitto (Eclipse)"],["Database","PostgreSQL + TimescaleDB"],["Cache","Redis 7"],["Queue","Celery + RabbitMQ"],["Auth","JWT + OAuth 2.0"],["Container","Docker + docker-compose"]] },
            { title:"🤖 AI / ML Layer", color:"text-amber-700", border:"border-amber-200", bg:"bg-amber-50",
              items:[["Model 1","LSTM (TensorFlow/Keras)"],["Model 2","XGBoost (scikit-learn)"],["Model 3","Facebook Prophet"],["Training Data","18 months sensor history"],["Features","Level, gas, rainfall, time"],["Accuracy","91.4% (LSTM best)"],["Inference","<200ms per prediction"]] },
            { title:"🖥 Frontend Layer", color:"text-primary", border:"border-blue-200", bg:"bg-blue-50",
              items:[["Framework","React 18 + React Router"],["Styling","Tailwind CSS (CDN)"],["Maps","MapLibre GL + CARTO"],["Real-time","WebSocket + MQTT.js"],["State","Context API + Hooks"],["Hosting","Vercel"],["Build","Create React App"]] },
            { title:"📱 Mobile App Layer", color:"text-secondary", border:"border-teal-200", bg:"bg-teal-50",
              items:[["Framework","Flutter 3.x (Dart)"],["State","Riverpod"],["Maps","Mapbox SDK"],["Push Notif","Firebase FCM"],["Auth","Firebase Auth"],["Targets","iOS 14+ / Android 10+"],["Storage","Supabase + S3"]] },
            { title:"🔒 Security Layer", color:"text-green-700", border:"border-green-200", bg:"bg-green-50",
              items:[["Auth","JWT (RS256 signed)"],["RBAC","Citizen / Crew / Admin"],["Transport","TLS 1.3 everywhere"],["MQTT","TLS + auth (port 8883)"],["API","Rate limiting + CORS"],["Audit","Full action logging"],["VAPT","OWASP Top-10 tested"]] },
          ].map(s => (
            <div key={s.title} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
              <div className={`px-4 py-2.5 border-b ${s.border} ${s.bg}`}>
                <div className={`text-xs font-bold ${s.color}`}>{s.title}</div>
              </div>
              <table className="w-full">
                <tbody>
                  {s.items.map(([k,v]) => (
                    <tr key={k} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low transition-colors">
                      <td className="py-2 px-3 font-label text-[9.5px] text-outline w-32">{k}</td>
                      <td className="py-2 px-3 text-xs font-medium text-on-surface">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* API table */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
            <div className="text-xs font-semibold text-on-surface">📡 REST API Endpoints</div>
            <span className="font-label text-[9px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold">FastAPI · v1</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {["Method","Endpoint","Description","Auth"].map(h => (
                    <th key={h} className="font-label text-[9.5px] font-bold uppercase tracking-wider text-outline py-2.5 px-4 text-left border-b border-outline-variant/10">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["GET",    "/api/v1/nodes",                  "List all sensor nodes with latest reading",    "Public","bg-blue-50 text-blue-700"],
                  ["GET",    "/api/v1/nodes/{id}/history",     "Time-series data with range params",           "Crew+", "bg-blue-50 text-blue-700"],
                  ["POST",   "/api/v1/incidents",              "Create new incident",                         "Crew+", "bg-green-50 text-green-700"],
                  ["GET",    "/api/v1/incidents",              "List incidents with filters",                 "Crew+", "bg-blue-50 text-blue-700"],
                  ["PATCH",  "/api/v1/incidents/{id}",         "Update incident status / crew",               "Crew+", "bg-amber-50 text-amber-700"],
                  ["GET",    "/api/v1/predict/{node_id}",      "Run AI overflow prediction",                  "Admin", "bg-blue-50 text-blue-700"],
                  ["POST",   "/api/v1/alerts/broadcast",       "Send public SMS alert",                       "Admin", "bg-green-50 text-green-700"],
                  ["GET",    "/api/v1/crews",                  "List field crews + GPS location",             "Admin", "bg-blue-50 text-blue-700"],
                  ["POST",   "/api/v1/complaints",             "Submit citizen complaint",                    "Public","bg-green-50 text-green-700"],
                  ["WS",     "/ws/live",                       "WebSocket: live sensor stream",               "Public","bg-purple-50 text-purple-700"],
                ].map(([method, path, desc, auth, methodCls]) => (
                  <tr key={path} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low transition-colors">
                    <td className="py-2.5 px-4">
                      <span className={`font-label text-[9px] px-2 py-0.5 rounded font-bold ${methodCls}`}>{method}</span>
                    </td>
                    <td className="py-2.5 px-4 font-label text-[10.5px] text-primary">{path}</td>
                    <td className="py-2.5 px-4 text-xs text-on-surface-variant">{desc}</td>
                    <td className="py-2.5 px-4">
                      <span className={`font-label text-[9px] px-1.5 py-0.5 rounded font-semibold ${auth==="Admin"?"bg-error-container text-on-error-container":auth==="Crew+"?"bg-amber-100 text-amber-700":"bg-surface-container text-outline"}`}>{auth}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DB Schema */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/10">
            <div className="text-xs font-semibold text-on-surface">🗄 Database Schema — PostgreSQL + TimescaleDB</div>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            {[
              { table:"sensor_nodes",       pk:"node_id (VARCHAR)", color:"text-primary", bg:"bg-blue-50 border-blue-200",
                cols:["area · ward · location","lat (FLOAT) · lng (FLOAT)","installed_at (TIMESTAMPTZ)","active (BOOLEAN)"] },
              { table:"sensor_readings",    pk:"id (BIGSERIAL)",    color:"text-secondary", bg:"bg-teal-50 border-teal-200",
                cols:["node_id → sensor_nodes","time (TIMESTAMPTZ) ← hypertable","sewage_level_cm (FLOAT)","gas_adc (INT) · pump_status"] },
              { table:"incidents",          pk:"id (SERIAL)",       color:"text-error", bg:"bg-red-50 border-red-200",
                cols:["node_id → sensor_nodes","severity · status (ENUM)","crew_id → field_crews","reported_at · resolved_at"] },
              { table:"field_crews",        pk:"id (SERIAL)",       color:"text-amber-700", bg:"bg-amber-50 border-amber-200",
                cols:["name · phone · team","status (ENUM)","last_lat · last_lng (FLOAT)","last_seen (TIMESTAMPTZ)"] },
              { table:"citizen_complaints", pk:"id (SERIAL)",       color:"text-purple-700", bg:"bg-purple-50 border-purple-200",
                cols:["citizen_name · phone","area · complaint_type (ENUM)","photo_url · lat · lng","status (ENUM)"] },
              { table:"ai_predictions",     pk:"id (SERIAL)",       color:"text-green-700", bg:"bg-green-50 border-green-200",
                cols:["node_id → sensor_nodes","model · confidence (ENUM)","probability (FLOAT)","hours_to_overflow · rainfall"] },
            ].map(t => (
              <div key={t.table} className={`rounded-xl border ${t.bg} overflow-hidden`}>
                <div className="px-3 py-2 border-b border-current/20">
                  <div className={`font-label text-[10px] font-bold ${t.color}`}>{t.table}</div>
                  <div className="font-label text-[9px] text-outline mt-0.5">PK: {t.pk}</div>
                </div>
                <div className="p-2">
                  {t.cols.map((col,i) => (
                    <div key={i} className="font-label text-[9.5px] text-on-surface-variant py-1 border-b border-outline-variant/10 last:border-0">{col}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
