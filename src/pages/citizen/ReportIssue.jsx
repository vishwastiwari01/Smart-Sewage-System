import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function ReportIssue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [streamActive, setStreamActive] = useState(false);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Could not access camera. Ensure permissions are granted.");
    }
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
      const stream = video.srcObject;
      stream.getTracks().forEach(track => track.stop());
      setStreamActive(false);
    }, 'image/jpeg', 0.8);
  };

  const submitReport = async () => {
    if (!photoBlob || !description.trim()) {
      alert("Please provide a photo and a description");
      return;
    }
    
    setUploading(true);
    try {
      // Get GPS
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      }).catch(err => {
        console.warn("GPS unavailable, using default");
        return { coords: { latitude: 17.3850, longitude: 78.4867 } };
      });

      // Upload Image
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { data: storageData, error: storageErr } = await supabase.storage
        .from('citizen-reports')
        .upload(fileName, photoBlob);

      if (storageErr) throw storageErr;
      
      const { data: { publicUrl } } = supabase.storage.from('citizen-reports').getPublicUrl(fileName);

      // Insert DB Record
      const { error: dbErr } = await supabase.from('reports').insert({
        citizen_id: user.id,
        description,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        image_url: publicUrl,
        status: 'pending',
        priority: 'medium'
      });

      if (dbErr) throw dbErr;

      alert("Report submitted successfully!");
      navigate('/citizen/my-reports');
    } catch (err) {
      console.error(err);
      alert("Error submitting report: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-4 bg-primary text-white flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="material-symbols-outlined pb-1">arrow_back</button>
        <h1 className="text-xl font-bold">New Report</h1>
      </div>

      <div className="flex-1 p-4 overflow-auto flex flex-col gap-4">
        {previewUrl ? (
          <div className="relative rounded-xl overflow-hidden shadow-sm bg-black aspect-video flex-shrink-0">
            <img src={previewUrl} alt="Captured" className="w-full h-full object-cover" />
            <button onClick={() => { setPreviewUrl(null); setPhotoBlob(null); startCamera(); }} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full material-symbols-outlined">close</button>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden shadow-sm bg-black aspect-video flex items-center justify-center flex-shrink-0">
            {streamActive ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <button onClick={startCamera} className="bg-white/20 p-4 rounded-full text-white backdrop-blur flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl mb-1">camera_alt</span>
                <span className="text-xs font-bold">Start Camera</span>
              </button>
            )}
            {streamActive && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full border-4 border-error/50 shadow-xl active:scale-95 transition"></button>
              </div>
            )}
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex-1 flex flex-col min-h-0">
          <label className="text-xs font-bold text-outline-variant mb-1 uppercase tracking-wider">Description</label>
          <textarea 
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={uploading}
            placeholder="Describe the sewage overflow or damage..."
            className="w-full flex-1 p-3 rounded-lg border border-outline-variant/30 text-sm focus:border-primary focus:ring-1 resize-none bg-white font-body"
          />
        </div>
      </div>

      <div className="p-4 bg-white border-t border-outline-variant/20">
        <button 
          onClick={submitReport}
          disabled={uploading || !photoBlob || !description}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition"
        >
          {uploading ? <span className="material-symbols-outlined animate-spin text-lg">sync</span> : <span className="material-symbols-outlined text-lg">send</span>}
          {uploading ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </div>
  );
}
