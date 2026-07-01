import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  try {
    const { reference } = await req.json();
    if (!reference) {
      return new Response(JSON.stringify({ error: 'Missing reference' }), { status: 400, headers: corsHeaders });
    }

    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader || '' } } }
    );

    const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Fetch transaction
    const { data: tx } = await supabaseAdmin
      .from('payment_transactions')
      .select('id, user_id, plan_id, status, gateway_response')
      .eq('reference', reference)
      .maybeSingle();

    if (!tx) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404, headers: corsHeaders });
    }
    
    // Security check: Only the owner or an admin can verify this
    if (tx.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    // If already completed, just return success
    if (tx.status === 'completed') {
      return new Response(JSON.stringify({ status: 'completed' }), { status: 200, headers: corsHeaders });
    }

    // 2. Ask Paystack
    const { data: settings } = await supabaseAdmin.from('payment_settings').select('paystack_mode').single();
    const mode = settings?.paystack_mode || 'test';
    const isLiveMode = mode === 'live';
    const secretKeyName = isLiveMode ? 'PAYSTACK_LIVE_SECRET_KEY' : 'PAYSTACK_TEST_SECRET_KEY';
    const paystackSecretKey = Deno.env.get(secretKeyName);

    if (!paystackSecretKey) {
      throw new Error(`Paystack ${mode} secret key not configured`);
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`
      }
    });

    const result = await response.json();

    if (result.status === true && result.data.status === 'success') {
      const data = result.data;
      
      // Update transaction
      await supabaseAdmin
        .from('payment_transactions')
        .update({
          status: 'completed',
          gateway_response: data,
          completed_at: new Date().toISOString(),
        })
        .eq('id', tx.id);

      // Upgrade user
      let planId = tx.plan_id || 'pro_monthly';
      let resolvedPlanId = planId;
      
      const PRO_VARS = [
        'PAYSTACK_PLAN_PRO_MONTHLY', 'PAYSTACK_PLAN_PRO_WEEKLY', 'PAYSTACK_PLAN_PRO_YEARLY',
        'PAYSTACK_PLAN_PRO_MONTHLY_USD', 'PAYSTACK_PLAN_PRO_YEARLY_USD'
      ];
      const BEAST_VARS = [
        'PAYSTACK_PLAN_BEAST_MONTHLY', 'PAYSTACK_PLAN_BEAST_WEEKLY', 'PAYSTACK_PLAN_BEAST_YEARLY',
        'PAYSTACK_PLAN_BEAST_MONTHLY_USD', 'PAYSTACK_PLAN_BEAST_YEARLY_USD'
      ];

      for (const envVar of PRO_VARS) {
        if (Deno.env.get(envVar) === planId) {
          resolvedPlanId = envVar.replace('PAYSTACK_PLAN_', '').toLowerCase();
          break;
        }
      }
      for (const envVar of BEAST_VARS) {
        if (Deno.env.get(envVar) === planId) {
          resolvedPlanId = envVar.replace('PAYSTACK_PLAN_', '').toLowerCase();
          break;
        }
      }

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
      };

      const mapping = TIER_MAP[resolvedPlanId] || { tier: 'pro', monthlyCredits: 2000 };
      
      const now = new Date();
      let expiresAt: Date;
      let subscriptionType = 'monthly';

      if (resolvedPlanId.includes('weekly') || resolvedPlanId.includes('week')) {
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        subscriptionType = 'weekly';
      } else if (resolvedPlanId.includes('yearly') || resolvedPlanId.includes('year')) {
        expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        subscriptionType = 'yearly';
      } else {
        expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        subscriptionType = 'monthly';
      }

      const [profileRes, statsRes] = await Promise.all([
        supabaseAdmin
          .from('profiles')
          .update({ 
            is_premium: true, 
            subscription_tier: mapping.tier,
            subscription_type: subscriptionType,
            subscription_expires_at: expiresAt.toISOString()
          })
          .eq('id', user.id),
        supabaseAdmin
          .from('user_stats')
          .upsert(
            { user_id: user.id, ai_credits_monthly: mapping.monthlyCredits, ai_credits_used: 0 },
            { onConflict: 'user_id' }
          ),
      ]);

      if (profileRes.error) {
        console.error('Profile update failed:', profileRes.error);
        return new Response(JSON.stringify({ status: 'error', error: 'Failed to update profile' }), { status: 500, headers: corsHeaders });
      }

      if (statsRes.error) {
        console.error('Stats update failed:', statsRes.error);
        return new Response(JSON.stringify({ status: 'error', error: 'Failed to update stats' }), { status: 500, headers: corsHeaders });
      }
      
      return new Response(JSON.stringify({ status: 'completed' }), { status: 200, headers: corsHeaders });
    } else {
      return new Response(JSON.stringify({ status: 'pending', error: 'Payment not successful yet' }), { status: 400, headers: corsHeaders });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
