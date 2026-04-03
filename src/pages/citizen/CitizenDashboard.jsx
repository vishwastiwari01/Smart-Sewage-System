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

function useRealtimeNotifications(userId, onNew) {
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        onNew?.(payload.new);
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('🌊 SmartFlow Alert', {
            body: payload.new.message,
            icon: '/favicon.ico',
          });
        }
      })
      .subscribe();
    
    // Request permission
    if (Notification.permission === 'default') Notification.requestPermission();

    return () => supabase.removeChannel(channel);
  }, [userId, onNew]);
}

export default function CitizenDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  const [myReports, setMyReports]         = useState([]);
  const [nearbyAlerts, setNearbyAlerts]   = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [showNotifs, setShowNotifs]       = useState(false);
  const [riskLevel, setRiskLevel]         = useState('stable');
  const [loadingData, setLoadingData]     = useState(true);

  // Fetch initial data
  useEffect(() => {
    if (!user?.id) return;
    async function load() {
      setLoadingData(true);
      const [reportsRes, alertsRes, notifsRes] = await Promise.all([
        supabase.from('reports').select('id,status,description,created_at,image_url').eq('citizen_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('alerts').select('*').in('status', ['active','acknowledged']).order('created_at', { ascending: false }).limit(5),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ]);
      
      if (reportsRes.data) setMyReports(reportsRes.data);
      if (alertsRes.data)  {
        setNearbyAlerts(alertsRes.data);
        const criticals = alertsRes.data.filter(a => a.priority === 'critical');
        setRiskLevel(criticals.length > 0 ? 'critical' : alertsRes.data.length > 0 ? 'moderate' : 'stable');
      }
      if (notifsRes.data) {
        setNotifications(notifsRes.data);
        setUnreadCount(notifsRes.data.filter(n => !n.read).length);
      }
      setLoadingData(false);
    }
    load();
  }, [user?.id]);

  // Realtime new notifications
  useRealtimeNotifications(user?.id, (n) => {
    setNotifications(prev => [n, ...prev]);
    setUnreadCount(c => c + 1);
  });

  // Mark notifications read
  async function markAllRead() {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  }

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
      // Add alert markers after map loads
      mapRef.current.on('load', () => {
        nearbyAlerts.forEach(alert => {
          if (alert.latitude && alert.longitude && mapRef.current) {
            new ml.Marker({ color: alert.priority === 'critical' ? '#ef4444' : '#f59e0b' })
              .setLngLat([alert.longitude, alert.latitude])
              .addTo(mapRef.current);
          }
        });
      });
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []); // eslint-disable-line

  const riskConfig = {
    stable:   { label: 'Stable', icon: 'check_circle', iconBg: 'bg-green-100 text-green-600', pct: '12%', color: '#22c55e', msg: 'No immediate overflow risk detected in your vicinity.' },
    moderate: { label: 'Moderate', icon: 'warning', iconBg: 'bg-amber-100 text-amber-600', pct: '55%', color: '#f59e0b', msg: 'Some alerts active nearby. Stay informed and avoid drainage areas.' },
    critical: { label: 'High Risk', icon: 'emergency', iconBg: 'bg-red-100 text-red-600', pct: '90%', color: '#ef4444', msg: 'Critical sewage alerts nearby! Avoid low-lying areas.' },
  };
  const risk = riskConfig[riskLevel];

  const statusStyle = (s) => {
    if (s === 'resolved')  return 'bg-green-50 text-green-700 border-green-200';
    if (s === 'assigned')  return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'rejected')  return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-700 border-amber-200'; // pending
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-3 flex justify-between items-center shadow-lg z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">SF</div>
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight">SmartFlow Citizen</h1>
            <p className="text-[10px] text-white/60 uppercase tracking-wider">
              {user?.email?.split('@')[0] || 'Citizen'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <button
            onClick={() => { setShowNotifs(!showNotifs); markAllRead(); }}
            className="relative w-9 h-9 bg-white/15 rounded-full flex items-center justify-center active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={signOut}
            className="text-xs bg-white/20 px-3 py-1.5 rounded-lg font-bold backdrop-blur active:scale-95 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifs && (
        <div className="absolute top-14 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 bg-primary/5 border-b border-slate-100 flex justify-between items-center">
            <span className="font-bold text-sm text-on-surface">Notifications</span>
            <button onClick={() => setShowNotifs(false)} className="material-symbols-outlined text-lg text-outline">close</button>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 && (
              <div className="p-6 text-center text-xs text-outline">No notifications yet</div>
            )}
            {notifications.map(n => (
              <div key={n.id} className={`px-4 py-3 ${!n.read ? 'bg-primary/3' : ''}`}>
                <p className="text-xs font-medium text-on-surface leading-tight">{n.message}</p>
                <p className="text-[10px] text-outline mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 relative flex flex-col overflow-hidden">
        {/* Map Background */}
        <div className="absolute inset-0 z-0">
          <div ref={containerRef} className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/60 to-transparent pointer-events-none" />
        </div>

        {/* Scrollable content over map */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 pb-32 space-y-4">

          {/* Risk Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Nearby Risk Level</span>
                <h2 className="text-2xl font-bold text-on-surface mt-0.5">{risk.label}</h2>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${risk.iconBg}`}>
                <span className="material-symbols-outlined text-2xl">{risk.icon}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">{risk.msg}</p>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: risk.pct, background: risk.color }} />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'My Reports', val: myReports.length, icon: 'description', color: 'text-primary bg-primary/10' },
              { label: 'Pending', val: myReports.filter(r => r.status === 'pending').length, icon: 'pending', color: 'text-amber-600 bg-amber-50' },
              { label: 'Resolved', val: myReports.filter(r => r.status === 'resolved').length, icon: 'check_circle', color: 'text-green-600 bg-green-50' },
            ].map(s => (
              <div key={s.label} className="bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-sm border border-white/60 text-center">
                <div className={`w-8 h-8 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-1.5`}>
                  <span className="material-symbols-outlined text-lg">{s.icon}</span>
                </div>
                <div className="text-xl font-bold text-on-surface font-label">{s.val}</div>
                <div className="text-[9px] text-outline uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Live Alerts Panel */}
          {nearbyAlerts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Live System Alerts</h3>
              {nearbyAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 
                    ${alert.priority === 'critical' ? 'bg-red-100 text-red-600' : 
                      alert.priority === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-600'}`}>
                    <span className="material-symbols-outlined text-xl">
                      {alert.alert_type === 'gas' ? 'air' : alert.alert_type === 'overflow' ? 'flood' : 'warning'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface capitalize">{alert.alert_type} Alert</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase
                        ${alert.priority === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        {alert.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">Node: {alert.node_id} · Zone: {alert.zone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Reports */}
          {myReports.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Reports</h3>
                <button onClick={() => navigate('/citizen/my-reports')} className="text-[10px] text-primary font-bold">View All</button>
              </div>
              {myReports.slice(0, 2).map(r => (
                <div key={r.id} className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-3 items-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0 overflow-hidden">
                    {r.image_url
                      ? <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                      : <span className="material-symbols-outlined block mt-3 ml-3 text-slate-400">image</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-on-surface line-clamp-1 leading-tight">{r.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${statusStyle(r.status)}`}>{r.status}</span>
                      <span className="text-[9px] text-outline">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-primary/8 border border-primary/15 p-4 rounded-3xl text-center">
            <p className="text-[11px] text-primary italic">"Preventing urban flooding using AI-powered sewage intelligence."</p>
            <p className="text-[9px] text-outline mt-1">GHMC SmartFlow · Hyderabad</p>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="p-4 bg-white border-t border-slate-100 flex gap-3 z-20 shrink-0 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <button
          onClick={() => navigate('/citizen/my-reports')}
          className="flex-1 bg-slate-50 text-on-surface font-bold py-4 rounded-2xl border border-slate-200 flex flex-col items-center gap-1 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-primary text-xl">history</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400">My Reports</span>
        </button>
        <button
          onClick={() => navigate('/citizen/report')}
          className="flex-[2.5] bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 flex flex-col items-center gap-1 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-xl">add_a_photo</span>
          <span className="text-[10px] uppercase tracking-wider font-bold">Report Problem</span>
        </button>
      </div>
    </div>
  );
}
