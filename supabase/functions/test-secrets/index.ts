import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    // Test if secrets are available
    const secrets = {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'NOT SET',
      PAYSTACK_TEST_SECRET_KEY: Deno.env.get('PAYSTACK_TEST_SECRET_KEY') ? 'SET' : 'NOT SET',
      PAYSTACK_LIVE_SECRET_KEY: Deno.env.get('PAYSTACK_LIVE_SECRET_KEY') ? 'SET' : 'NOT SET',
      PAYSTACK_TEST_PUBLIC_KEY: Deno.env.get('PAYSTACK_TEST_PUBLIC_KEY') ? 'SET' : 'NOT SET',
      PAYSTACK_LIVE_PUBLIC_KEY: Deno.env.get('PAYSTACK_LIVE_PUBLIC_KEY') ? 'SET' : 'NOT SET',
    }

    return new Response(JSON.stringify({ 
      status: 'success',
      secrets: secrets
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      status: 'error',
      message: error.message 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
