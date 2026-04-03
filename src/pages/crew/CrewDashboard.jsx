import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCrewNotifications } from '../../hooks/useCrewNotifications';

const CARTO = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

function loadML() {
  return new Promise((resolve, reject) => {
    if (window.maplibregl) { resolve(window.maplibregl); return; }
    if (!document.getElementById("ml-css")) {
      const l = document.createElement("link");
      l.id = "ml-css"; l.rel = "stylesheet";
      l.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
      document.head.appendChild(l);
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
    s.onload = () => resolve(window.maplibregl);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function CrewDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const crewZone = user?.zone || 'Zone-1';

  const [alerts, setAlerts]       = useState([]);
  const [reports, setReports]     = useState([]);
  const [tab, setTab]             = useState('alerts'); // 'alerts' | 'reports'
  const [newCount, setNewCount]   = useState(0);
  const [joining, setJoining]     = useState(null); // alert/report id being claimed
  const [loading, setLoading]     = useState(true);

  const mapRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [alertsRes, reportsRes] = await Promise.all([
        supabase.from('alerts').select('*')
          .in('status', ['active', 'acknowledged'])
          .order('created_at', { ascending: false }),
        supabase.from('reports').select('*')
          .eq('zone', crewZone)
          .in('status', ['pending', 'assigned'])
          .order('created_at', { ascending: false }),
      ]);
      if (alertsRes.data) setAlerts(alertsRes.data);
      if (reportsRes.data) setReports(reportsRes.data);
      setLoading(false);
    }
    fetchData();
  }, [crewZone]);

  // Map
  useEffect(() => {
    let cancelled = false;
    loadML().then(ml => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      mapRef.current = new ml.Map({
        container: containerRef.current,
        style: CARTO,
        center: [78.4867, 17.3850],
        zoom: 12,
        attributionControl: false,
      });
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Realtime via useCrewNotifications
  useCrewNotifications(crewZone, {
    onAlert: (newAlert) => {
      setAlerts(prev => {
        const exists = prev.find(a => a.id === newAlert.id);
        if (exists) return prev.map(a => a.id === newAlert.id ? newAlert : a);
        setNewCount(c => c + 1);
        return [newAlert, ...prev];
      });
    },
    onReport: (newReport) => {
      setReports(prev => {
        const exists = prev.find(r => r.id === newReport.id);
        if (exists) return prev;
        setNewCount(c => c + 1);
        return [newReport, ...prev];
      });
    },
  });

  const acknowledgeAlert = async (alertId) => {
    setJoining(alertId);
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'acknowledged', acknowledged_by: user.id })
      .eq('id', alertId);
    if (!error) {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'acknowledged', acknowledged_by: user.id } : a));
    }
    setJoining(null);
  };

  const joinReport = async (reportId) => {
    setJoining(reportId);
    const { error } = await supabase
      .from('reports')
      .update({ status: 'assigned', assigned_to: user.id })
      .eq('id', reportId);
    if (!error) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'assigned', assigned_to: user.id } : r));
    }
    setJoining(null);
  };

  const getPriorityBadge = (p) => {
    if (p === 'critical') return 'bg-red-100 text-red-700 border border-red-200';
    if (p === 'high')     return 'bg-orange-100 text-orange-700 border border-orange-200';
    return 'bg-blue-50 text-blue-700 border border-blue-200';
  };

  const alertCount  = alerts.filter(a => a.status === 'active').length;
  const reportCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center shrink-0 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg">engineering</span>
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Crew Dispatch</h1>
            <p className="text-[10px] text-slate-400">{crewZone} · {user?.email?.split('@')[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              {newCount} New
            </div>
          )}
          <button onClick={signOut} className="text-xs bg-slate-700 px-3 py-1.5 rounded-lg font-medium text-slate-300 active:scale-95 transition">
            Sign Out
          </button>
        </div>
      </div>

      {/* Map Strip */}
      <div className="h-36 relative border-b-2 border-primary/50 shrink-0">
        <div ref={containerRef} className="absolute inset-0" />
        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/>Live Map Feed
        </div>
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur">
          {crewZone}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-slate-800 px-4 py-2.5 flex gap-4 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
          <span className="text-xs text-slate-300 font-medium">{alertCount} Active Alert{alertCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full"/>
          <span className="text-xs text-slate-300 font-medium">{reportCount} Citizen Report{reportCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setNewCount(0)}
            className="text-[10px] text-slate-500 font-medium"
          >
            Clear badge
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-800 border-b border-slate-700 shrink-0">
        {[
          { id: 'alerts', label: 'Sensor Alerts', count: alerts.length, icon: 'sensors' },
          { id: 'reports', label: 'Citizen Reports', count: reports.length, icon: 'report' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => tab === t.id ? null : (setTab(t.id), setNewCount(0))}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border-b-2 transition-all
              ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
            {t.count > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-primary/20 text-primary' : 'bg-slate-700 text-slate-400'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
        {loading && (
          <div className="flex justify-center mt-10">
            <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/>
          </div>
        )}

        {/* ALERTS TAB */}
        {!loading && tab === 'alerts' && (
          <>
            {alerts.length === 0 && (
              <div className="text-center text-slate-500 text-sm mt-10">
                <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">sensors_off</span>
                No active alerts in your zone.
              </div>
            )}
            {alerts.map(a => (
              <div key={a.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                {a.priority === 'critical' && <div className="h-1 bg-gradient-to-r from-red-500 to-rose-600 animate-pulse"/>}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${getPriorityBadge(a.priority)}`}>
                        {a.priority}
                      </span>
                      <h3 className="font-bold text-white mt-1.5 text-sm">
                        {a.alert_type?.toUpperCase()} — {a.node_id}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Zone: {a.zone}</p>
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(a.created_at).toLocaleTimeString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-slate-700/50 p-2.5 rounded-xl">
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Water Level</div>
                      <div className="font-bold text-white text-sm font-label">{(a.water_level || 0).toFixed(1)}%</div>
                      <div className="mt-1.5 h-1 bg-slate-600 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(a.water_level || 0, 100)}%` }}/>
                      </div>
                    </div>
                    <div className="bg-slate-700/50 p-2.5 rounded-xl">
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Gas Level</div>
                      <div className="font-bold text-white text-sm font-label">{(a.gas_level || 0).toFixed(1)}%</div>
                      <div className="mt-1.5 h-1 bg-slate-600 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(a.gas_level || 0, 100)}%` }}/>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {a.status === 'active' ? (
                      <button
                        onClick={() => acknowledgeAlert(a.id)}
                        disabled={joining === a.id}
                        className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {joining === a.id
                          ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                          : <span className="material-symbols-outlined text-sm">check_circle</span>
                        }
                        Join & Acknowledge
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/crew/incident/${a.id}`)}
                        className="flex-1 py-2.5 bg-slate-700 text-primary border border-primary/30 text-xs font-bold rounded-xl active:scale-95 transition flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        View & Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* REPORTS TAB */}
        {!loading && tab === 'reports' && (
          <>
            {reports.length === 0 && (
              <div className="text-center text-slate-500 text-sm mt-10">
                <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">inbox</span>
                No citizen reports in your zone.
              </div>
            )}
            {reports.map(r => (
              <div key={r.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="flex gap-0">
                  {r.image_url && (
                    <div className="w-24 shrink-0">
                      <img src={r.image_url} alt="Report" className="w-full h-full object-cover" style={{ minHeight: 80 }} />
                    </div>
                  )}
                  <div className="flex-1 p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase
                        ${r.status === 'pending' ? 'bg-amber-900/30 text-amber-400 border-amber-700' : 'bg-blue-900/30 text-blue-400 border-blue-700'}`}>
                        {r.status}
                      </span>
                      <span className="text-[10px] text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-tight mt-1">{r.description}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Zone: {r.zone}</p>
                  </div>
                </div>
                <div className="px-3 pb-3 flex gap-2">
                  {r.status === 'pending' ? (
                    <button
                      onClick={() => joinReport(r.id)}
                      disabled={joining === r.id}
                      className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {joining === r.id
                        ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        : <span className="material-symbols-outlined text-sm">directions_run</span>
                      }
                      Join Report
                    </button>
                  ) : (
                    <div className="text-[10px] text-blue-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Assigned to you
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
