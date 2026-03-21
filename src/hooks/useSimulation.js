import { useState, useEffect, useRef, useCallback } from "react";
import { NODES_INITIAL, LEVEL_LIMIT, GAS_LIMIT, getStatus, getPumpStatus } from "../data/mockData";

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// What each scenario does to the target node
const SCENARIO = {
  normal:   null,
  warning:  { level:7.8,  gas:450 },
  overflow: { level:11.4, gas:590 },
  gas:      { level:4.5,  gas:710 },
  combined: { level:10.8, gas:690 },
  recovery: { level:3.2,  gas:180 },
};

function makeHistory(baseLevel, baseGas) {
  const h = [];
  for (let i = 0; i < 30; i++) {
    h.push({
      level: clamp(baseLevel + (Math.random()-0.5)*2, 0, 14),
      gas:   clamp(baseGas   + (Math.random()-0.5)*50, 0, 900),
    });
  }
  return h;
}

export function useSimulation(targetNodeId = "HYD-OC-107") {
  const [nodes,    setNodes]    = useState(() =>
    NODES_INITIAL.map(n => ({ ...n, history: makeHistory(n.level, n.gas), lastUpdate: new Date().toISOString() }))
  );
  const [scenario, setScenario] = useState("normal");
  const [paused,   setPaused]   = useState(false);
  const [mqttLog,  setMqttLog]  = useState([]);
  const [alerts,   setAlerts]   = useState([]);  // toast-style alerts
  const pausedRef  = useRef(false);
  const scenRef    = useRef("normal");

  // keep refs in sync so interval closure sees latest values
  useEffect(() => { pausedRef.current  = paused;   }, [paused]);
  useEffect(() => { scenRef.current    = scenario; }, [scenario]);

  // Main tick
  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const sc = scenRef.current;

      setNodes(prev => prev.map(node => {
        const ovr  = node.id === targetNodeId ? SCENARIO[sc] : null;
        const base = NODES_INITIAL.find(n => n.id === node.id);
        let level, gas;

        if (ovr) {
          level = clamp(ovr.level + (Math.random()-0.5)*0.35, 0, 14);
          gas   = clamp(ovr.gas   + (Math.random()-0.5)*18,   0, 900);
        } else {
          // Gentle random walk bounded near baseline
          level = clamp(node.level + (Math.random()-0.48)*0.28, 0, Math.min(base.level*1.4, 12));
          gas   = clamp(node.gas   + (Math.random()-0.5 )*14,   50, Math.min(base.gas*1.5, 700));
        }

        const status  = getStatus(level, gas);
        const pump    = getPumpStatus(level);
        const history = [...node.history.slice(-29), { level, gas }];

        return { ...node, level: +level.toFixed(2), gas: Math.round(gas), status, pump, history, lastUpdate: new Date().toISOString() };
      }));
    }, 2000);
    return () => clearInterval(id);
  }, [targetNodeId]);

  // MQTT log + alert generator
  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setNodes(cur => {
        const node = cur[Math.floor(Math.random() * cur.length)];
        const entry = {
          id:     Date.now(),
          ts:     new Date().toLocaleTimeString("en-IN", { hour12:false }),
          nodeId: node.id,
          topic:  `sewage/data/${node.id}`,
          level:  node.level,
          gas:    node.gas,
          status: node.status,
          pump:   node.pump,
        };
        setMqttLog(prev => [entry, ...prev].slice(0, 60));

        // Fire toast alert for critical nodes (rate-limited: max 1 per node per ~20s)
        if (node.status === "CRITICAL") {
          setAlerts(prev => {
            const recent = prev.find(a => a.nodeId === node.id && Date.now() - a.ts < 20000);
            if (recent) return prev;
            return [{ id: Date.now(), ts: Date.now(), nodeId: node.id, location: node.name,
              type: node.gas >= GAS_LIMIT ? "GAS ALERT" : "OVERFLOW",
              msg: node.gas >= GAS_LIMIT
                ? `Toxic gas ${node.gas} ADC at ${node.name}`
                : `Sewage overflow ${node.level.toFixed(1)}cm at ${node.name}`,
            }, ...prev].slice(0, 5);
          });
        }
        return cur;
      });
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const dismissAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

  const critCount  = nodes.filter(n => n.status === "CRITICAL").length;
  const warnCount  = nodes.filter(n => n.status === "WARNING").length;

  return { nodes, scenario, setScenario, paused, setPaused, mqttLog, alerts, dismissAlert, critCount, warnCount };
}
