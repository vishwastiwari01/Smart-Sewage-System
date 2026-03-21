const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

export default function Sparkline({ data, color = "#004ac6", threshold, maxY = 15, height = 72 }) {
  if (!data || data.length < 2) return <div style={{ height }} />;
  const W = 500, H = height;
  const vals = data.map(v => clamp(+v || 0, 0, maxY));
  const pts  = vals.map((v,i) => `${(i/(vals.length-1))*W},${H-clamp((v/maxY)*H,2,H-2)}`).join(" ");
  const thY  = threshold ? H - clamp((threshold/maxY)*H,0,H) : null;
  const uid  = color.replace(/[^a-z0-9]/gi,"").slice(0,8) + height;
  const last = pts.split(" ").pop()?.split(",");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display:"block" }}>
      <defs>
        <linearGradient id={`sg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {thY !== null && <line x1={0} y1={thY} x2={W} y2={thY} stroke="#ba1a1a" strokeWidth={1} strokeDasharray="5 4" opacity={0.4}/>}
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#sg-${uid})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round"/>
      {last?.length===2 && <circle cx={last[0]} cy={last[1]} r={2.5} fill={color}/>}
    </svg>
  );
}
