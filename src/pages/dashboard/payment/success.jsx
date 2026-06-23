import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const TIER_MAP = {
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
  beast_weekly: { tier: 'beast', monthlyCredits: 999999 },
  beast_weekly_oneoff: { tier: 'beast', monthlyCredits: 999999 },
  beast_promo: { tier: 'beast', monthlyCredits: 999999 },
  beast_yearly: { tier: 'beast', monthlyCredits: 999999 },
  beast_monthly_usd: { tier: 'beast', monthlyCredits: 999999 },
  beast_yearly_usd: { tier: 'beast', monthlyCredits: 999999 },
  starter: { tier: 'pro', monthlyCredits: 2000 },
}

export default function PaymentSuccess() {
  const query = useQuery();
  const navigate = useNavigate();
  const reference = query.get('reference');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setMessage('Missing transaction reference.');
      return;
    }

    let cancelled = false
    let pollAttempts = 0
    const MAX_POLL_ATTEMPTS = 30

    const verifyAndUpgrade = async () => {
      while (!cancelled && pollAttempts < MAX_POLL_ATTEMPTS) {
        const { data, error } = await supabase
          .from('payment_transactions')
          .select('status, user_id, plan_id')
          .eq('reference', reference)
          .single();

        if (error || !data) {
          setStatus('error');
          setMessage('Unable to fetch transaction. Please contact support.');
          return;
        }

        if (data.status === 'completed') {
          // Upgrade user based on the plan they purchased
          const mapping = TIER_MAP[data.plan_id]
          if (mapping && data.user_id) {
            await Promise.all([
              supabase
                .from('profiles')
                .update({ is_premium: true, subscription_tier: mapping.tier })
                .eq('id', data.user_id),
              supabase
                .from('user_stats')
                .upsert(
                  { user_id: data.user_id, ai_credits_monthly: mapping.monthlyCredits, ai_credits_used: 0 },
                  { onConflict: 'user_id' }
                ),
            ])
            try {
              localStorage.removeItem(`luter:profile:${data.user_id}`)
            } catch (e) {
              console.warn('Failed to clear cache:', e)
            }
          }

          setStatus('success');
          setMessage('Payment confirmed! Redirecting...');
          setTimeout(() => {
            window.location.href = `/upgrade?payment=success&tier=${mapping?.tier || 'pro'}`
          }, 2000);
          return;
        }

        // Still pending — wait and retry
        pollAttempts++
        setMessage(`Waiting for payment confirmation (${pollAttempts}/${MAX_POLL_ATTEMPTS})...`)
        await new Promise(r => setTimeout(r, 2000))
      }

      if (!cancelled) {
        setStatus('error');
        setMessage('Payment confirmation timed out. Your payment may still be processing — refresh to check.');
      }
    };

    verifyAndUpgrade();
    return () => { cancelled = true }
  }, [reference, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        {status === 'loading' && <p>Verifying payment…</p>}
        {status === 'success' && <p className="text-green-600 font-semibold">{message}</p>}
        {status === 'error' && <p className="text-red-600 font-semibold">{message}</p>}
      </div>
    </div>
  );
}
