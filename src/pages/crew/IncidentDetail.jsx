import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alertData, setAlertData] = useState(null);
  const [ppeChecked, setPpeChecked] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    async function fetchAlert() {
      const { data } = await supabase.from('alerts').select('*').eq('id', id).single();
      setAlertData(data);
    }
    fetchAlert();
  }, [id]);

  const handleResolve = async () => {
    if (!ppeChecked) {
      alert("Please confirm PPE check.");
      return;
    }
    setResolving(true);
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id);
      
    setResolving(false);
    if (!error) {
      navigate('/crew/dashboard');
    } else {
      alert("Error: " + error.message);
    }
  };

  if (!alertData) return <div className="p-8 text-center bg-surface h-full">Loading incident...</div>;

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-4 bg-inverse-surface text-inverse-on-surface flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="material-symbols-outlined pb-1">arrow_back</button>
        <h1 className="text-xl font-bold">Resolve Incident</h1>
      </div>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">{alertData.node_id}</h2>
          <p className="text-error font-bold uppercase tracking-wider text-sm">{alertData.alert_type} ALERT</p>
        </div>

        <div className="bg-surface-container rounded-xl p-4 grid grid-cols-2 gap-4 border border-outline-variant/30">
          <div>
            <div className="text-xs text-outline uppercase font-bold tracking-wider">Water Level</div>
            <div className="text-xl font-label">{alertData.water_level}%</div>
          </div>
          <div>
            <div className="text-xs text-outline uppercase font-bold tracking-wider">Gas Level</div>
            <div className="text-xl font-label">{alertData.gas_level}%</div>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl">
          <h3 className="font-bold text-primary flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined">health_and_safety</span>
            Mandatory PPE Checklist
          </h3>
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={ppeChecked}
              onChange={(e) => setPpeChecked(e.target.checked)}
              className="mt-1 w-5 h-5 accent-primary"
            />
            <span className="text-sm text-on-surface leading-tight">
              I confirm I am wearing standard gas mask, reflective gear, and safety boots required for confined space entry.
            </span>
          </label>
        </div>
      </div>

      <div className="p-4 border-t border-outline-variant/20 bg-white">
        <button 
          onClick={handleResolve}
          disabled={!ppeChecked || resolving}
          className="w-full bg-primary text-white font-bold py-4 rounded-xl active:scale-95 transition disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {resolving ? <span className="material-symbols-outlined animate-spin hidden">sync</span> : "Mark as Resolved"}
        </button>
      </div>
    </div>
  );
}
