import { useState, useEffect } from 'react';

export function useWeather() {
  const [rainfall, setRainfall] = useState([
    { label: "Now",    mm: 0, prob: 0, color: "#16a34a" },
    { label: "+1 hr",  mm: 0, prob: 0, color: "#16a34a" },
    { label: "+2 hrs", mm: 0, prob: 0, color: "#16a34a" },
    { label: "+3 hrs", mm: 0, prob: 0, color: "#16a34a" },
    { label: "+6 hrs", mm: 0, prob: 0, color: "#16a34a" },
  ]);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError]       = useState(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        const lat = 17.385;
        const lon = 78.4867;

        // Fetch current + hourly data — all free, no key needed
        const url = [
          `https://api.open-meteo.com/v1/forecast`,
          `?latitude=${lat}&longitude=${lon}`,
          `&current_weather=true`,
          `&hourly=precipitation,precipitation_probability,temperature_2m,windspeed_10m,relativehumidity_2m`,
          `&timezone=Asia%2FKolkata`,
          `&forecast_days=2`,
        ].join('');

        const res  = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch weather data');
        const data = await res.json();

        if (data.current_weather) {
          const cw = data.current_weather;
          // Find current hour index for humidity, etc.
          const nowHour = new Date().getHours();
          const nowDate = new Date().toISOString().split('T')[0];
          let idx = (data.hourly?.time || []).findIndex(
            t => t.startsWith(nowDate) && parseInt(t.split('T')[1]) === nowHour
          );
          if (idx === -1) idx = 0;

          setCurrentWeather({
            temp:        cw.temperature,
            windspeed:   cw.windspeed,
            weathercode: cw.weathercode,
            humidity:    data.hourly?.relativehumidity_2m?.[idx] ?? '--',
            isDay:       cw.is_day,
          });
        }

        if (data.hourly?.time && data.hourly?.precipitation) {
          const nowHour = new Date().getHours();
          const nowDate = new Date().toISOString().split('T')[0];
          let currentIndex = data.hourly.time.findIndex(
            t => t.startsWith(nowDate) && parseInt(t.split('T')[1]) === nowHour
          );
          if (currentIndex === -1) currentIndex = 0;

          const getPrecip = (offset) =>
            parseFloat((data.hourly.precipitation[currentIndex + offset] || 0).toFixed(1));
          const getProb = (offset) =>
            data.hourly.precipitation_probability?.[currentIndex + offset] ?? 0;
          const getColor = (mm, prob) => {
            if (mm >= 15 || prob >= 80) return '#ba1a1a';
            if (mm >= 5  || prob >= 50) return '#d97706';
            return '#16a34a';
          };

          const slots = [0, 1, 2, 3, 6];
          const labels = ['Now', '+1 hr', '+2 hrs', '+3 hrs', '+6 hrs'];
          setRainfall(slots.map((offset, i) => {
            const mm   = getPrecip(offset);
            const prob = getProb(offset);
            return { label: labels[i], mm, prob, color: getColor(mm, prob) };
          }));
        }

        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour12: false }));
        setError(null);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Derive overall flood risk level from rainfall forecast
  const floodRisk = (() => {
    const maxMm = Math.max(...rainfall.map(r => r.mm));
    const maxProb = Math.max(...rainfall.map(r => r.prob));
    if (maxMm >= 15 || maxProb >= 80) return 'HIGH';
    if (maxMm >= 5  || maxProb >= 50) return 'MODERATE';
    return 'LOW';
  })();

  return { rainfall, currentWeather, loading, error, lastUpdated, floodRisk };
}
