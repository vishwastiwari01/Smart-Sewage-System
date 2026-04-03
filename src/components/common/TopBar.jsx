import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const NAV = [
  { to:"/dashboard",    label:"Dashboard",    icon:"dashboard" },
  { to:"/incidents",    label:"Incidents",    icon:"warning" },
  { to:"/ai",           label:"AI Predict",   icon:"psychology" },
  { to:"/analytics",    label:"Analytics",    icon:"bar_chart" },
  { to:"/safety",       label:"Safety",       icon:"health_and_safety" },
  { to:"/twin",         label:"Digital Twin", icon:"hub" },
  { to:"/sim",          label:"ESP32 Sim",    icon:"memory" },
  { to:"/messages",     label:"Messages",     icon:"campaign" },
  { to:"/architecture", label:"Architecture", icon:"schema" },
];

export default function TopBar({ critCount = 0, warnCount = 0, user, onLogout }) {
  const [clock, setClock] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-IN", { hour12:false }));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-outline-variant/20 fixed top-0 w-full z-50 h-12 flex items-center justify-between px-5">
      <div className="flex items-center gap-6">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold font-label">SF</span>
          </div>
          <span className="font-bold text-on-surface tracking-tight text-sm">SmartFlow</span>
          <span className="font-label text-[9px] text-outline uppercase tracking-widest hidden lg:block">GHMC · v3.0</span>
        </NavLink>
        <div className="h-4 w-px bg-outline-variant/30"/>
        <nav className="flex items-center gap-0.5 overflow-x-auto custom-scrollbar">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-medium rounded-md transition-all whitespace-nowrap
                 ${isActive
                   ? "bg-primary/8 text-primary"
                   : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"}`
              }>
              <span className="material-symbols-outlined text-[15px]">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {critCount > 0 && (
          <span className="font-label text-[10px] px-2 py-0.5 bg-error-container text-on-error-container rounded-sm">
            {critCount} CRITICAL
          </span>
        )}
        {warnCount > 0 && (
          <span className="font-label text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-sm">
            {warnCount} WARN
          </span>
        )}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low rounded-full">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>
          <span className="font-label text-[10px] text-outline">MQTT LIVE</span>
        </div>
        <span className="font-label text-[10.5px] text-outline hidden sm:block">{clock}</span>
        {user && (
          <div className="flex items-center gap-3 ml-2 border-l border-outline-variant/30 pl-3">
            <div className="text-right hidden md:block">
              <div className="text-[11px] font-semibold text-on-surface">{user.name || user.email?.split('@')[0]}</div>
              <div className="font-label text-[9px] text-outline uppercase">{user.role}</div>
            </div>
            <button onClick={onLogout}
              className="text-xs bg-surface-container-high border border-outline-variant/40 px-3 py-1.5 rounded-lg text-on-surface-variant active:scale-95 transition font-medium hover:bg-surface-container-highest">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
