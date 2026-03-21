import { useRef } from "react";
import { statusColor } from "../../data/mockData";

export default function IsoMap({ nodes = [], onNodeClick, selectedId }) {
  const ttRef = useRef(null);

  function showTT(e, n) {
    const tt = ttRef.current; if (!tt) return;
    tt.querySelector(".tt-name").textContent = n.name;
    tt.querySelector("#tl").textContent = n.level?.toFixed(1) + " cm";
    tt.querySelector("#tg").textContent = n.gas + " ADC";
    const st = tt.querySelector("#ts"); st.textContent = n.status; st.style.color = statusColor(n.status);
    tt.style.left = (e.clientX + 14) + "px";
    tt.style.top  = (e.clientY - 14) + "px";
    tt.classList.add("vis");
  }
  function hideTT() { ttRef.current?.classList.remove("vis"); }

  // Light map palette
  const mapBg  = "#F8F9FA";
  const gridC  = "#E9ECEF";
  const roadC  = "#DEE2E6";
  const road2C = "#CED4DA";
  const textC  = "#ADB5BD";
  const bldC   = "#E9ECEF";
  const bld2C  = "#DEE2E6";

  const BUILDINGS = [
    [[60,75],[160,55],[260,75],[360,55],[460,75],[560,55],[660,75]],
    [[100,145],[200,125],[300,145],[400,125],[500,145],[600,125],[700,145]],
    [[60,215],[160,195],[260,215],[360,195],[460,215],[560,195],[660,215]],
    [[110,285],[210,265],[310,285],[410,265],[510,285],[610,265],[710,285]],
  ];

  return (
    <>
      <svg viewBox="0 0 800 340" style={{ width:"100%", height:"100%", display:"block" }} preserveAspectRatio="xMidYMid meet">
        <rect width="800" height="340" fill={mapBg}/>
        <defs>
          <pattern id="ig" x="0" y="0" width="80" height="46" patternUnits="userSpaceOnUse">
            <path d="M40 0L80 23L40 46L0 23Z" fill="none" stroke={gridC} strokeWidth=".6"/>
          </pattern>
        </defs>
        <rect width="800" height="340" fill="url(#ig)" opacity=".8"/>
        {/* Roads */}
        <path d="M0 170 Q400 162 800 170" stroke={roadC} strokeWidth="14" fill="none"/>
        <path d="M0 275 Q400 270 800 275" stroke={roadC} strokeWidth="10" fill="none" opacity=".8"/>
        <path d="M0 90  Q400 85  800 90"  stroke={roadC} strokeWidth="8"  fill="none" opacity=".7"/>
        <path d="M200 0 Q202 170 200 340" stroke={road2C} strokeWidth="12" fill="none"/>
        <path d="M400 0 Q400 170 400 340" stroke={road2C} strokeWidth="13" fill="none"/>
        <path d="M600 0 Q600 170 600 340" stroke={road2C} strokeWidth="10" fill="none" opacity=".9"/>
        {/* Buildings */}
        {BUILDINGS.map((row, ri) => row.map(([bx,by], bi) => {
          const bw = [40,32,36,28][ri%4], bh = [20,16,18,14][ri%4];
          const h  = 10 + (bi%3)*6;
          return (
            <g key={`b${ri}${bi}`}>
              <rect x={bx-bw/2} y={by-h-bh/2} width={bw} height={h}   fill={bldC} stroke={road2C} strokeWidth=".4"/>
              <rect x={bx-bw/2} y={by-bh/2}   width={bw} height={bh}  fill={bld2C} stroke={road2C} strokeWidth=".4"/>
            </g>
          );
        }))}
        {/* Labels */}
        {[["Banjara Hills",250,130],["Mehdipatnam",145,218],["Secunderabad",400,78],["Kukatpally",548,118],
          ["Old City",322,280],["Hitech City",618,253],["LB Nagar",505,292],["Ameerpet",82,122],["Kompally",672,56]
        ].map(([lbl,lx,ly]) => (
          <text key={lbl} x={lx} y={ly} fill={textC} fontSize="7.5" fontFamily="'JetBrains Mono',monospace" textAnchor="middle" fontWeight="500">{lbl.toUpperCase()}</text>
        ))}
        {/* Pipes */}
        {[["M95 138","L158 235"],["M158 235","L260 148"],["M260 148","L338 298"],["M415 95","L260 148"],
          ["M415 95","L565 135"],["M565 135","L685 72"],["M338 298","L518 308"],["M518 308","L635 270"]
        ].map(([m,l],i) => (
          <path key={i} d={m+" "+l} stroke="rgba(37,99,235,0.15)" strokeWidth="2" fill="none" strokeDasharray="6 4"/>
        ))}
        {/* Nodes */}
        {nodes.map(n => {
          const color = statusColor(n.status);
          const isSel = n.id === selectedId;
          const r     = isSel ? 12 : 9;
          return (
            <g key={n.id} style={{ cursor:"pointer" }}
              onClick={() => onNodeClick?.(n)}
              onMouseEnter={e => showTT(e, n)}
              onMouseLeave={hideTT}>
              {/* Selection ring */}
              {isSel && <circle cx={n.x} cy={n.y} r={r+5} fill="none" stroke={color} strokeWidth="1.5" opacity={0.3}/>}
              {/* Critical pulse */}
              {n.status === "CRITICAL" && (
                <circle cx={n.x} cy={n.y} r={r+8} fill={color} opacity={0.06}>
                  <animate attributeName="r" values={`${r+3};${r+14};${r+3}`} dur="2.5s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.08;0.01;0.08" dur="2.5s" repeatCount="indefinite"/>
                </circle>
              )}
              <circle cx={n.x} cy={n.y} r={r+2} fill="#fff" stroke={color} strokeWidth="1.5"/>
              <circle cx={n.x} cy={n.y} r={r}   fill={color} opacity={0.9}/>
              <text x={n.x} y={n.y+3.5} fill="#fff" fontSize="6.5" fontFamily="'JetBrains Mono',monospace" textAnchor="middle" fontWeight="600">
                {n.id.split("-")[1]}
              </text>
              <text x={n.x} y={n.y+r+13} fill={color} fontSize="7" fontFamily="'JetBrains Mono',monospace" textAnchor="middle" fontWeight="500">
                {n.level?.toFixed(1)}cm
              </text>
            </g>
          );
        })}
        {/* Legend */}
        <g transform="translate(10,317)">
          <rect x="0" y="-9" width="230" height="17" rx="3" fill="rgba(255,255,255,.92)" stroke="#E2E2E2" strokeWidth=".8"/>
          {[["NORMAL","#16a34a"",0],["WARNING","#d97706"",74],["CRITICAL","#ba1a1a"",148]].map(([l,c,x]) => (
            <g key={l}>
              <circle cx={x+8} cy="0" r="3.5" fill={c}/>
              <text x={x+16} y="4" fill="#6B6B6B" fontSize="7.5" fontFamily="'JetBrains Mono',monospace">{l}</text>
            </g>
          ))}
        </g>
      </svg>
      {/* Tooltip */}
      <div ref={ttRef} className="map-tt" style={{
        position:"fixed", zIndex:999,
        background:"#fff", border:"1px solid #e2e2e2",
        borderRadius:8, padding:"10px 12px", minWidth:160, fontSize:12,
        pointerEvents:"none", boxShadow:"0 10px 15px rgba(0,0,0,.08)", opacity:0, transition:"opacity .12s",
      }}>
        <div className="tt-name" style={{ fontWeight:600, marginBottom:5, paddingBottom:5, borderBottom:"1px solid #e2e2e2", fontSize:12.5 }}/>
        {[["Level","tl"],["Gas ADC","tg"],["Status","ts"]].map(([l,id]) => (
          <div key={id} style={{ display:"flex", justifyContent:"space-between", gap:14, color:"#434655"", padding:"2px 0", fontSize:12 }}>
            <span>{l}</span><span id={id} style={{ color:"#1a1c1c"", fontFamily:"JetBrains Mono, monospace", fontWeight:500 }}/>
          </div>
        ))}
      </div>
      <style>{`.map-tt.vis{opacity:1!important}`}</style>
    </>
  );
}
