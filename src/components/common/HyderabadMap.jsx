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
    if (map.getSource("pipes")) return;
    const features=PIPES.filter(([a,b])=>nm[a]&&nm[b]).map(([a,b])=>({
      type:"Feature",geometry:{type:"LineString",coordinates:[[nm[a].lng,nm[a].lat],[nm[b].lng,nm[b].lat]]}
    }));
    map.addSource("pipes",{type:"geojson",data:{type:"FeatureCollection",features}});
    map.addLayer({id:"pipes-line",type:"line",source:"pipes",paint:{"line-color":"#004ac6","line-width":2,"line-opacity":0.3,"line-dasharray":[4,3]}});
  }, [ready, nodes]);

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
      label.style.cssText=`position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:4px;background:#fff;border:1px solid #e2e2e2;border-radius:4px;padding:2px 5px;white-space:nowrap;font-family:monospace;font-size:9px;font-weight:600;color:${color};box-shadow:0 1px 4px rgba(0,0,0,.1);pointer-events:none;`;
      label.textContent=`${node.level.toFixed(1)}cm`;
      el.appendChild(label);
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
    </div>
  );
}
