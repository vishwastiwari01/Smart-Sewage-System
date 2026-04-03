import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRealtimeAlerts } from '../../hooks/useRealtimeAlerts';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  // Initial fetch of active alerts
  useEffect(() => {
    async function fetchAlerts() {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('zone', user.zone || 'Zone-1')
        .in('status', ['active', 'acknowledged'])
        .order('priority', { ascending: false });
        
      if (data) setAlerts(data);
    }
    fetchAlerts();
    
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
  }, [user.zone]);

  // Use Realtime Hook
  useRealtimeAlerts(user.zone || 'Zone-1', (newAlert) => {
    setAlerts(prev => {
      const exists = prev.find(a => a.id === newAlert.id);
      if (exists) return prev.map(a => a.id === newAlert.id ? newAlert : a);
      return [newAlert, ...prev];
    });
  });

  const getPriorityColor = (p) => {
    if (p === 'critical') return 'text-error bg-error-container';
    if (p === 'high') return 'text-orange-600 bg-orange-100';
    return 'text-primary bg-primary-fixed';
  };

  const acknowledgeAlert = async (alertId) => {
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'acknowledged', acknowledged_by: user.id })
      .eq('id', alertId);
    if (error) alert(error.message);
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-4 bg-inverse-surface text-inverse-on-surface flex justify-between items-center shadow-md z-10 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Crew Dispatch</h1>
          <p className="text-xs text-outline">{user?.zone || 'Zone-1'}</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-sm bg-white/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all">Sign Out</button>
      </div>

      <div className="h-1/3 relative border-b-2 border-primary shrink-0">
        <div ref={containerRef} className="absolute inset-0" />
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur">
          Live Feed Active
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-3 bg-surface-container-lowest">
        <h2 className="font-bold text-on-surface mb-1">Active Incidents</h2>
        {alerts.length === 0 && <p className="text-sm text-outline text-center mt-6">No active incidents in your zone.</p>}
        {alerts.map(a => (
          <div key={a.id} className="bg-white border text-left border-outline-variant/30 rounded-xl p-4 shadow-sm relative overflow-hidden">
            {a.priority === 'critical' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-error animate-pulse" />}
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className={`text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded inline-block ${getPriorityColor(a.priority)}`}>
                  {a.priority} Priority
                </div>
                <h3 className="font-bold text-on-surface mt-1">{a.alert_type?.toUpperCase()} - {a.node_id}</h3>
              </div>
              <span className="text-xs font-label text-outline">{new Date(a.created_at).toLocaleTimeString()}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 my-3">
              <div className="bg-surface-container-low p-2 rounded flex flex-col">
                <span className="text-[10px] text-outline uppercase tracking-wider">Water Lvl</span>
                <span className="font-label font-bold text-on-surface">{(a.water_level || 0).toFixed(1)}%</span>
              </div>
              <div className="bg-surface-container-low p-2 rounded flex flex-col">
                <span className="text-[10px] text-outline uppercase tracking-wider">Gas Lvl</span>
                <span className="font-label font-bold text-on-surface">{(a.gas_level || 0).toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex gap-2">
              {a.status === 'active' ? (
                <button 
                  onClick={() => acknowledgeAlert(a.id)}
                  className="flex-1 py-2 bg-primary text-white text-sm font-bold rounded-lg active:scale-95 transition"
                >
                  Acknowledge
                </button>
              ) : (
                <button 
                  onClick={() => navigate(`/crew/incident/${a.id}`)}
                  className="flex-1 py-2 bg-surface text-primary border border-primary text-sm font-bold rounded-lg active:scale-95 transition"
                >
                  View details & Resolve
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
