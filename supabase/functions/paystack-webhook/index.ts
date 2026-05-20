import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')
    
    // Log webhook receipt
    console.log('Paystack webhook received')
    console.log('Signature present:', !!signature)
    
    const event = JSON.parse(body)
    console.log('Paystack webhook event:', event.event, 'Reference:', event.data?.reference)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle different event types
    if (event.event === 'charge.success') {
      const { data } = event
      const reference = data.reference
      
      // Update transaction status
      const { data: transaction } = await supabaseClient
        .from('payment_transactions')
        .update({ 
          status: 'completed',
          gateway_response: data,
          completed_at: new Date().toISOString()
        })
        .eq('reference', reference)
        .select()
        .single()

      // Update user subscription
      if (transaction && transaction.user_id && transaction.plan_id) {
        const planMap: { [key: string]: { tier: string; type: string } } = {
          'price_1TQBBYHPD8pnlRZIniqKwUo0': { tier: 'pro', type: 'monthly' },
          'price_1TQBBcHPD8pnlRZImYqlm80o': { tier: 'pro', type: 'semester' },
          'price_1TQBBdHPD8pnlRZIp7HSWNQj': { tier: 'premium', type: 'monthly' },
          'price_1TQBBeHPD8pnlRZIeg7YvWbb': { tier: 'premium', type: 'semester' },
          'ultimate': { tier: 'pro', type: 'monthly' },
          'premium': { tier: 'premium', type: 'monthly' },
          'starter': { tier: 'premium', type: 'starter' },
          'beast_monthly': { tier: 'premium', type: 'monthly' },
          'beast_quarterly': { tier: 'premium', type: 'quarterly' },
          'beast_yearly': { tier: 'premium', type: 'yearly' },
          'beast_annual': { tier: 'premium', type: 'yearly' },
          'wizard_monthly': { tier: 'premium', type: 'monthly' },
          'wizard_quarterly': { tier: 'premium', type: 'quarterly' },
          'wizard_annual': { tier: 'premium', type: 'annual' },
          'monthly': { tier: 'premium', type: 'monthly' },
          'quarterly': { tier: 'premium', type: 'quarterly' },
          'annual': { tier: 'premium', type: 'annual' },
        }

        const planInfo = planMap[transaction.plan_id]
        if (planInfo) {
          // Fetch existing user profile to support credit preservation
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('subscription_expires_at')
            .eq('id', transaction.user_id)
            .single()

          const now = new Date()
          let baseDate = now

          // If current subscription expires in the future, save their credit by starting from that expiry date!
          if (profile && profile.subscription_expires_at) {
            const currentExpiry = new Date(profile.subscription_expires_at)
            if (currentExpiry > now) {
              baseDate = currentExpiry
            }
          }

          const expiryDate = new Date(baseDate)
            
          if (planInfo.type === 'annual' || planInfo.type === 'yearly') {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1)
          } else if (planInfo.type === 'quarterly') {
            // Beast Quarterly plan duration is 4 months (Monthly * 4 - 20% discount)
            expiryDate.setMonth(expiryDate.getMonth() + 4)
          } else if (planInfo.type === 'starter') {
            // Starter Plan has 2 weeks (14 days) duration
            expiryDate.setDate(expiryDate.getDate() + 14)
          } else if (planInfo.type === 'semester') {
            if (planInfo.tier === 'premium') {
              expiryDate.setFullYear(expiryDate.getFullYear() + 1) // 1 year for Executive long-term
            } else {
              expiryDate.setMonth(expiryDate.getMonth() + 4) // 4 months for Pro semester
            }
          } else {
            expiryDate.setMonth(expiryDate.getMonth() + 1) // 1 month for monthly
          }

          await supabaseClient
            .from('profiles')
            .update({
              subscription_tier: planInfo.tier,
              subscription_type: planInfo.type,
              subscription_expires_at: expiryDate.toISOString(),
              is_premium: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', transaction.user_id)

          console.log(`Updated subscription for user ${transaction.user_id} to ${planInfo.tier} (${planInfo.type}) expiring at ${expiryDate.toISOString()}`)
        }
      }
    }

    return new Response('Webhook processed', { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
