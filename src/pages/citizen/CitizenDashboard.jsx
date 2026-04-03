import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import maplibregl from 'maplibre-gl';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // MapLibre init (a simple display)
    const map = new maplibregl.Map({
      container: 'citizen-map',
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [78.4867, 17.3850], // Hyderabad center
      zoom: 12
    });

    return () => map.remove();
  }, []);

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest relative font-body">
      <div className="p-4 bg-primary text-white flex justify-between items-center shadow-md z-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Citizen Portal</h1>
          <p className="text-xs text-white/70">Welcome, {user?.email}</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-sm bg-white/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all">Sign Out</button>
      </div>

      <div className="flex-1 relative">
        <div id="citizen-map" className="absolute inset-0" />
      </div>

      <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-between gap-4">
        <button 
          onClick={() => navigate('/citizen/my-reports')}
          className="flex-1 bg-white text-primary font-bold py-4 rounded-2xl shadow-lg border border-outline-variant/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">list_alt</span>
          My Reports
        </button>
        <button 
          onClick={() => navigate('/citizen/report')}
          className="flex-1 bg-error text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">add_a_photo</span>
          Report Issue
        </button>
      </div>
    </div>
  );
}
