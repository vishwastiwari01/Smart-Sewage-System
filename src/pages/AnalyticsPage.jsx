import { HOURLY_DATA, ZONE_STATS } from "../data/mockData";
import Sparkline from "../components/common/Sparkline";

const INCIDENT_TYPES = [
  { type:"Overflow",    count:34, color:"#ba1a1a", bg:"bg-error-container",   text:"text-on-error-container" },
  { type:"Gas Leak",    count:28, color:"#d97706", bg:"bg-amber-100",          text:"text-amber-700" },
  { type:"High Level",  count:20, color:"#004ac6", bg:"bg-blue-50",            text:"text-blue-700" },
  { type:"Sensor Fault",count:12, color:"#6a1edb", bg:"bg-purple-50",          text:"text-purple-700" },
  { type:"Maintenance", count:6,  color:"#16a34a", bg:"bg-green-50",           text:"text-green-700" },
];
const TOTAL = INCIDENT_TYPES.reduce((s,t)=>s+t.count,0);
const MONTHLY = [
  {m:"Apr",inc:18,res:16},{m:"May",inc:22,res:19},{m:"Jun",inc:31,res:27},
  {m:"Jul",inc:28,res:24},{m:"Aug",inc:35,res:30},{m:"Sep",inc:41,res:36},
  {m:"Oct",inc:26,res:23},{m:"Nov",inc:19,res:18},{m:"Dec",inc:14,res:14},
  {m:"Jan",inc:16,res:15},{m:"Feb",inc:21,res:18},{m:"Mar",inc:24,res:20},
];

