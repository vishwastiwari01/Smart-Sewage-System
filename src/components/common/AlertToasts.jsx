import { useEffect } from "react";

export default function AlertToasts({ alerts = [], onDismiss }) {
  useEffect(() => {
    if (!alerts.length) return;
    const id = setTimeout(() => onDismiss(alerts[0]?.id), 7000);
    return () => clearTimeout(id);
  }, [alerts, onDismiss]);

  if (!alerts.length) return null;
  return (
    <div className="fixed top-14 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
      {alerts.slice(0,3).map(a => (
        <div key={a.id} onClick={() => onDismiss(a.id)}
          className={`pointer-events-auto max-w-xs p-3 pr-8 rounded-lg shadow-lg border-l-4 bg-white cursor-pointer relative group
            ${a.type==="GAS ALERT"
              ? "border-amber-500 border border-amber-200"
              : "border-error border border-error-container"}`}>
          <button 
            type="button" 
            className="absolute top-1.5 right-1.5 p-1 rounded-md text-outline hover:bg-black/5 opacity-60 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onDismiss(a.id); }}
            aria-label="Close alert"
          >
            <span className="material-symbols-outlined text-[16px] leading-none">close</span>
          </button>
          <div className={`font-label text-[10px] font-bold uppercase tracking-wider mb-1 ${a.type==="GAS ALERT"?"text-amber-700":"text-on-error-container"}`}>
            {a.type}
          </div>
          <div className="text-[12px] text-on-surface">{a.msg}</div>
        </div>
      ))}
    </div>
  );
}
