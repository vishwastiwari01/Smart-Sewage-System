import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useCrewNotifications
 * Listens to realtime INSERT events on both `alerts` and `reports` tables
 * filtered to the crew's zone. Fires browser notifications and calls callbacks.
 */
export function useCrewNotifications(crewZone, { onAlert, onReport } = {}) {
  const onAlertRef = useRef(onAlert);
  const onReportRef = useRef(onReport);
  useEffect(() => { onAlertRef.current = onAlert; }, [onAlert]);
  useEffect(() => { onReportRef.current = onReport; }, [onReport]);

  useEffect(() => {
    if (!crewZone) return;

    // Request browser notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const alertChannel = supabase
      .channel(`crew-alerts-${crewZone}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts',
      }, (payload) => {
        const { priority, alert_type, node_id, water_level } = payload.new;
        if (priority === 'critical' || priority === 'high') {
          if (Notification.permission === 'granted') {
            new Notification(`🚨 ${(alert_type || 'ALERT').toUpperCase()} — ${priority.toUpperCase()}`, {
              body: `Node: ${node_id} | Water: ${water_level?.toFixed?.(1) ?? '?'}% | Zone: ${payload.new.zone}`,
              icon: '/favicon.ico',
              tag: `alert-${payload.new.id}`,
              requireInteraction: priority === 'critical',
            });
          }
          // Play alert sound
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = priority === 'critical' ? 880 : 660;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            osc.start();
            osc.stop(ctx.currentTime + 0.8);
          } catch {}
        }
        onAlertRef.current?.(payload.new);
      })
      .subscribe();

    const reportChannel = supabase
      .channel(`crew-reports-${crewZone}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reports',
      }, (payload) => {
        if (payload.new.zone === crewZone) {
          if (Notification.permission === 'granted') {
            new Notification(`📋 New Citizen Report — ${crewZone}`, {
              body: payload.new.description?.slice(0, 80) ?? 'A citizen has filed a new report in your zone.',
              icon: '/favicon.ico',
              tag: `report-${payload.new.id}`,
            });
          }
          onReportRef.current?.(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(alertChannel);
      supabase.removeChannel(reportChannel);
    };
  }, [crewZone]);
}