function BarChart({ data, valueKey, color, maxVal }) {
  const m = maxVal||Math.max(...data.map(d=>d[valueKey]),1);
  return (
    <div className="flex items-end gap-0.5 h-20">
      {data.map((d,i)=>(
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full rounded-t-sm transition-all" style={{ height:`${(d[valueKey]/m)*100}%`, background:color, minHeight:d[valueKey]>0?2:0, opacity:.85 }}/>
          {i%4===0 && <div className="font-label text-[7px] text-outline truncate w-full text-center">{d.hour}</div>}
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const totalToday = HOURLY_DATA.reduce((s,d)=>s+d.incidents,0);
  const avgLevel   = (HOURLY_DATA.reduce((s,d)=>s+d.avgLevel,0)/HOURLY_DATA.length).toFixed(1);
  const peakGas    = Math.max(...HOURLY_DATA.map(d=>d.gasAvg));

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface">
      {/* Stats strip */}
      <div className="grid grid-cols-5 border-b border-outline-variant/10 bg-surface-container-lowest">
        {[
          { l:"Incidents Today", v:totalToday,  s:"All nodes",       c:"text-error" },
          { l:"Avg Level",       v:`${avgLevel}cm`, s:"Network avg", c:"text-primary" },
          { l:"Peak Gas",        v:peakGas,     s:"Max ADC",         c:"text-amber-600" },
          { l:"Pumps Triggered", v:38,          s:"Auto activations",c:"text-green-600" },
          { l:"Avg Repair Time", v:"34 min",    s:"This month",      c:"text-purple-600" },
        ].map((s,i)=>(
          <div key={s.l} className={`px-5 py-3.5 ${i<4?"border-r border-outline-variant/10":""}`}>
            <div className="font-label text-[9.5px] font-bold uppercase tracking-wider text-outline mb-1">{s.l}</div>
            <div className={`text-2xl font-bold font-label ${s.c}`}>{s.v}</div>
            <div className="font-label text-[9px] text-outline">{s.s}</div>
          </div>
        ))}
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Hourly incidents */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant/10">
            <div className="text-xs font-semibold text-on-surface">Hourly Incident Count — Today</div>
            <div className="font-label text-[10px] text-outline">24h · all nodes</div>
          </div>
          <div className="p-4">
            <BarChart data={HOURLY_DATA} valueKey="incidents" color="#ba1a1a" maxVal={6}/>
          </div>
        </div>

        {/* Avg level sparkline */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant/10">
            <div className="text-xs font-semibold text-on-surface">Average Sewage Level</div>
            <div className="font-label text-[10px] text-outline">Network-wide · 24h</div>
          </div>
          <div className="p-4">
            <Sparkline data={HOURLY_DATA.map(d=>d.avgLevel)} color="#004ac6" threshold={10} maxY={15} height={80}/>
          </div>
        </div>

        {/* Gas trend */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant/10">
            <div className="text-xs font-semibold text-on-surface">Gas Concentration Trend</div>
            <div className="font-label text-[10px] text-outline">Network avg · ADC</div>
          </div>
          <div className="p-4">
            <Sparkline data={HOURLY_DATA.map(d=>d.gasAvg)} color="#d97706" threshold={600} maxY={900} height={80}/>
          </div>
        </div>

        {/* Monthly */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant/10">
            <div className="text-xs font-semibold text-on-surface">Monthly Incident Summary</div>
            <div className="font-label text-[10px] text-outline">Apr 2025 – Mar 2026</div>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-1 h-20 mb-2">
              {MONTHLY.map((m,i)=>(
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col justify-end gap-px" style={{ height:"72px" }}>
                    <div className="w-full rounded-t-sm bg-error opacity-80" style={{ height:`${(m.inc/45)*72}px` }}/>
                    <div className="w-full bg-green-500 opacity-80" style={{ height:`${(m.res/45)*72}px` }}/>
                  </div>
                  <div className="font-label text-[7px] text-outline">{m.m}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-error rounded-sm"/><span className="font-label text-[9.5px] text-outline">Incidents</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-sm"/><span className="font-label text-[9.5px] text-outline">Resolved</span></div>
            </div>
          </div>
        </div>

        {/* Zone performance */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden col-span-2">
          <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant/10">
            <div className="text-xs font-semibold text-on-surface">Zone Performance Report</div>
            <div className="font-label text-[10px] text-outline">All 6 drainage zones</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  {["Zone","Nodes","Incidents","Avg Level","Risk","Efficiency","Status"].map(h=>(
                    <th key={h} className="font-label text-[9.5px] font-bold uppercase tracking-wider text-outline py-2.5 px-4 text-left border-b border-outline-variant/10">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ZONE_STATS.map(z=>(
                  <tr key={z.zone} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                    <td className="py-2.5 px-4 text-xs font-semibold text-on-surface">{z.zone}</td>
                    <td className="py-2.5 px-4 font-label text-[10.5px] text-on-surface">{z.nodes}</td>
                    <td className="py-2.5 px-4 font-label text-[10.5px] font-semibold" style={{ color:z.incidents>=4?"#ba1a1a":z.incidents>=2?"#d97706":"#16a34a" }}>{z.incidents}</td>
                    <td className="py-2.5 px-4 font-label text-[10.5px]" style={{ color:z.avgLevel>=7?"#ba1a1a":z.avgLevel>=5?"#d97706":"#16a34a" }}>{z.avgLevel} cm</td>
                    <td className="py-2.5 px-4">
                      <span className={`font-label text-[9px] px-1.5 py-0.5 rounded font-semibold ${z.risk==="HIGH"?"bg-error-container text-on-error-container":z.risk==="MEDIUM"?"bg-amber-100 text-amber-700":"bg-green-50 text-green-700"}`}>{z.risk}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width:`${z.efficiency}%`, background:z.efficiency>=90?"#16a34a":z.efficiency>=75?"#d97706":"#ba1a1a" }}/>
                        </div>
                        <span className="font-label text-[10px] font-semibold min-w-[28px]" style={{ color:z.efficiency>=90?"#16a34a":z.efficiency>=75?"#d97706":"#ba1a1a" }}>{z.efficiency}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`font-label text-[9px] px-1.5 py-0.5 rounded font-semibold ${z.incidents===0?"bg-green-50 text-green-700":z.risk==="HIGH"?"bg-error-container text-on-error-container":"bg-amber-100 text-amber-700"}`}>
                        {z.incidents===0?"CLEAN":z.risk==="HIGH"?"CRITICAL":"ATTENTION"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Incident type distribution */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden col-span-2">
          <div className="flex justify-between items-center px-4 py-3 border-b border-outline-variant/10">
            <div className="text-xs font-semibold text-on-surface">Incident Type Distribution — Last 30 Days</div>
            <div className="font-label text-[10px] text-outline">{TOTAL} total incidents</div>
          </div>
          <div className="p-4 grid grid-cols-5 gap-3">
            {INCIDENT_TYPES.map(t=>(
              <div key={t.type} className="bg-surface-container rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background:t.color }}/>
                  <span className="text-xs text-on-surface-variant">{t.type}</span>
                </div>
                <div className="text-2xl font-bold font-label mb-2" style={{ color:t.color }}>{t.count}</div>
                <div className="h-1 bg-surface-container-high rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full" style={{ width:`${(t.count/TOTAL)*100}%`, background:t.color }}/>
                </div>
                <div className="font-label text-[9px] text-outline">{((t.count/TOTAL)*100).toFixed(0)}% of total</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
