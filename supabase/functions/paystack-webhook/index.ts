import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    if (!signature) {
      throw new Error('Missing Paystack signature')
    }

    // Try both test and live secret keys for verification
    const testKey = Deno.env.get('PAYSTACK_TEST_SECRET_KEY')
    const liveKey = Deno.env.get('PAYSTACK_LIVE_SECRET_KEY')
    let isValid = false
    let activeSecretKey = ''

    for (const secret of [testKey, liveKey]) {
      if (!secret) continue
      const encoder = new TextEncoder()
      const keyData = encoder.encode(secret)
      const msgData = encoder.encode(body)
      const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
      const sig = await crypto.subtle.sign('HMAC', key, msgData)
      const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
      if (computed === signature) { 
        isValid = true;
        activeSecretKey = secret;
        break 
      }
    }

    if (!isValid) {
      throw new Error('Invalid webhook signature')
    }

    const event = JSON.parse(body)

    if (event.event === 'charge.success') {
      const data = event.data
      const reference = data.reference

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      )

      // Find the transaction
      const { data: tx } = await supabaseAdmin
        .from('payment_transactions')
        .select('id, user_id, plan_id, status')
        .eq('reference', reference)
        .maybeSingle()

      if (tx && tx.status === 'completed') {
        return new Response(JSON.stringify({ status: 'already_completed' }), { status: 200 })
      }

      let userId = tx?.user_id || null
      let planId = tx?.plan_id || null
      let txId = tx?.id || null

      if (!tx) {
        // Fallback/Self-healing for subscription auto-renewals
        const customerEmail = data.customer?.email
        if (customerEmail) {
          const { data: users } = await supabaseAdmin
            .schema('auth')
            .from('users')
            .select('id')
            .eq('email', customerEmail)
            .limit(1)

          if (users && users.length > 0) {
            userId = users[0].id
          }
        }

        // Map planId from Paystack's plan code or metadata
        const paystackPlan = typeof data.plan === 'object' ? data.plan?.plan_code : data.plan
        if (paystackPlan) {
          planId = paystackPlan
        } else if (data.metadata?.plan_id) {
          planId = data.metadata.plan_id
        }

        // Fallback default
        if (!planId) {
          planId = 'pro_monthly'
        }
      }

      if (!tx && userId) {
        // Insert new completed transaction log for this auto-renewal
        const { data: newTx } = await supabaseAdmin
          .from('payment_transactions')
          .insert({
            user_id: userId,
            plan_id: planId,
            amount: (data.amount || 0) / 100,
            currency: data.currency || 'NGN',
            reference: reference,
            gateway: 'paystack',
            status: 'completed',
            gateway_response: data,
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          })
          .select('id')
          .single()
        if (newTx) {
          txId = newTx.id
        }
      } else if (tx) {
        // Update existing transaction
        await supabaseAdmin
          .from('payment_transactions')
          .update({
            status: 'completed',
            gateway_response: data,
            completed_at: new Date().toISOString(),
          })
          .eq('id', tx.id)
      }

      // Determine standard plan ID from environment mapping if exists
      let resolvedPlanId = planId || 'pro_monthly'
      
      const PRO_VARS = [
        'PAYSTACK_PLAN_PRO_MONTHLY',
        'PAYSTACK_PLAN_PRO_WEEKLY',
        'PAYSTACK_PLAN_PRO_YEARLY',
        'PAYSTACK_PLAN_PRO_MONTHLY_USD',
        'PAYSTACK_PLAN_PRO_YEARLY_USD'
      ]
      const BEAST_VARS = [
        'PAYSTACK_PLAN_BEAST_MONTHLY',
        'PAYSTACK_PLAN_BEAST_WEEKLY',
        'PAYSTACK_PLAN_BEAST_YEARLY',
        'PAYSTACK_PLAN_BEAST_MONTHLY_USD',
        'PAYSTACK_PLAN_BEAST_YEARLY_USD'
      ]

      if (planId) {
        for (const envVar of PRO_VARS) {
          if (Deno.env.get(envVar) === planId) {
            resolvedPlanId = envVar.replace('PAYSTACK_PLAN_', '').toLowerCase()
            break
          }
        }
        for (const envVar of BEAST_VARS) {
          if (Deno.env.get(envVar) === planId) {
            resolvedPlanId = envVar.replace('PAYSTACK_PLAN_', '').toLowerCase()
            break
          }
        }
      }

      // Determine plan tier from resolvedPlanId
      const TIER_MAP: Record<string, { tier: string; monthlyCredits: number }> = {
        pro: { tier: 'pro', monthlyCredits: 2000 },
        pro_2weeks: { tier: 'pro', monthlyCredits: 2000 },
        pro_weekly: { tier: 'pro', monthlyCredits: 2000 },
        pro_weekly_oneoff: { tier: 'pro', monthlyCredits: 2000 },
        pro_promo: { tier: 'pro', monthlyCredits: 2000 },
        pro_monthly: { tier: 'pro', monthlyCredits: 2000 },
        pro_yearly: { tier: 'pro', monthlyCredits: 2000 },
        pro_monthly_usd: { tier: 'pro', monthlyCredits: 2000 },
        pro_yearly_usd: { tier: 'pro', monthlyCredits: 2000 },
        beast_monthly: { tier: 'beast', monthlyCredits: 999999 },
        beast_2weeks: { tier: 'beast', monthlyCredits: 999999 },
        beast_weekly: { tier: 'beast', monthlyCredits: 999999 },
        beast_weekly_oneoff: { tier: 'beast', monthlyCredits: 999999 },
        beast_promo: { tier: 'beast', monthlyCredits: 999999 },
        beast_yearly: { tier: 'beast', monthlyCredits: 999999 },
        beast_monthly_usd: { tier: 'beast', monthlyCredits: 999999 },
        beast_yearly_usd: { tier: 'beast', monthlyCredits: 999999 },
        starter: { tier: 'pro', monthlyCredits: 2000 },
      }

      const mapping = TIER_MAP[resolvedPlanId]
      if (mapping && userId) {
        const now = new Date()
        let expiresAt: Date
        let subscriptionType = 'monthly'

        if (resolvedPlanId.includes('weekly') || resolvedPlanId.includes('week')) {
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          subscriptionType = 'weekly'
        } else if (resolvedPlanId.includes('yearly') || resolvedPlanId.includes('year')) {
          expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
          subscriptionType = 'yearly'
        } else {
          expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
          subscriptionType = 'monthly'
        }

        await Promise.all([
          supabaseAdmin
            .from('profiles')
            .update({ 
              is_premium: true, 
              subscription_tier: mapping.tier,
              subscription_type: subscriptionType,
              subscription_expires_at: expiresAt.toISOString()
            })
            .eq('id', userId),
          supabaseAdmin
            .from('user_stats')
            .upsert(
              { user_id: userId, ai_credits_monthly: mapping.monthlyCredits, ai_credits_used: 0 },
              { onConflict: 'user_id' }
            ),
        ])
        console.log(`Upgraded user ${userId} to ${mapping.tier} (Expires: ${expiresAt.toISOString()})`)

        // Promo subscription chaining
        if (resolvedPlanId === 'pro_promo' || resolvedPlanId === 'beast_promo') {
          const standardPlanCode = resolvedPlanId === 'pro_promo' ? 'pro_monthly' : 'beast_monthly'
          const mappedStandardPlanCode = Deno.env.get(`PAYSTACK_PLAN_${standardPlanCode.toUpperCase()}`) || standardPlanCode
          const authCode = data.authorization?.authorization_code
          const customerEmail = data.customer?.email

          if (authCode && customerEmail && activeSecretKey) {
            // Set first charge date to 1 month from now
            const startDate = new Date()
            startDate.setMonth(startDate.getMonth() + 1)
            const startIso = startDate.toISOString()

            console.log(`Chaining recurring subscription for ${customerEmail} to ${mappedStandardPlanCode} starting ${startIso}`)

            try {
              const subResponse = await fetch('https://api.paystack.co/subscription', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${activeSecretKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  customer: customerEmail,
                  plan: mappedStandardPlanCode,
                  authorization: authCode,
                  start_date: startIso
                })
              })

              const subResult = await subResponse.json()
              if (!subResult.status) {
                console.error('Failed to chain recurring subscription:', subResult.message)
              } else {
                console.log('Successfully chained subscription:', subResult.data?.subscription_code)
                if (txId) {
                  const { data: currentTx } = await supabaseAdmin
                    .from('payment_transactions')
                    .select('gateway_response')
                    .eq('id', txId)
                    .single()

                  const updatedResponse = {
                    ...currentTx?.gateway_response,
                    chained_subscription: subResult.data
                  }

                  await supabaseAdmin
                    .from('payment_transactions')
                    .update({ gateway_response: updatedResponse })
                    .eq('id', txId)
                }
              }
            } catch (fetchErr) {
              console.error('Error calling Paystack subscription API:', fetchErr)
            }
          }
        }
      }

      return new Response(JSON.stringify({ status: 'completed' }), { status: 200 })
    }

    // Acknowledge other events
    return new Response(JSON.stringify({ status: 'received', event: event.event }), { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
