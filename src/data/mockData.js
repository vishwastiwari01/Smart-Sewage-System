// ── HYDERABAD SENSOR NODES ──────────────────────────────────────
export const NODES_INITIAL = [
  { id:"HYD-BH-101", name:"Banjara Hills",  area:"Zone 3", ward:"Jubilee Hills",  lat:17.4156, lng:78.4487, level:4.2,  gas:230, temp:30, pump:"AUTO", status:"NORMAL",   x:260, y:148 },
  { id:"HYD-MP-203", name:"Mehdipatnam",    area:"Zone 2", ward:"Mehdipatnam",    lat:17.3956, lng:78.4328, level:8.7,  gas:540, temp:32, pump:"ON",   status:"WARNING",  x:158, y:235 },
  { id:"HYD-SC-305", name:"Secunderabad",   area:"Zone 1", ward:"Begumpet",       lat:17.4399, lng:78.4983, level:3.1,  gas:190, temp:29, pump:"AUTO", status:"NORMAL",   x:415, y: 95 },
  { id:"HYD-KK-412", name:"Kukatpally",     area:"Zone 4", ward:"KPHB Colony",    lat:17.4849, lng:78.4138, level:5.8,  gas:310, temp:31, pump:"AUTO", status:"NORMAL",   x:565, y:135 },
  { id:"HYD-OC-107", name:"Old City",       area:"Zone 5", ward:"Darulshifa",     lat:17.3616, lng:78.4747, level:11.4, gas:720, temp:34, pump:"ON",   status:"CRITICAL", x:338, y:298 },
  { id:"HYD-HT-601", name:"Hitech City",    area:"Zone 6", ward:"Madhapur",       lat:17.4474, lng:78.3762, level:2.3,  gas:155, temp:28, pump:"OFF",  status:"NORMAL",   x:635, y:270 },
  { id:"HYD-LB-508", name:"LB Nagar",       area:"Zone 5", ward:"Saroornagar",    lat:17.3467, lng:78.5545, level:7.1,  gas:480, temp:33, pump:"ON",   status:"WARNING",  x:518, y:308 },
  { id:"HYD-AM-209", name:"Ameerpet",       area:"Zone 2", ward:"Ameerpet",       lat:17.4375, lng:78.4483, level:2.8,  gas:195, temp:29, pump:"AUTO", status:"NORMAL",   x: 95, y:138 },
  { id:"HYD-KP-004", name:"Kompally",       area:"Zone 4", ward:"Kompally",       lat:17.5451, lng:78.4867, level:1.9,  gas:152, temp:28, pump:"AUTO", status:"NORMAL",   x:685, y: 72 },
];

export const LEVEL_LIMIT = 10;
export const GAS_LIMIT   = 600;

export function getStatus(level, gas) {
  if (level >= LEVEL_LIMIT || gas >= GAS_LIMIT) return "CRITICAL";
  if (level >= LEVEL_LIMIT * 0.75 || gas >= GAS_LIMIT * 0.75) return "WARNING";
  return "NORMAL";
}
export function statusBadge(s) {
  return s === "CRITICAL" ? "b-crit" : s === "WARNING" ? "b-warn" : "b-safe";
}
export function statusColor(s) {
  return s === "CRITICAL" ? "#ba1a1a" : s === "WARNING" ? "#d97706" : "#16a34a";
}
export function getPumpStatus(level) {
  if (level >= LEVEL_LIMIT * 0.8) return "ON";
  if (level <= LEVEL_LIMIT * 0.4) return "OFF";
  return "AUTO";
}

// ── MAINTENANCE CREWS ─────────────────────────────────────────
export const CREWS = [
  { id:"C1", name:"Ravi Kumar",   phone:"+91 98765 43210", team:"Alpha", status:"ON_SITE",    lat:17.3616, lng:78.4747, task:"Old City Overflow",          exp:"6 yrs" },
  { id:"C2", name:"Suresh Reddy", phone:"+91 87654 32109", team:"Beta",  status:"DISPATCHED", lat:17.4000, lng:78.4400, task:"Mehdipatnam Gas Inspection", exp:"4 yrs" },
  { id:"C3", name:"Prasad Naidu", phone:"+91 76543 21098", team:"Gamma", status:"STANDBY",    lat:17.4200, lng:78.4600, task:"Available",                  exp:"8 yrs" },
  { id:"C4", name:"Anand Sharma", phone:"+91 65432 10987", team:"Delta", status:"RESOLVED",   lat:17.4849, lng:78.4138, task:"Kukatpally Sensor Check",    exp:"3 yrs" },
  { id:"C5", name:"Kavitha Devi", phone:"+91 54321 09876", team:"Echo",  status:"STANDBY",    lat:17.4500, lng:78.5000, task:"Available",                  exp:"5 yrs" },
];

