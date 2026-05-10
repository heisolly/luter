import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    const { planId, email, amount, currency = 'NGN', callback_url } = await req.json()
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Get payment gateway settings
    const { data: settings } = await supabaseClient
      .from('payment_settings')
      .select('paystack_enabled, paystack_mode')
      .single()

    if (!settings?.paystack_enabled) {
      throw new Error('Payment gateway is currently disabled')
    }

    // Determine which key to use based on mode
    const isLiveMode = settings?.paystack_mode === 'live'
    const secretKeyName = isLiveMode ? 'PAYSTACK_LIVE_SECRET_KEY' : 'PAYSTACK_TEST_SECRET_KEY'
    
    // Initialize Paystack with appropriate key
    const paystackSecretKey = Deno.env.get(secretKeyName)
    if (!paystackSecretKey) {
      throw new Error(`Paystack ${settings?.paystack_mode || 'test'} secret key not configured`)
    }

    // Create Paystack payment initialization
    const paymentData = {
      email: email || user.email,
      amount: amount * 100, // Paystack expects amount in kobo (cents)
      currency: currency,
      reference: `luter_${user.id}_${Date.now()}`,
      callback_url: callback_url || `${req.headers.get('origin')}/dashboard/payment/success`,
      metadata: {
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: user.id
          },
          {
            display_name: "Plan ID",
            variable_name: "plan_id", 
            value: planId
          }
        ]
      }
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    })

    const result = await response.json()

    if (!result.status) {
      throw new Error(result.message || 'Failed to initialize payment')
    }

    // Store transaction reference in database
    await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        amount: amount,
        currency: currency,
        reference: result.data.reference,
        gateway: 'paystack',
        status: 'pending',
        created_at: new Date().toISOString()
      })

    // Determine public key based on mode
    const publicKeyName = isLiveMode ? 'PAYSTACK_LIVE_PUBLIC_KEY' : 'PAYSTACK_TEST_PUBLIC_KEY'
    const paystackPublicKey = Deno.env.get(publicKeyName)

    return new Response(JSON.stringify({ 
      url: result.data.authorization_url,
      reference: result.data.reference,
      publicKey: paystackPublicKey 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Paystack checkout error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      status: 400,
    })
  }
})
