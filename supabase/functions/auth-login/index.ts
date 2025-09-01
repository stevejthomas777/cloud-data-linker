import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from "https://deno.land/x/scrypt@v4.4.4/mod.ts";

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
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required', valid: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from database
    const { data: user, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password', valid: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Verify password using scrypt
    const valid = await verify(password, user.password_hash);
    
    if (valid) {
      return new Response(JSON.stringify({ valid: true, userId: user.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid username or password', valid: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }
  } catch (error) {
    console.error('Error in auth-login function:', error);
    return new Response(JSON.stringify({ error: error.message, valid: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});