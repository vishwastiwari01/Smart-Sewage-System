import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const CARTO = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

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

export default function CitizenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [nearbyAlerts, setNearbyAlerts] = useState([
    { id: 1, type: 'Overflow', location: 'Mehdipatnam', time: '10m ago', severity: 'high' },
    { id: 2, type: 'Gas Alert', location: 'Old City', time: '35m ago', severity: 'medium' }
  ]);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login'; // Hard reload to clear all states
  };

  return (
    <div className="flex flex-col h-screen bg-surface-container-lowest overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-primary text-white flex justify-between items-center shadow-lg z-20 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Citizen Portal</h1>
          <p className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">Greater Hyderabad Municipal Corp</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs bg-white/20 px-3 py-1.5 rounded-lg font-bold backdrop-blur active:scale-95 transition-all"
        >
          Sign Out
        </button>
      </div>

      <div className="flex-1 relative flex flex-col">
        {/* Map Background */}
        <div className="absolute inset-0 z-0">
          <div ref={containerRef} className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Dynamic Content Overlay */}
        <div className="relative z-10 flex-1 p-4 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-32">
          {/* Risk Card */}
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Nearby Risk Level</span>
                <h2 className="text-2xl font-bold text-on-surface">Stable</h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
            </div>
            <p className="text-xs text-outline leading-tight">No immediate overflow risk detected in your current vicinity. System is operating normally.</p>
            <div className="mt-4 h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '15%' }} />
            </div>
          </div>

          {/* Live Alerts Panel */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-outline-variant uppercase tracking-widest ml-1">Live Alerts (Nearby)</h3>
            {nearbyAlerts.map(alert => (
              <div key={alert.id} className="bg-white p-3 rounded-2xl shadow-md border border-outline-variant/10 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.severity === 'high' ? 'bg-error-container text-error' : 'bg-amber-100 text-amber-600'}`}>
                  <span className="material-symbols-outlined text-xl">{alert.severity === 'high' ? 'warning' : 'info'}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-on-surface">{alert.type}</span>
                    <span className="text-[10px] text-outline">{alert.time}</span>
                  </div>
                  <p className="text-[11px] text-outline-variant">Identified at {alert.location}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 border border-primary/10 p-4 rounded-3xl italic text-[11px] text-primary text-center">
            "Preventing urban flooding using AI-powered sewage intelligence."
          </div>
        </div>
      </div>

      {/* Persistent Bottom Actions */}
      <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-outline-variant/20 flex gap-3 z-20 shrink-0">
        <button
          onClick={() => navigate('/citizen/my-reports')}
          className="flex-1 bg-white text-on-surface font-bold py-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col items-center gap-1 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-primary">history</span>
          <span className="text-[10px] uppercase tracking-wider">History</span>
        </button>
        <button
          onClick={() => navigate('/citizen/report')}
          className="flex-[2] bg-red-600 text-white font-bold py-4 rounded-2xl shadow-xl flex flex-col items-center gap-1 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">report_gmailerrorred</span>
          <span className="text-[10px] uppercase tracking-wider">Report Problem</span>
        </button>
      </div>
    </div>
  );
}
