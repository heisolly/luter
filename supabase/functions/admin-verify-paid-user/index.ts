import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Admin endpoint to verify a user as paid based on completed transactions
// Expects JSON body: { user_id: string }

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { user_id } = await req.json();
  if (!user_id) {
    return new Response(JSON.stringify({ error: "Missing user_id" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Find a completed payment for this user
  const { data: tx, error: txErr } = await supabaseClient
    .from("payment_transactions")
    .select("plan_id")
    .eq("user_id", user_id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (txErr) {
    return new Response(JSON.stringify({ error: "No completed transaction found for user" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  // Map plan to subscription type (reuse same mapping as webhook)
  const planMap: { [key: string]: { tier: string; type: string; is_premium: boolean } } = {
    "price_1TQBBYHPD8pnlRZIniqKwUo0": { tier: "pro", type: "monthly", is_premium: true },
    "price_1TQBBcHPD8pnlRZImYqlm80o": { tier: "pro", type: "semester", is_premium: true },
    "price_1TQBBdHPD8pnlRZIp7HSWNQj": { tier: "premium", type: "monthly", is_premium: true },
    "price_1TQBBeHPD8pnlRZIeg7YvWbb": { tier: "premium", type: "semester", is_premium: true },
    "ultimate": { tier: "pro", type: "monthly", is_premium: true },
    "premium": { tier: "premium", type: "monthly", is_premium: true },
    "starter": { tier: "starter", type: "starter", is_premium: false },
    "beast_monthly": { tier: "premium", type: "monthly", is_premium: true },
    "beast_quarterly": { tier: "premium", type: "quarterly", is_premium: true },
    "beast_yearly": { tier: "premium", type: "yearly", is_premium: true },
    "beast_annual": { tier: "premium", type: "yearly", is_premium: true },
    "wizard_monthly": { tier: "premium", type: "monthly", is_premium: true },
    "wizard_quarterly": { tier: "premium", type: "quarterly", is_premium: true },
    "wizard_annual": { tier: "premium", type: "yearly", is_premium: true },
    "monthly": { tier: "premium", type: "monthly", is_premium: true },
    "quarterly": { tier: "premium", type: "quarterly", is_premium: true },
    "annual": { tier: "premium", type: "yearly", is_premium: true },
  };

  const planInfo = planMap[tx.plan_id];
  if (!planInfo) {
    return new Response(JSON.stringify({ error: "Unrecognized plan id" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Update profile – preserve existing expiry if later
  const { data: profile, error: profErr } = await supabaseClient
    .from("profiles")
    .select("subscription_expires_at")
    .eq("id", user_id)
    .single();

  const now = new Date();
  let baseDate = now;
  if (profile && profile.subscription_expires_at) {
    const cur = new Date(profile.subscription_expires_at);
    if (cur > now) baseDate = cur;
  }

  const expiry = new Date(baseDate);
  if (planInfo.type === "yearly") expiry.setFullYear(expiry.getFullYear() + 1);
  else if (planInfo.type === "quarterly") expiry.setMonth(expiry.getMonth() + 4);
  else if (planInfo.type === "starter") expiry.setDate(expiry.getDate() + 14);
  else if (planInfo.type === "semester") expiry.setMonth(expiry.getMonth() + 4);
  else expiry.setMonth(expiry.getMonth() + 1);

  const { error: updErr } = await supabaseClient
    .from("profiles")
    .update({
      subscription_tier: planInfo.tier,
      subscription_type: planInfo.type,
      subscription_expires_at: expiry.toISOString(),
      is_premium: planInfo.is_premium,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user_id);

  if (updErr) {
    return new Response(JSON.stringify({ error: "Failed to update profile" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ success: true, message: "User marked as paid", expiry: expiry.toISOString() }), { status: 200, headers: { "Content-Type": "application/json" } });
});
