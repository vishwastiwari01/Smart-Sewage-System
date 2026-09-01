import { useEffect, useRef, useState } from "react";

const CARTO_LIGHT = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const HYD_CENTER  = [78.4867, 17.3850];
const HYD_ZOOM    = 11;

const PIPES = [
  ["HYD-AM-209","HYD-MP-203"],["HYD-MP-203","HYD-BH-101"],
  ["HYD-BH-101","HYD-OC-107"],["HYD-SC-305","HYD-BH-101"],
  ["HYD-SC-305","HYD-KK-412"],["HYD-KK-412","HYD-KP-004"],
  ["HYD-OC-107","HYD-LB-508"],["HYD-LB-508","HYD-HT-601"],
];

function statusHex(s) {
  return s==="CRITICAL"?"#ba1a1a":s==="WARNING"?"#d97706":"#16a34a";
}

function loadMapLibre() {
  return new Promise((resolve, reject) => {
    if (window.maplibregl) { resolve(window.maplibregl); return; }
    if (!document.getElementById("maplibre-css")) {
      const l = document.createElement("link");
      l.id="maplibre-css"; l.rel="stylesheet";
      l.href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
      document.head.appendChild(l);
    }
    const s = document.createElement("script");
    s.src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
    s.onload=()=>resolve(window.maplibregl); s.onerror=()=>reject();
    document.head.appendChild(s);
  });
}

