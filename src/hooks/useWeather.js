import { useState, useEffect } from 'react';

export function useWeather() {
  const [rainfall, setRainfall] = useState([
    { label: "Now", mm: 0, color: "#16a34a" },
    { label: "+1 hrs", mm: 0, color: "#16a34a" },
    { label: "+2 hrs", mm: 0, color: "#16a34a" },
    { label: "+3 hrs", mm: 0, color: "#16a34a" },
    { label: "+6 hrs", mm: 0, color: "#16a34a" }
  ]);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        // Hyderabad coordinates
        const lat = 17.385;
        const lon = 78.4867;
        // Fetch current weather, and hourly precipitation for the next 24 hours
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation&timezone=Asia%2FKolkata&forecast_days=2`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch weather data");
        const data = await res.json();
        
        if (data.current_weather) {
          setCurrentWeather(data.current_weather);
        }

        if (data.hourly && data.hourly.time && data.hourly.precipitation) {
          // Find the index of the current hour
          const nowIso = new Date().toISOString().slice(0, 14) + "00"; // e.g. "2026-09-01T14:00"
          // We need to parse dates because Open-Meteo returns 'YYYY-MM-DDTHH:00'
          const nowHour = new Date().getHours();
          const nowDate = new Date().toISOString().split('T')[0];
          
          let currentIndex = data.hourly.time.findIndex(t => t.startsWith(nowDate) && parseInt(t.split('T')[1].split(':')[0]) === nowHour);
          if (currentIndex === -1) currentIndex = 0; // fallback

          const getPrecip = (offsetHours) => {
             const val = data.hourly.precipitation[currentIndex + offsetHours] || 0;
             return parseFloat(val.toFixed(1));
          };

          const getColor = (mm) => {
            if (mm >= 15) return "#ba1a1a"; // Critical
            if (mm >= 5) return "#d97706"; // Warning
            return "#16a34a"; // Normal
          };

          const pNow = getPrecip(0);
          const p1 = getPrecip(1);
          const p2 = getPrecip(2);
          const p3 = getPrecip(3);
          const p6 = getPrecip(6);

          setRainfall([
            { label: "Now", mm: pNow, color: getColor(pNow) },
            { label: "+1 hrs", mm: p1, color: getColor(p1) },
            { label: "+2 hrs", mm: p2, color: getColor(p2) },
            { label: "+3 hrs", mm: p3, color: getColor(p3) },
            { label: "+6 hrs", mm: p6, color: getColor(p6) },
          ]);
        }
      } catch (err) {
        console.error("Error fetching live weather:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    // Refresh every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { rainfall, currentWeather, loading, error };
}
