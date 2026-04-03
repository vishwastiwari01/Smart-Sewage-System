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

  return (
    <div className="flex flex-col h-screen bg-surface-container-lowest">
      <div className="p-4 bg-primary text-white flex justify-between items-center shadow-md z-10 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Citizen Portal</h1>
          <p className="text-xs text-white/70">Welcome, {user?.email}</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut().then(() => navigate('/login'))}
          className="text-sm bg-white/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
        >
          Sign Out
        </button>
      </div>

      <div className="flex-1 relative">
        <div ref={containerRef} className="absolute inset-0" />
      </div>

      <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-between gap-4 z-10">
        <button
          onClick={() => navigate('/citizen/my-reports')}
          className="flex-1 bg-white text-primary font-bold py-4 rounded-2xl shadow-lg border border-outline-variant/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">list_alt</span>
          My Reports
        </button>
        <button
          onClick={() => navigate('/citizen/report')}
          className="flex-1 bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">add_a_photo</span>
          Report Issue
        </button>
      </div>
    </div>
  );
}
