import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, formCode, email, lastName } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get user and form info
    const { data: userData } = await supabaseClient
      .from('users')
      .select('id')
      .eq('username', username)
      .single();
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    const { data: formData } = await supabaseClient
      .from('forms')
      .select('id')
      .eq('form_code', formCode)
      .eq('user_id', userData.id)
      .single();
    
    if (!formData) {
      throw new Error('Form not found');
    }
    
    // Get client IP address and location data
    let clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || 'unknown';
    
    // Clean up IP if it contains multiple IPs (take first one)
    if (clientIP.includes(',')) {
      clientIP = clientIP.split(',')[0].trim();
    }
    
    console.log('Client IP:', clientIP);
    
    let ipData = { city: 'Unknown', region: 'Unknown', country: 'Unknown' };
    
    if (clientIP !== 'unknown' && clientIP !== '127.0.0.1') {
      try {
        const ipResponse = await fetch(`https://ipinfo.io/${clientIP}?token=ea907fcf23c277`);
        if (ipResponse.ok) {
          ipData = await ipResponse.json();
          console.log('IP Data:', ipData);
        }
      } catch (error) {
        console.error('Error fetching IP data:', error);
      }
    }
    
    // Get user agent from request headers
    const userAgent = req.headers.get('user-agent') || '';
    
    // Insert submission
    const { data, error } = await supabaseClient
      .from('submissions')
      .insert([{
        form_id: formData.id,
        user_id: userData.id,
        email,
        last_name: lastName,
        city: ipData.city,
        region: ipData.region,
        country: ipData.country,
        ip_address: clientIP,
        user_agent: userAgent
      }])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return new Response(JSON.stringify({ success: true, submission: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in submit-form function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});