export default function HyderabadMap({ nodes=[], onNodeClick, selectedId }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef({});
  const mlRef        = useRef(null);
  const [ready,    setReady]    = useState(false);
  const [mapError, setMapError] = useState(false);
  
  // OSRM Routing States
  const [routeStatus, setRouteStatus] = useState("idle"); // idle, loading, active
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);

  const calculateEmergencyRoute = async () => {
    setRouteStatus("loading");
    try {
      // Free OSRM API (no billing, no API key required!)
      // From Old City (flooded) to Secunderabad (safe)
      const start = [78.4747, 17.3616]; // Old City
      const end = [78.4983, 17.4399];   // Secunderabad
      const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.routes && data.routes[0]) {
        setRouteGeoJSON(data.routes[0].geometry);
        setRouteStatus("active");
      }
    } catch (err) {
      console.error("OSRM Routing Error:", err);
      setRouteStatus("idle");
    }
  };

  const clearRoute = () => {
    setRouteStatus("idle");
    setRouteGeoJSON(null);
    if (mapRef.current && mapRef.current.getSource("emergency-route")) {
      mapRef.current.removeLayer("emergency-route-line");
      mapRef.current.removeSource("emergency-route");
    }
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    loadMapLibre().then(ml => {
      if (cancelled || !containerRef.current) return;
      mlRef.current = ml;
      const map = new ml.Map({
        container: containerRef.current, style: CARTO_LIGHT,
        center: HYD_CENTER, zoom: HYD_ZOOM, attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new ml.AttributionControl({ compact:true }), "bottom-right");
      map.on("load", () => { if (!cancelled) setReady(true); });
      map.on("error", () => { if (!cancelled) setMapError(true); });
    }).catch(() => { if (!cancelled) setMapError(true); });
    return () => {
      cancelled = true;
      Object.values(markersRef.current).forEach(m=>m.remove());
      markersRef.current = {};
      if (mapRef.current) { mapRef.current.remove(); mapRef.current=null; }
      setReady(false);
    };
  }, []); // intentional empty deps

  useEffect(() => {
    if (!ready||!mapRef.current||nodes.length===0) return;
    const map=mapRef.current, nm=Object.fromEntries(nodes.map(n=>[n.id,n]));
    if (!map.getSource("pipes")) {
      const features=PIPES.filter(([a,b])=>nm[a]&&nm[b]).map(([a,b])=>({
        type:"Feature",geometry:{type:"LineString",coordinates:[[nm[a].lng,nm[a].lat],[nm[b].lng,nm[b].lat]]}
      }));
      map.addSource("pipes",{type:"geojson",data:{type:"FeatureCollection",features}});
      map.addLayer({id:"pipes-line",type:"line",source:"pipes",paint:{"line-color":"#004ac6","line-width":2,"line-opacity":0.3,"line-dasharray":[4,3]}});
    }

    // Dynamic Flood Risk Layer
    if (!map.getSource("flood-risk")) {
      // Create a mock topographical grid of risk areas around nodes
      const floodFeatures = nodes.map(n => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [n.lng, n.lat] },
        properties: { weight: n.level / 15 } // based on sewage level
      }));
      map.addSource("flood-risk", { type: "geojson", data: { type: "FeatureCollection", features: floodFeatures } });
      
      map.addLayer({
        id: "flood-heatmap",
        type: "heatmap",
        source: "flood-risk",
        maxzoom: 15,
        paint: {
          "heatmap-weight": ["get", "weight"],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 11, 1, 15, 3],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(33,102,172,0)",
            0.2, "rgba(103,169,207,0.4)",
            0.4, "rgba(209,229,240,0.6)",
            0.6, "rgba(253,219,199,0.7)",
            0.8, "rgba(239,138,98,0.8)",
            1, "rgba(178,24,43,0.9)"
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 11, 30, 15, 80],
          "heatmap-opacity": 0.8
        }
      });
    } else {
      // Update weights dynamically
      map.getSource("flood-risk").setData({
        type: "FeatureCollection",
        features: nodes.map(n => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [n.lng, n.lat] },
          properties: { weight: n.level / 15 }
        }))
      });
    }

  }, [ready, nodes]);

  useEffect(() => {
    if (!ready || !mapRef.current || !routeGeoJSON) return;
    const map = mapRef.current;
    if (map.getSource("emergency-route")) {
      map.getSource("emergency-route").setData(routeGeoJSON);
    } else {
      map.addSource("emergency-route", { type: "geojson", data: routeGeoJSON });
      map.addLayer({
        id: "emergency-route-line",
        type: "line",
        source: "emergency-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#2563eb", // blue route
          "line-width": 4,
          "line-dasharray": [2, 1]
        }
      });
    }
  }, [ready, routeGeoJSON]);

  useEffect(() => {
    if (!ready||!mapRef.current||!mlRef.current) return;
    const ml=mlRef.current, map=mapRef.current;
    nodes.forEach(node => {
      const color=statusHex(node.status), isSel=node.id===selectedId, isCrit=node.status==="CRITICAL";
      const size=isSel?46:isCrit?40:34;
      const el=document.createElement("div");
      el.style.cssText=`width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${isSel?"3px solid #004ac6":"2.5px solid #fff"};box-shadow:0 2px 10px rgba(0,0,0,.2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:9px;font-weight:700;color:#fff;position:relative;transition:all .2s;`;
      el.textContent=node.id.split("-")[1];
      if (isCrit) {
        if (!document.getElementById("sf-pulse-kf")) {
          const st=document.createElement("style");
          st.id="sf-pulse-kf";
          st.textContent="@keyframes sfPulse{0%,100%{transform:scale(1);opacity:.3}50%{transform:scale(1.6);opacity:0}}";
          document.head.appendChild(st);
        }
        const pulse=document.createElement("div");
        pulse.style.cssText=`position:absolute;inset:-7px;border-radius:50%;border:2px solid ${color};opacity:.3;animation:sfPulse 2s infinite;pointer-events:none;`;
        el.appendChild(pulse);
      }
      const label=document.createElement("div");
      label.className = "node-tooltip";
      label.style.cssText=`position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:6px;background:white;border:1px solid #e2e2e2;border-radius:6px;padding:4px 8px;white-space:nowrap;font-family:monospace;font-size:10px;font-weight:700;color:${color};box-shadow:0 4px 12px rgba(0,0,0,.15);pointer-events:none;opacity:0;transition:opacity 0.2s;z-index:50;`;
      label.textContent=`${node.level.toFixed(1)} cm`;
      el.appendChild(label);
      el.addEventListener("mouseenter", () => label.style.opacity="1");
      el.addEventListener("mouseleave", () => label.style.opacity="0");
      el.addEventListener("click",()=>onNodeClick?.(node));
      if (markersRef.current[node.id]) markersRef.current[node.id].remove();
      markersRef.current[node.id]=new ml.Marker({element:el,anchor:"center"}).setLngLat([node.lng,node.lat]).addTo(map);
    });
  }, [nodes, ready, selectedId, onNodeClick]);

  useEffect(() => {
    if (!ready||!mapRef.current||!selectedId) return;
    const node=nodes.find(n=>n.id===selectedId);
    if (node) mapRef.current.flyTo({center:[node.lng,node.lat],zoom:14,duration:900});
  }, [selectedId, ready, nodes]);

  if (mapError) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container gap-2">
      <span className="material-symbols-outlined text-4xl text-outline-variant">map_off</span>
      <p className="text-sm text-on-surface-variant">Map unavailable — check internet connection</p>
    </div>
  );

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full"/>
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-low gap-3 z-10">
          <div className="w-6 h-6 border-2 border-outline-variant border-t-primary rounded-full" style={{ animation:"sfSpin .6s linear infinite" }}/>
          <p className="font-label text-[11px] text-outline">Loading Hyderabad map…</p>
          <style>{`@keyframes sfSpin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Emergency Route Button */}
      {ready && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {routeStatus === "idle" && (
            <button onClick={calculateEmergencyRoute}
              className="flex items-center gap-1.5 bg-white/95 backdrop-blur border border-outline-variant/20 shadow px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface hover:bg-primary/5 transition-all">
              <span className="material-symbols-outlined text-[14px] text-primary">alt_route</span>
              Flood-Safe Route
            </button>
          )}
          {routeStatus === "loading" && (
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur border border-outline-variant/20 shadow px-3 py-1.5 rounded-lg text-[11px] text-outline">
              <div className="w-3 h-3 border border-outline-variant border-t-primary rounded-full animate-spin"/>
              Calculating route…
            </div>
          )}
          {routeStatus === "active" && (
            <div className="flex flex-col gap-1 bg-white/95 backdrop-blur border border-blue-200 shadow px-3 py-2 rounded-lg">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
                <span className="material-symbols-outlined text-[14px]">alt_route</span>
                Emergency Route Active
              </div>
              <div className="font-label text-[9px] text-outline">Old City → Secunderabad (avoids flood zone)</div>
              <button onClick={clearRoute}
                className="mt-1 text-[10px] text-outline underline text-left hover:text-on-surface transition-colors">
                Clear route
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
