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

    for (const secret of [testKey, liveKey]) {
      if (!secret) continue
      const encoder = new TextEncoder()
      const keyData = encoder.encode(secret)
      const msgData = encoder.encode(body)
      const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const sig = await crypto.subtle.sign('HMAC', key, msgData)
      const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
      if (computed === signature) { isValid = true; break }
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
        .single()

      if (!tx) {
        console.error(`Transaction not found: ${reference}`)
        return new Response(JSON.stringify({ status: 'ignored', message: 'Transaction not found' }), { status: 200 })
      }

      if (tx.status === 'completed') {
        return new Response(JSON.stringify({ status: 'already_completed' }), { status: 200 })
      }

      // Mark transaction as completed
      await supabaseAdmin
        .from('payment_transactions')
        .update({
          status: 'completed',
          gateway_response: data,
          completed_at: new Date().toISOString(),
        })
        .eq('id', tx.id)

      // Determine plan tier from plan_id
      const TIER_MAP = {
        pro: { tier: 'pro', monthlyCredits: 1500 },
        pro_2weeks: { tier: 'pro', monthlyCredits: 1500 },
        pro_yearly: { tier: 'pro', monthlyCredits: 1500 },
        beast_monthly: { tier: 'beast', monthlyCredits: 999999 },
        beast_2weeks: { tier: 'beast', monthlyCredits: 999999 },
        beast_yearly: { tier: 'beast', monthlyCredits: 999999 },
        starter: { tier: 'pro', monthlyCredits: 1500 },
      }

      const mapping = TIER_MAP[tx.plan_id]
      if (mapping && tx.user_id) {
        await Promise.all([
          supabaseAdmin
            .from('profiles')
            .update({ is_premium: true, subscription_tier: mapping.tier })
            .eq('id', tx.user_id),
          supabaseAdmin
            .from('user_stats')
            .upsert(
              { user_id: tx.user_id, ai_credits_monthly: mapping.monthlyCredits, ai_credits_used: 0 },
              { onConflict: 'user_id' }
            ),
        ])
        console.log(`Upgraded user ${tx.user_id} to ${mapping.tier}`)
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
