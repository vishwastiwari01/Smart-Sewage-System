import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-on-background font-body">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/20 h-12 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold font-label">SF</span>
            </div>
            <span className="font-bold text-on-surface tracking-tight text-sm">SmartFlow</span>
          </div>
          <div className="hidden md:flex gap-5 items-center">
            {["Solution","Technology","Partnership","AI Predictions","Incidents"].map(l => (
              <a key={l} href="#" className="text-on-surface-variant hover:text-on-surface text-sm transition-colors">{l}</a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/login")}
            className="text-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium">
            Sign in
          </button>
          <button onClick={() => navigate("/login")}
            className="bg-primary text-white px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-primary-container transition-all active:scale-95">
            Launch Dashboard
          </button>
        </div>
      </nav>

      <main className="pt-12">
        {/* Hero */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-surface">
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage:"linear-gradient(to right,rgba(0,74,198,0.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(0,74,198,0.04) 1px,transparent 1px)", backgroundSize:"40px 40px" }}/>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/50 to-background"/>
          <div className="relative w-full max-w-screen-xl mx-auto px-6 py-20">
            <div className="max-w-3xl space-y-6">
              <span className="inline-block py-1 px-3 bg-primary/8 text-primary font-label text-[10px] uppercase tracking-widest rounded-sm border border-primary/15">
                GHMC Technical Sentinel · B.Tech Final Year Project
              </span>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-on-surface leading-[1.1]">
                AI-Powered Sewage<br/>
                <span className="text-primary">Intelligence</span> for<br/>
                Smart Cities
              </h1>
              <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl">
                Real-time IoT monitoring, machine learning overflow predictions, and field crew optimization
                for the Greater Hyderabad Municipal Corporation. Preventing sewage overflows before they happen.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={() => navigate("/login")}
                  className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/15 active:scale-95">
                  Launch Dashboard
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior:'smooth' })}
                  className="bg-surface-container-lowest text-primary px-8 py-3.5 rounded-xl font-bold border border-outline-variant/30 hover:bg-surface-container transition-all active:scale-95">
                  How it Works
                </button>
              </div>
            </div>
          </div>
          {/* Floating stat cards */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3">
            {[
              { label:"ACTIVE NODES",   val:"09", sub:"SENSORS", color:"text-primary" },
              { label:"AI ACCURACY",    val:"91.4%", sub:"CONFIDENCE", color:"text-tertiary" },
              { label:"RESPONSE TIME",  val:"<15",  sub:"MIN TARGET", color:"text-secondary" },
            ].map(s => (
              <div key={s.label} className="bg-surface-container-lowest/90 backdrop-blur p-5 rounded-2xl border border-outline-variant/15 shadow-sm">
                <span className={`font-label text-[10px] uppercase tracking-widest block mb-1.5 ${s.color}`}>{s.label}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl font-bold font-label ${s.color}`}>{s.val}</span>
                  <span className="text-[10px] text-outline font-label">{s.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats bento */}
        <section className="py-10 bg-background">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label:"ACTIVE NODES", val:"09", sub:"Live sensors", bar:90, color:"bg-primary" },
                { label:"LATENCY",      val:"2.0s", sub:"Data refresh", bar:95, color:"bg-primary" },
                { label:"AI ACCURACY",  val:"91.4%", sub:"LSTM model", bar:91, color:"bg-tertiary" },
                { label:"ZONES MANAGED",val:"06", sub:"GHMC divisions", bar:60, color:"bg-secondary" },
              ].map(s => (
                <div key={s.label} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
                  <span className="font-label text-primary text-[10px] uppercase tracking-widest mb-2 block">{s.label}</span>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-bold font-label text-on-surface">{s.val}</span>
                  </div>
                  <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width:`${s.bar}%` }}/>
                  </div>
                  <p className="text-[10px] font-label text-outline mt-2">{s.sub.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 bg-surface-container-low">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6">
              <div className="max-w-xl">
                <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-3">Precision Engineering for Urban Flow</h2>
                <p className="text-on-surface-variant">Hardware reliability meets neural network forecasting to prevent infrastructure failure before it impacts the public.</p>
              </div>
              <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
                System Architecture v3.0
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon:"sensors",    color:"bg-primary/5 group-hover:bg-primary group-hover:text-white", textColor:"text-primary", title:"IoT Sensor Network", desc:"Live monitoring via ESP32 nodes. Industrial-grade hardware delivering high-frequency telemetry at 2-second intervals over MQTT.", meta:"MQTT over TLS 1.3", metaColor:"text-primary" },
                { icon:"psychology", color:"bg-tertiary/5 group-hover:bg-tertiary group-hover:text-white", textColor:"text-tertiary", title:"AI Predictive Models", desc:"LSTM and XGBoost models predict overflows 20+ minutes in advance, allowing proactive municipal response with 91.4% accuracy.", meta:"Precision-Recall Focused", metaColor:"text-tertiary" },
                { icon:"send",       color:"bg-secondary/5 group-hover:bg-secondary group-hover:text-white", textColor:"text-secondary", title:"Automated Dispatch", desc:"Real-time crew assignment with intelligent routing. Citizen reporting bridges residents and GHMC for faster resolution.", meta:"< 15 Minutes Target", metaColor:"text-secondary" },
              ].map(f => (
                <div key={f.title} className="bg-surface-container-lowest p-8 rounded-2xl transition-all hover:-translate-y-1 group cursor-default">
                  <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-6 transition-colors`}>
                    <span className={`material-symbols-outlined text-2xl ${f.textColor}`}>{f.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-3">{f.title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{f.desc}</p>
                  <div className="mt-6 pt-6 border-t border-outline-variant/15">
                    <span className="font-label text-[9px] text-outline uppercase tracking-widest block mb-1">Key Metric</span>
                    <p className={`font-label text-sm font-semibold ${f.metaColor}`}>{f.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* System flow */}
        <section className="py-20 bg-background">
          <div className="max-w-screen-xl mx-auto px-6">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-12 text-center">System Workflow</h2>
            <div className="flex flex-wrap justify-center items-center gap-0">
              {[
                { icon:"sensors",        label:"ESP32 Sensors",      sub:"2s telemetry" },
                { icon:"cell_tower",     label:"MQTT Broker",        sub:"TLS encrypted" },
                { icon:"database",       label:"TimescaleDB",        sub:"Time-series" },
                { icon:"psychology",     label:"AI Engine",          sub:"LSTM / XGBoost" },
                { icon:"dashboard",      label:"City Dashboard",     sub:"Live updates" },
                { icon:"engineering",    label:"Crew Dispatch",      sub:"< 15 min" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-2 px-4 py-3">
                    <div className="w-12 h-12 bg-surface-container-lowest rounded-xl border border-outline-variant/20 flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-primary text-xl">{step.icon}</span>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-semibold text-on-surface">{step.label}</div>
                      <div className="font-label text-[9px] text-outline uppercase tracking-wide">{step.sub}</div>
                    </div>
                  </div>
                  {i < 5 && <span className="material-symbols-outlined text-outline-variant text-lg mx-1">chevron_right</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary">
          <div className="max-w-screen-lg mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Modernizing Hyderabad's Infrastructure.
            </h2>
            <p className="text-white/70 text-lg mb-10">Built for GHMC · B.Tech Final Year Project · Real deployable platform</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={() => navigate("/login")}
                className="bg-white text-primary px-10 py-4 rounded-xl font-bold text-base hover:bg-slate-50 transition-all active:scale-95">
                Launch Admin Console
              </button>
              <button onClick={() => navigate("/login")}
                className="bg-primary-container text-white border border-white/20 px-10 py-4 rounded-xl font-bold text-base hover:bg-blue-600 transition-all active:scale-95">
                Request System Access
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t border-outline-variant/15 py-12 px-8">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white text-xs font-bold font-label">SF</span>
              </div>
              <span className="font-bold text-on-surface text-sm">SmartFlow AI</span>
              <span className="font-label text-[9px] px-2 py-0.5 border border-outline-variant text-outline rounded-sm">V3.0.0</span>
            </div>
            <p className="text-outline text-xs font-label max-w-xs">© 2026 SmartFlow AI. Engineering Precision for GHMC Municipal Infrastructure.</p>
            <p className="text-outline/60 text-[10px] mt-1 font-label uppercase tracking-widest">GHMC INTELLIGENCE DIVISION</p>
          </div>
          <div className="flex flex-wrap gap-10">
            {[
              { heading:"Platform", links:["Dashboard","AI Predictions","Incidents","Analytics"] },
              { heading:"Support",  links:["Documentation","API Status","Contact"] },
              { heading:"Legal",    links:["Privacy Policy","Terms of Service"] },
            ].map(col => (
              <div key={col.heading} className="flex flex-col gap-2">
                <span className="font-label text-[9px] text-primary uppercase font-bold tracking-widest mb-1">{col.heading}</span>
                {col.links.map(l => (
                  <a key={l} href="#" className="text-outline text-xs hover:text-on-surface transition-colors font-label">{l}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
