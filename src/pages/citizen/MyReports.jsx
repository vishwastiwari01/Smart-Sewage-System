import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function MyReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('citizen_id', user?.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) setReports(data);
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) fetchReports();
  }, [user?.id]);

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-4 bg-primary text-white flex items-center gap-4 shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="material-symbols-outlined pb-1">arrow_back</button>
        <h1 className="text-xl font-bold">My Reports</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
        {loading && <div className="text-center text-outline text-sm mt-8">Loading history...</div>}
        {!loading && reports.length === 0 && (
          <div className="text-center text-outline text-sm mt-8 flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl opacity-50 mb-2">inbox</span>
            No reports submitted yet.
          </div>
        )}
        
        {reports.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-outline-variant/20 p-3 flex gap-4">
            <div className="w-20 h-20 bg-surface-container rounded-lg shrink-0 overflow-hidden">
              {r.image_url ? (
                <img src={r.image_url} alt="Report" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined block w-full text-center mt-6 text-outline">image</span>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <p className="text-sm font-semibold text-on-surface line-clamp-2 leading-tight">{r.description}</p>
              <div className="flex justify-between items-center mt-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider 
                  ${r.status === 'resolved' ? 'bg-error-container text-error' : 'bg-primary-fixed text-primary'}`}>
                  {r.status}
                </span>
                <span className="text-[10px] text-outline font-label">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
