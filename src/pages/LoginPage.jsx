import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ROLES = [
  { id:"admin",  label:"Admin",       sub:"GHMC Municipal Officer",  icon:"admin_panel_settings", email:"admin@ghmc.gov.in",    pass:"admin123" },
  { id:"crew",   label:"Field Crew",  sub:"Sanitation Engineer",     icon:"engineering",          email:"crew@ghmc.gov.in",     pass:"crew123" },
  { id:"citizen",label:"Citizen",     sub:"Public Portal",           icon:"person",               email:"citizen@hyderabad.in", pass:"citizen123" },
];

export default function LoginPage({ onLogin }) {
  const navigate  = useNavigate();
  const [role, setRole]     = useState("admin");
  const [email, setEmail]   = useState("admin@ghmc.gov.in");
  const [pass, setPass]     = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function selectRole(r) {
    setRole(r.id);
    setEmail(r.email);
    setPass("");
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const r = ROLES.find(r => r.id === role);
    setTimeout(() => {
      if (email === r.email && pass === r.pass) {
        onLogin({ name: r.label === "Admin" ? "Vishwas Tiwari" : r.label === "Field Crew" ? "Ravi Kumar" : "Mohammed Riyaz", role: r.label, roleId: r.id });
        navigate("/dashboard");
      } else {
        setError("Invalid credentials. Check the hint below.");
        setLoading(false);
      }
    }, 800);
  }

  const selectedRole = ROLES.find(r => r.id === role);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage:"linear-gradient(to right,rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"40px 40px" }}/>
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <span className="text-white text-sm font-bold font-label">SF</span>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">SmartFlow</span>
            <span className="font-label text-[9px] text-white/40 uppercase tracking-widest">V3.0</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight leading-tight mb-4">
            GHMC Smart City<br/>Command Centre
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-md">
            Real-time sewage intelligence platform for the Greater Hyderabad Municipal Corporation. Preventing urban flooding through AI-powered prediction.
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-4">
          {[
            { val:"09", label:"Sensor Nodes" },
            { val:"91%", label:"AI Accuracy" },
            { val:"6", label:"City Zones" },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold font-label text-white">{s.val}</div>
              <div className="text-[10px] font-label text-white/50 uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-on-surface tracking-tight mb-1">Sign in to SmartFlow</h2>
            <p className="text-on-surface-variant text-sm">Select your role and enter credentials.</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {ROLES.map(r => (
              <button key={r.id} onClick={() => selectRole(r)}
                className={`p-3 rounded-xl border text-left transition-all
                  ${role===r.id
                    ? "bg-primary/8 border-primary/30 shadow-sm"
                    : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container-low"}`}>
                <span className={`material-symbols-outlined text-xl block mb-1.5 ${role===r.id?"text-primary":"text-on-surface-variant"}`}>{r.icon}</span>
                <div className={`text-xs font-semibold ${role===r.id?"text-primary":"text-on-surface"}`}>{r.label}</div>
                <div className="font-label text-[9px] text-outline mt-0.5">{r.sub}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-label text-[10px] uppercase tracking-wider text-outline block mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"/>
            </div>
            <div>
              <label className="font-label text-[10px] uppercase tracking-wider text-outline block mb-1.5">Password</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} required
                placeholder={`${selectedRole?.pass}`}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                style={{ fontFamily:"JetBrains Mono, monospace" }}/>
              <p className="font-label text-[10px] text-outline mt-1.5">Hint: password is <code className="bg-surface-container px-1 rounded">{selectedRole?.pass}</code></p>
            </div>

            {error && (
              <div className="bg-error-container text-on-error-container text-xs p-3 rounded-lg border border-error-container">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-[.99] disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing in…</>
                : <><span className="material-symbols-outlined text-[17px]">login</span>Sign In</>
              }
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant/20">
            <p className="text-[11px] text-outline text-center font-label">
              SmartFlow © 2026 · GHMC Intelligence Division · B.Tech Final Year Project
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
