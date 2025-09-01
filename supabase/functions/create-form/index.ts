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
    const { userId } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Verify the user exists
    const { data: userCheck, error: userCheckError } = await supabaseClient
      .from('users')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle();
    
    if (userCheckError || !userCheck) {
      throw new Error('User not found');
    }
    
    // Generate unique form code
    const { data: formCode, error: codeError } = await supabaseClient
      .rpc('generate_form_code');
    
    if (codeError) {
      throw codeError;
    }
    
    // Create the form
    const { data: formData, error: formError } = await supabaseClient
      .from('forms')
      .insert([{ user_id: userId, form_code: formCode }])
      .select()
      .single();
    
    if (formError) {
      throw formError;
    }
    
    return new Response(JSON.stringify({ form: formData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in create-form function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});