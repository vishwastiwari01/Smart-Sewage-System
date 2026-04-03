import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCrewNotifications } from '../../hooks/useCrewNotifications';

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

// Build a Google Maps navigation URL
function mapsUrl(lat, lng, label = 'Incident') {
  if (!lat || !lng) return `https://maps.google.com/?q=Hyderabad,India`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

// Time ago helper
function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// Status pill styles
const PRIORITY_STYLE = {
  critical: 'bg-error-container text-on-error-container border-error/20',
  high:     'bg-amber-100 text-amber-700 border-amber-200',
  medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:      'bg-surface-container-high text-on-surface-variant border-outline-variant/40',
};

// Job card for sensor alert
function AlertCard({ alert, onJoin, onResolve, joining }) {
  const lat = alert.latitude;
  const lng = alert.longitude;
  const isJoined = alert.acknowledged_by != null;
  const isResolved = alert.status === 'resolved';

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden mb-3
      ${alert.priority === 'critical' ? 'border-red-700' : 'border-outline-variant/20'}`}>
      {/* Priority stripe */}
      {alert.priority === 'critical' && (
        <div className="h-1 bg-gradient-to-r from-red-500 via-rose-500 to-red-500 animate-pulse" />
      )}
      
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center
              ${alert.priority === 'critical' ? 'bg-error-container' : 'bg-amber-100'}`}>
              <span className="material-symbols-outlined text-base text-error">
                {alert.alert_type === 'gas' ? 'air' : 'flood'}
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-on-surface capitalize">
                {alert.alert_type || 'Sensor'} Alert
              </div>
              <div className="text-[10px] text-outline">Node: {alert.node_id}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${PRIORITY_STYLE[alert.priority] || PRIORITY_STYLE.medium}`}>
              {alert.priority}
            </span>
            <span className="text-[9px] text-outline">{timeAgo(alert.created_at)}</span>
          </div>
        </div>

        {/* Sensor Readings */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-surface-container rounded-xl p-2.5">
            <div className="text-[9px] text-outline uppercase tracking-wider mb-1">💧 Water Level</div>
            <div className="font-bold text-on-surface text-sm">{(alert.water_level || 0).toFixed(1)}%</div>
            <div className="mt-1.5 h-1 bg-slate-600 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(alert.water_level || 0, 100)}%` }} />
            </div>
          </div>
          <div className="bg-surface-container rounded-xl p-2.5">
            <div className="text-[9px] text-outline uppercase tracking-wider mb-1">☁️ Gas Level</div>
            <div className="font-bold text-on-surface text-sm">{(alert.gas_level || 0).toFixed(1)}%</div>
            <div className="mt-1.5 h-1 bg-slate-600 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all"
                style={{ width: `${Math.min(alert.gas_level || 0, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Zone + Actions */}
        <div className="flex items-center gap-1 mb-3">
          <span className="material-symbols-outlined text-sm text-outline">location_on</span>
          <span className="text-xs text-outline">{alert.zone} · Hyderabad</span>
        </div>

        <div className="flex gap-2">
          {/* Navigate button */}
          <a href={mapsUrl(lat, lng, alert.node_id)} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2.5 bg-surface-container-high text-on-surface text-xs font-bold rounded-xl active:scale-95 transition border border-outline-variant/40">
            <span className="material-symbols-outlined text-sm">directions</span>
            Navigate
          </a>

          {isResolved ? (
            <div className="flex-1 py-2.5 bg-green-900/30 text-green-400 text-xs font-bold rounded-xl text-center border border-green-800">
              ✓ Resolved
            </div>
          ) : !isJoined ? (
            <button onClick={() => onJoin(alert.id)} disabled={joining === alert.id}
              className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5">
              {joining === alert.id
                ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-sm">check_circle</span>
              }
              Accept Job
            </button>
          ) : (
            <button onClick={() => onResolve(alert.id)} disabled={joining === alert.id}
              className="flex-1 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-sm">task_alt</span>
              Mark Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Job card for citizen report (like Zomato order)
function ReportCard({ report, onJoin, onResolve, joining, crewId }) {
  const loc = report.location || {};
  const lat = loc.lat || loc.latitude;
  const lng = loc.lng || loc.longitude;
  const isMyJob = report.assigned_to === crewId;
  const isResolved = report.status === 'resolved';

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden mb-3
      ${report.status === 'pending' ? 'border-amber-700/50' : 'border-outline-variant/20'}`}>
      
      {/* NEW badge for unassigned */}
      {report.status === 'pending' && (
        <div className="h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />
      )}

      <div className="flex">
        {/* Photo */}
        {report.image_url ? (
          <div className="w-24 shrink-0">
            <img src={report.image_url} alt="Report" className="w-full h-full object-cover"
              style={{ minHeight: 100 }} />
          </div>
        ) : (
          <div className="w-16 shrink-0 bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-outline">image_not_supported</span>
          </div>
        )}

        <div className="flex-1 p-3">
          {/* Status + Time */}
          <div className="flex justify-between items-start mb-1.5">
            <div className="flex items-center gap-1.5">
              {report.status === 'pending' && (
                <span className="text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase animate-pulse">
                  New Job
                </span>
              )}
              {isMyJob && report.status === 'assigned' && (
                <span className="text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full uppercase">
                  Your Job
                </span>
              )}
              {isResolved && (
                <span className="text-[9px] font-bold bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full uppercase">
                  Resolved
                </span>
              )}
            </div>
            <span className="text-[9px] text-outline">{timeAgo(report.created_at)}</span>
          </div>

          {/* Description */}
          <p className="text-xs font-medium text-on-surface line-clamp-2 leading-tight mb-2">
            {report.description}
          </p>

          {/* Location */}
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px] text-outline">location_on</span>
            <span className="text-[10px] text-outline">
              {report.zone || 'Hyderabad'}
              {lat && lng ? ` · ${parseFloat(lat).toFixed(4)}°N, ${parseFloat(lng).toFixed(4)}°E` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="px-3 pb-3 flex gap-2 mt-1">
        {/* Navigate */}
        <a href={mapsUrl(lat, lng)} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-2.5 bg-surface-container-high text-on-surface text-xs font-bold rounded-xl active:scale-95 transition border border-outline-variant/40">
          <span className="material-symbols-outlined text-sm">directions</span>
          Navigate
        </a>

        {isResolved ? (
          <div className="flex-1 py-2.5 bg-green-900/30 text-green-400 text-xs font-bold rounded-xl text-center border border-green-800">
            ✓ Completed
          </div>
        ) : !isMyJob && report.status === 'pending' ? (
          <button onClick={() => onJoin(report.id)} disabled={joining === report.id}
            className="flex-1 py-2.5 bg-amber-500 text-white text-xs font-bold rounded-xl active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5">
            {joining === report.id
              ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="material-symbols-outlined text-sm">directions_run</span>
            }
            Accept Job
          </button>
        ) : isMyJob ? (
          <button onClick={() => onResolve(report.id)} disabled={joining === report.id}
            className="flex-1 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">task_alt</span>
            Mark Done
          </button>
        ) : (
          <div className="flex-1 py-2.5 bg-surface-container text-outline text-xs font-medium rounded-xl text-center">
            Assigned to another crew
          </div>
        )}
      </div>
    </div>
  );
}

