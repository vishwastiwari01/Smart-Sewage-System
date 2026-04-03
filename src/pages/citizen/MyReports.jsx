import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  assigned: { label: 'Assigned', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolved: { label: 'Resolved', cls: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
};

export default function MyReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user?.id) return;
    async function fetchReports() {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('citizen_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setReports(data);
      setLoading(false);
    }
    fetchReports();

    // Realtime updates on own reports
    const channel = supabase
      .channel(`my-reports-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'reports',
        filter: `citizen_id=eq.${user.id}`
      }, (payload) => {
        setReports(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
        // Browser notification when status changes
        if (Notification.permission === 'granted') {
          new Notification('📋 Report Updated', {
            body: `Your report status changed to: ${payload.new.status}`,
          });
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  const counts = { all: reports.length, pending: 0, assigned: 0, resolved: 0 };
  reports.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center gap-3 shadow-sm shrink-0">
        <button
          onClick={() => navigate('/citizen/dashboard')}
          className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center active:scale-90 transition"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold">My Reports</h1>
          <p className="text-[10px] text-white/60">{reports.length} total submissions</p>
        </div>
        <button
          onClick={() => navigate('/citizen/report')}
          className="bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">add</span>New
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 py-3 bg-white border-b border-slate-100 shrink-0 overflow-x-auto">
        {['all','pending','assigned','resolved'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all
              ${filter === f ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f] ?? 0})
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center mt-16 gap-3">
            <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/>
            <p className="text-sm text-slate-400">Loading your reports…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-16 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-3">inbox</span>
            <p className="text-sm font-medium text-on-surface">No {filter !== 'all' ? filter : ''} reports yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-6">Submit a report if you notice a sewage issue in your area</p>
            <button
              onClick={() => navigate('/citizen/report')}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition"
            >
              Report an Issue
            </button>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((r) => {
            const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
            return (
              <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex gap-0">
                  {r.image_url && (
                    <div className="w-28 shrink-0">
                      <img src={r.image_url} alt="Report" className="w-full h-full object-cover" style={{ minHeight: 90 }} />
                    </div>
                  )}
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <p className="text-sm font-medium text-on-surface line-clamp-2 leading-tight">{r.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${sc.cls}`}>
                        {sc.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="px-3 pb-3">
                  <div className="flex items-center gap-1.5 mt-1">
                    {['pending','assigned','resolved'].map((s, i) => {
                      const stages = ['pending','assigned','resolved'];
                      const currentIdx = stages.indexOf(r.status);
                      const filled = i <= currentIdx && r.status !== 'rejected';
                      return (
                        <React.Fragment key={s}>
                          <div className={`text-[8px] font-bold uppercase ${filled ? 'text-primary' : 'text-slate-300'}`}>{s}</div>
                          {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${filled && currentIdx > i ? 'bg-primary' : 'bg-slate-200'}`} />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
