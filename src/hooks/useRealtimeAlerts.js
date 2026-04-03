import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtimeAlerts = (crewZone, onAlertReceived) => {
  useEffect(() => {
    let mounted = true;
    
    // Request browser notification permission
    if (Notification.permission === 'default' || Notification.permission === 'prompt') {
      Notification.requestPermission();
    }
    
    // Subscribe to new high-priority alerts in crew's zone
    const channel = supabase
      .channel(`crew-alerts-${crewZone}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        async (payload) => {
          if (!mounted) return;
          const { priority, alert_type, node_id, water_level } = payload.new;
          
          if (priority === 'critical' || priority === 'high') {
            // Browser notification
            if (Notification.permission === 'granted') {
              new Notification(`🚨 ${alert_type?.toUpperCase()} Alert`, {
                body: `Node: ${node_id} | Water: ${water_level}%`,
                icon: '/alert-icon.png',
                tag: payload.new.id
              });
            }
            
            // Play alert sound
            const audio = new Audio('/alert-sound.mp3');
            audio.play().catch(() => {}); // Ignore autoplay errors
          }
          
          // Callback to update UI
          onAlertReceived?.(payload.new);
        }
      )
      .subscribe();
    
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [crewZone, onAlertReceived]);
};