export default function CrewDashboard() {
  const { user, signOut } = useAuth();
  const crewZone = user?.zone || 'Zone-1';

  const [alerts, setAlerts]       = useState([]);
  const [reports, setReports]     = useState([]);
  const [tab, setTab]             = useState('reports'); // default to reports since more intuitive
  const [newCount, setNewCount]   = useState(0);
  const [joining, setJoining]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const mapRef = useRef(null);
  const containerRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      // Fetch alerts — try all priorities for crew's zone
      const { data: alertData, error: alertErr } = await supabase
        .from('alerts')
        .select('*')
        .in('status', ['active', 'acknowledged'])
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch reports — try ALL pending/assigned reports (not just zone filtered)
      // The zone filter depends on RLS being configured. We fetch broadly and filter in JS.
      const { data: reportData, error: reportErr } = await supabase
        .from('reports')
        .select('*')
        .in('status', ['pending', 'assigned', 'resolved'])
        .order('created_at', { ascending: false })
        .limit(30);

      if (alertErr) console.warn('Alert fetch error (RLS may need setup):', alertErr.message);
      if (reportErr) console.warn('Report fetch error (RLS may need setup):', reportErr.message);

      if (alertData) setAlerts(alertData);
      if (reportData) setReports(reportData);

      // Show setup hint if both return nothing and there's an RLS error
      if ((!alertData?.length && !reportData?.length) && (alertErr || reportErr)) {
        setFetchError('rls');
      }
    } catch (err) {
      console.error('loadData failure:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Map
  useEffect(() => {
    let cancelled = false;
    loadML().then(ml => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = new ml.Map({
        container: containerRef.current,
        style: CARTO,
        center: [78.4867, 17.3850],
        zoom: 11,
        attributionControl: false,
      });
      mapRef.current = map;

      // Add markers for reports once map loads
      map.on('load', () => {
        reports.forEach(r => {
          const loc = r.location || {};
          const lat = loc.lat || loc.latitude;
          const lng = loc.lng || loc.longitude;
          if (lat && lng && !cancelled) {
            new ml.Marker({ color: r.status === 'pending' ? '#f59e0b' : '#3b82f6' })
              .setLngLat([lng, lat])
              .addTo(map);
          }
        });
      });
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []); // eslint-disable-line

  // Realtime
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

  // Accept sensor alert
  const joinAlert = async (alertId) => {
    setJoining(alertId);
    const { error } = await supabase.from('alerts')
      .update({ status: 'acknowledged', acknowledged_by: user.id })
      .eq('id', alertId);
    if (!error) {
      setAlerts(prev => prev.map(a => a.id === alertId
        ? { ...a, status: 'acknowledged', acknowledged_by: user.id } : a));
    }
    setJoining(null);
  };

  // Resolve sensor alert
  const resolveAlert = async (alertId) => {
    setJoining(alertId);
    const { error } = await supabase.from('alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', alertId);
    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    }
    setJoining(null);
  };

  // Accept citizen report
  const joinReport = async (reportId) => {
    setJoining(reportId);
    const { error } = await supabase.from('reports')
      .update({ status: 'assigned', assigned_to: user.id })
      .eq('id', reportId);
    if (!error) {
      setReports(prev => prev.map(r => r.id === reportId
        ? { ...r, status: 'assigned', assigned_to: user.id } : r));
    }
    setJoining(null);
  };

  // Resolve citizen report
  const resolveReport = async (reportId) => {
    setJoining(reportId);
    const { error } = await supabase.from('reports')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', reportId);
    if (!error) {
      setReports(prev => prev.map(r => r.id === reportId
        ? { ...r, status: 'resolved' } : r));
    }
    setJoining(null);
  };

  const pendingReports  = reports.filter(r => r.status === 'pending');
  const myReports       = reports.filter(r => r.assigned_to === user?.id);
  const activeAlerts    = alerts.filter(a => a.status === 'active');
  const acceptedAlerts  = alerts.filter(a => a.status === 'acknowledged' && a.acknowledged_by === user?.id);

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* Header */}
      <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-outline-variant/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">engineering</span>
          </div>
          <div>
            <h1 className="font-bold text-on-surface tracking-tight">Crew Dispatch</h1>
            <p className="text-[10px] text-outline">{crewZone} · {user?.email?.split('@')[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <div className="bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">notifications_active</span>
              {newCount} New
            </div>
          )}
          <button onClick={signOut} className="text-xs bg-surface-container-high border border-outline-variant/40 px-3 py-1.5 rounded-lg text-on-surface-variant active:scale-95 transition font-medium">
            Sign Out
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="h-36 relative border-b-2 border-primary/30 shrink-0 bg-background">
        <div ref={containerRef} className="absolute inset-0" />
        <div className="absolute top-2 left-2 bg-white/90 text-on-surface text-[10px] px-2 py-1 rounded-lg font-bold flex items-center gap-1.5 backdrop-blur">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Live Map · {crewZone}
        </div>
        {/* Map legend */}
        <div className="absolute bottom-2 right-2 bg-white/90 text-on-surface text-[9px] px-2 py-1 rounded-lg backdrop-blur flex gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full inline-block"/>Citizen Report</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full inline-block"/>Assigned</span>
        </div>
      </div>

      {/* Stats strips */}
      <div className="bg-white px-4 py-2 flex gap-4 border-b border-outline-variant/20 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 #ef4444 rounded-full animate-pulse" />
          <span className="text-xs text-on-surface-variant">{activeAlerts.length} Sensor Alert{activeAlerts.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 bg-amber-400 rounded-full" />
          <span className="text-xs text-on-surface-variant">{pendingReports.length} New Report{pendingReports.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 bg-blue-400 rounded-full" />
          <span className="text-xs text-on-surface-variant">{myReports.length} My Job{myReports.length !== 1 ? 's' : ''}</span>
        </div>
        <button onClick={() => { setNewCount(0); loadData(); }}
          className="ml-auto text-[10px] text-primary font-medium flex items-center gap-1 shrink-0">
          <span className="material-symbols-outlined text-xs">refresh</span>Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-outline-variant/20 shrink-0">
        {[
          { id: 'reports', label: 'Citizen Reports', count: reports.length, icon: 'report', badge: pendingReports.length },
          { id: 'alerts',  label: 'Sensor Alerts',   count: alerts.length,  icon: 'sensors', badge: activeAlerts.length },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setNewCount(0); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border-b-2 transition-all
              ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-outline'}`}>
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
            {t.badge > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                ${tab === t.id ? 'bg-primary/20 text-primary' : 'bg-red-600 text-white'}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-background">

        {/* RLS setup hint */}
        {fetchError === 'rls' && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-400">info</span>
              <span className="text-xs font-bold text-amber-400">Database Setup Required</span>
            </div>
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              Run the SQL migration in Supabase SQL Editor to enable crew data access. File: <code className="bg-amber-900/50 px-1 rounded">supabase/migrations/20240402000000_rls_fixes.sql</code>
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center mt-12 gap-3">
            <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/>
            <span className="text-sm text-outline">Loading jobs…</span>
          </div>
        )}

        {/* CITIZEN REPORTS TAB */}
        {!loading && tab === 'reports' && (
          <>
            {/* My active jobs first */}
            {myReports.filter(r => r.status === 'assigned').length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"/>
                  <h3 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Your Active Jobs</h3>
                </div>
                {myReports.filter(r => r.status === 'assigned').map(r => (
                  <ReportCard key={r.id} report={r} onJoin={joinReport}
                    onResolve={resolveReport} joining={joining} crewId={user?.id} />
                ))}
              </div>
            )}

            {/* New incoming jobs */}
            {pendingReports.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"/>
                  <h3 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">New Incoming Jobs</h3>
                </div>
                {pendingReports.map(r => (
                  <ReportCard key={r.id} report={r} onJoin={joinReport}
                    onResolve={resolveReport} joining={joining} crewId={user?.id} />
                ))}
              </div>
            )}

            {reports.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center mt-16 text-center px-6">
                <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">inbox</span>
                <p className="text-sm font-medium text-outline">No reports yet</p>
                <p className="text-xs text-outline mt-1.5 leading-relaxed">
                  When citizens submit reports or the simulation broadcasts alerts, they will appear here as jobs ready to accept.
                </p>
              </div>
            )}

            {/* Resolved jobs */}
            {reports.filter(r => r.status === 'resolved' && r.assigned_to === user?.id).length > 0 && (
              <div className="mt-2">
                <h3 className="text-[11px] font-bold text-outline uppercase tracking-wider mb-3">Completed Today</h3>
                {reports.filter(r => r.status === 'resolved' && r.assigned_to === user?.id).map(r => (
                  <ReportCard key={r.id} report={r} onJoin={joinReport}
                    onResolve={resolveReport} joining={joining} crewId={user?.id} />
                ))}
              </div>
            )}
          </>
        )}

        {/* SENSOR ALERTS TAB */}
        {!loading && tab === 'alerts' && (
          <>
            {/* Accepted alerts */}
            {acceptedAlerts.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"/>
                  <h3 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Your Active Jobs</h3>
                </div>
                {acceptedAlerts.map(a => (
                  <AlertCard key={a.id} alert={a} onJoin={joinAlert} onResolve={resolveAlert} joining={joining} />
                ))}
              </div>
            )}

            {activeAlerts.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 #ef4444 rounded-full animate-pulse"/>
                  <h3 className="text-[11px] font-bold text-error uppercase tracking-wider">Live Sensor Alerts</h3>
                </div>
                {activeAlerts.map(a => (
                  <AlertCard key={a.id} alert={a} onJoin={joinAlert} onResolve={resolveAlert} joining={joining} />
                ))}
              </div>
            )}

            {alerts.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center mt-16 text-center px-6">
                <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">sensors_off</span>
                <p className="text-sm font-medium text-outline">No sensor alerts</p>
                <p className="text-xs text-outline mt-1.5 leading-relaxed">
                  Ask admin to switch to a critical scenario in the Simulation page and enable "Broadcast to Crew" to send live alerts here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
