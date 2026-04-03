import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const ISSUE_TYPES = [
  { id: 'overflow', label: 'Sewage Overflow', icon: 'flood' },
  { id: 'blockage', label: 'Drain Blocked', icon: 'block' },
  { id: 'bad_smell', label: 'Foul Smell', icon: 'air' },
  { id: 'damage', label: 'Infrastructure Damage', icon: 'construction' },
  { id: 'other', label: 'Other', icon: 'report' },
];

const ZONES = ['Zone-1','Zone-2','Zone-3','Zone-4','Zone-5','Zone-6'];

export default function ReportIssue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [streamActive, setStreamActive] = useState(false);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState('overflow');
  const [zone, setZone] = useState('Zone-1');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cameraMode, setCameraMode] = useState(false); // false = file picker

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
        setCameraMode(true);
      }
    } catch {
      setError('Camera not available. Please use the file upload option below.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setStreamActive(false);
    setCameraMode(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      setPhotoBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const retakePhoto = () => {
    setPhotoBlob(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitReport = async () => {
    if (!photoBlob) { setError('Please attach a photo.'); return; }
    if (!description.trim()) { setError('Please describe the issue.'); return; }

    setUploading(true);
    setError('');
    try {
      // GPS
      const pos = await new Promise((res) =>
        navigator.geolocation.getCurrentPosition(res, () => res({ coords: { latitude: 17.3850, longitude: 78.4867 } }), { timeout: 8000 })
      );

      // Upload photo to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { error: storageErr } = await supabase.storage
        .from('citizen-reports')
        .upload(fileName, photoBlob);

      let publicUrl = null;
      if (!storageErr) {
        const { data } = supabase.storage.from('citizen-reports').getPublicUrl(fileName);
        publicUrl = data?.publicUrl;
      }

      // Insert report
      const { data: reportData, error: dbErr } = await supabase.from('reports').insert({
        citizen_id: user.id,
        description: `[${ISSUE_TYPES.find(t => t.id === issueType)?.label}] ${description}`,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        zone,
        image_url: publicUrl,
        status: 'pending',
        priority: 'medium',
      }).select().single();

      if (dbErr) throw dbErr;

      // Notify admin (insert notification for all admins)
      await supabase.from('notifications').insert({
        user_id: user.id,
        message: `Report submitted: ${issueType} in ${zone}`,
        report_id: reportData?.id,
        priority: 'medium',
      });

      setStep('success');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col h-screen bg-white items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl text-green-600">task_alt</span>
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-2">Report Submitted!</h2>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-8">
          Your report has been sent to GHMC. A field crew will be assigned shortly. You can track status in "My Reports".
        </p>
        <button
          onClick={() => navigate('/citizen/my-reports')}
          className="w-full max-w-xs bg-primary text-white py-4 rounded-2xl font-bold mb-3 active:scale-95 transition"
        >
          View My Reports
        </button>
        <button
          onClick={() => navigate('/citizen/dashboard')}
          className="w-full max-w-xs bg-slate-100 text-on-surface py-4 rounded-2xl font-bold active:scale-95 transition"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="p-4 bg-primary text-white flex items-center gap-3 shadow-sm shrink-0">
        <button onClick={() => navigate(-1)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center active:scale-90 transition">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div>
          <h1 className="text-base font-bold">Report a Problem</h1>
          <p className="text-[10px] text-white/60">GHMC SmartFlow · Citizen Portal</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        {/* Photo Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-bold text-on-surface">Attach Photo</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Capture or upload a photo of the issue</p>
          </div>

          {previewUrl ? (
            <div className="relative aspect-video bg-black mx-4 mb-4 rounded-xl overflow-hidden">
              <img src={previewUrl} alt="Captured" className="w-full h-full object-cover" />
              <button
                onClick={retakePhoto}
                className="absolute top-2 right-2 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
              <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">Photo Ready ✓</div>
            </div>
          ) : streamActive ? (
            <div className="relative aspect-video bg-black mx-4 mb-4 rounded-xl overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full border-4 border-red-400/50 shadow-xl active:scale-90 transition"
                />
                <button onClick={stopCamera} className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center mt-3">
                  <span className="material-symbols-outlined text-white text-base">close</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-4 mb-4 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 p-6 flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-slate-300">add_a_photo</span>
              <div className="flex gap-2">
                <button
                  onClick={startCamera}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 active:scale-95 transition"
                >
                  <span className="material-symbols-outlined text-base">camera_alt</span>Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-100 text-on-surface px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 active:scale-95 transition"
                >
                  <span className="material-symbols-outlined text-base">upload</span>Upload
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Issue Type */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h3 className="text-sm font-bold text-on-surface mb-3">Issue Type</h3>
          <div className="grid grid-cols-2 gap-2">
            {ISSUE_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setIssueType(t.id)}
                className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all active:scale-95
                  ${issueType === t.id ? 'bg-primary/8 border-primary/30' : 'border-slate-100 hover:bg-slate-50'}`}
              >
                <span className={`material-symbols-outlined text-xl ${issueType === t.id ? 'text-primary' : 'text-slate-400'}`}>{t.icon}</span>
                <span className={`text-xs font-semibold ${issueType === t.id ? 'text-primary' : 'text-on-surface'}`}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h3 className="text-sm font-bold text-on-surface mb-2">Area / Zone</h3>
          <select
            value={zone}
            onChange={e => setZone(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
          >
            {ZONES.map(z => <option key={z} value={z}>{z} — Hyderabad</option>)}
          </select>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h3 className="text-sm font-bold text-on-surface mb-2">Description</h3>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={uploading}
            rows={4}
            placeholder="Describe the problem in detail — location landmarks, severity, how long it has been happening…"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none"
          />
          <div className="text-right mt-1">
            <span className={`text-[10px] ${description.length > 10 ? 'text-green-500' : 'text-slate-300'}`}>
              {description.length} chars
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">{error}</div>
        )}
      </div>

      {/* Submit */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <button
          onClick={submitReport}
          disabled={uploading || !photoBlob || !description.trim()}
          className="w-full bg-gradient-to-r from-primary to-primary/80 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-98 transition-all shadow-lg shadow-primary/20"
        >
          {uploading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Submitting Report…</>
            : <><span className="material-symbols-outlined text-lg">send</span>Submit Report</>
          }
        </button>
      </div>
    </div>
  );
}
