import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')

  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  const body = await req.text()
  let event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const relevantEvents = new Set([
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
  ])

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription
          const customerId = subscription.customer as string
          
          // Get the user from profiles by stripe_customer_id
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (profileError || !profile) {
            console.error(`Profile not found for customer ${customerId}`)
            throw new Error(`Profile not found for customer ${customerId}`)
          }

          const priceId = subscription.items.data[0].price.id
          
          // Determine tier based on priceId (should ideally come from price metadata)
          const { data: price } = await stripe.prices.retrieve(priceId)
          const tier = price.metadata.tier || 'pro'

          await supabaseAdmin.from('subscriptions').upsert({
            user_id: profile.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            tier: tier,
            status: subscription.status,
            price_id: priceId,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          break
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription
          const customerId = subscription.customer as string

          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (profile) {
            await supabaseAdmin.from('subscriptions').update({
              status: 'canceled',
              tier: 'free',
              updated_at: new Date().toISOString(),
            }).eq('user_id', profile.id)
          }
          break
        }
      }
    } catch (error) {
      console.error(`Error processing webhook event ${event.type}: ${error.message}`)
      return new Response('Webhook handler failed', { status: 500 })
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