// ── INCIDENTS ─────────────────────────────────────────────────
export const INCIDENTS_INITIAL = [
  { id:"INC-2847", node:"HYD-OC-107", location:"Old City · Darulshifa Rd",   severity:"CRITICAL", status:"IN_PROGRESS", crew:"C1", reported:"14:10", eta:"14:45", type:"Overflow",    description:"Sewage overflow detected. Level 11.4cm. Pump ON. Road partially blocked." },
  { id:"INC-2846", node:"HYD-MP-203", location:"Mehdipatnam · X Road",       severity:"WARNING",  status:"DISPATCHED",  crew:"C2", reported:"14:02", eta:"14:30", type:"Gas Leak",    description:"Elevated H2S detected at 540 ADC. Crew instructed to wear full PPE." },
  { id:"INC-2845", node:"HYD-LB-508", location:"LB Nagar · Ring Road",       severity:"WARNING",  status:"OPEN",        crew:null,  reported:"13:55", eta:null,    type:"High Level",  description:"Sewage level 7.1cm approaching critical threshold. Crew unassigned." },
  { id:"INC-2843", node:"HYD-MP-203", location:"Mehdipatnam · Rethibowli",   severity:"LOW",      status:"OPEN",        crew:null,  reported:"13:30", eta:null,    type:"Maintenance", description:"Scheduled sensor calibration overdue. Node last serviced 45 days ago." },
  { id:"INC-2840", node:"HYD-KK-412", location:"Kukatpally · KPHB Colony",   severity:"LOW",      status:"RESOLVED",    crew:"C4", reported:"12:30", eta:"13:00", type:"Sensor",      description:"Ultrasonic sensor replaced. Readings back to normal." },
  { id:"INC-2835", node:"HYD-BH-101", location:"Banjara Hills · Rd No. 12",  severity:"LOW",      status:"RESOLVED",    crew:"C3", reported:"11:15", eta:"11:50", type:"Maintenance", description:"Routine pump maintenance completed. All checks passed." },
];

// ── AI PREDICTIONS ────────────────────────────────────────────
export const PREDICTIONS = [
  { node:"HYD-OC-107", location:"Old City",     probability:92, hoursLeft:0.8, trend:"rising",  rainfall:18, confidence:"HIGH",   lastUpdated:"14:23" },
  { node:"HYD-MP-203", location:"Mehdipatnam",  probability:78, hoursLeft:2.5, trend:"rising",  rainfall:12, confidence:"HIGH",   lastUpdated:"14:21" },
  { node:"HYD-LB-508", location:"LB Nagar",     probability:61, hoursLeft:4.2, trend:"stable",  rainfall:8,  confidence:"MEDIUM", lastUpdated:"14:18" },
  { node:"HYD-KK-412", location:"Kukatpally",   probability:34, hoursLeft:8.1, trend:"falling", rainfall:4,  confidence:"MEDIUM", lastUpdated:"14:15" },
  { node:"HYD-BH-101", location:"Banjara Hills",probability:15, hoursLeft:18,  trend:"falling", rainfall:2,  confidence:"LOW",    lastUpdated:"14:10" },
  { node:"HYD-SC-305", location:"Secunderabad", probability:9,  hoursLeft:24,  trend:"stable",  rainfall:1,  confidence:"LOW",    lastUpdated:"14:08" },
];

// ── ANALYTICS DATA (fixed seed so no re-randomize on render) ──
const _S = [2,1,0,0,1,2,3,4,3,2,4,5,3,4,5,4,3,4,3,2,3,2,1,2];
export const HOURLY_DATA = Array.from({ length:24 }, (_, i) => ({
  hour:        `${String(i).padStart(2,"0")}:00`,
  incidents:   _S[i],
  avgLevel:    +(2 + (_S[i] / 5) * 6 + 1.2).toFixed(1),
  gasAvg:      150 + _S[i] * 60,
  pumpsActive: 2 + Math.floor(_S[i] * 0.8),
}));

export const ZONE_STATS = [
  { zone:"Zone 1 · Secunderabad", nodes:8,  incidents:1, risk:"LOW",    efficiency:96, avgLevel:3.1 },
  { zone:"Zone 2 · West",         nodes:12, incidents:3, risk:"MEDIUM", efficiency:84, avgLevel:6.2 },
  { zone:"Zone 3 · Central",      nodes:10, incidents:2, risk:"MEDIUM", efficiency:88, avgLevel:5.4 },
  { zone:"Zone 4 · North",        nodes:9,  incidents:1, risk:"LOW",    efficiency:93, avgLevel:3.8 },
  { zone:"Zone 5 · South",        nodes:14, incidents:4, risk:"HIGH",   efficiency:71, avgLevel:8.9 },
  { zone:"Zone 6 · IT Corridor",  nodes:6,  incidents:0, risk:"LOW",    efficiency:99, avgLevel:2.1 },
];

export const COMPLAINTS = [
  { id:"CMP-1821", citizen:"Mohammed Riyaz", area:"Old City",    type:"Overflow",  status:"IN_PROGRESS", time:"13:45", photo:true  },
  { id:"CMP-1820", citizen:"Priya Sharma",   area:"Mehdipatnam", type:"Bad Smell", status:"OPEN",        time:"13:20", photo:false },
  { id:"CMP-1819", citizen:"Venkat Rao",     area:"LB Nagar",    type:"Blockage",  status:"OPEN",        time:"12:58", photo:true  },
  { id:"CMP-1815", citizen:"Sunita Devi",    area:"Ameerpet",    type:"Overflow",  status:"RESOLVED",    time:"11:30", photo:true  },
];

export const RAINFALL = [
  { label:"Now",     mm:0,  color:"#16a34a" },
  { label:"+2 hrs",  mm:8,  color:"#d97706" },
  { label:"+6 hrs",  mm:22, color:"#ba1a1a" },
  { label:"+12 hrs", mm:35, color:"#ba1a1a" },
  { label:"+24 hrs", mm:12, color:"#d97706" },
];

export function genSpark(base, range, len = 30) {
  const arr = [base];
  for (let i = 1; i < len; i++) arr.push(Math.max(0, arr[i-1] + (Math.random()-0.5)*range));
  return arr;
}
