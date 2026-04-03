import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: Map node_id to zone (expandable to DB lookup)
async function getNodeZone(nodeId: string): Promise<string> {
  const zoneMap: Record<string, string> = { 'NODE_HYD_01': 'Zone-1', 'NODE_HYD_02': 'Zone-2' };
  return zoneMap[nodeId] || 'Zone-1';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { node_id, water_level, gas_level, alert_type, priority = 'medium' } = await req.json();
    
    // 1. Insert into alerts table
    const { data: alert, error: alertErr } = await supabase
      .from('alerts')
      .insert({
        node_id,
        water_level,
        gas_level,
        alert_type: alert_type || (water_level > 80 ? 'overflow' : 'gas'),
        priority: water_level > 90 || gas_level > 60 ? 'critical' : priority,
        status: 'active',
        zone: await getNodeZone(node_id)
      })
      .select()
      .single();
    
    if (alertErr) throw alertErr;
    
    // 2. Create notifications for crew in same zone
    const { data: crew } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'crew')
      .eq('zone', alert.zone);
    
    if (crew && crew.length > 0) {
      const notifications = crew.map((c: any) => ({
        user_id: c.id,
        message: `🚨 ${alert.alert_type?.toUpperCase()} alert at ${node_id}! Water: ${water_level}%, Gas: ${gas_level}%`,
        alert_id: alert.id,
        priority: alert.priority
      }));
      
      await supabase.from('notifications').insert(notifications);
    }
    
    return new Response(JSON.stringify({ success: true, alert_id: alert.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
