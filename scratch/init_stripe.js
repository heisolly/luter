import Stripe from 'stripe';

const stripe = new Stripe('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');

async function initStripe() {
  console.log('Initializing Stripe products and prices...');

  // 1. University Pro
  const proProduct = await stripe.products.create({
    name: 'University Pro',
    description: 'Unlimited uploads, Advanced AI Notes, AI Math Expert, Priority support',
  });

  const proMonthly = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 400000, // ₦4,000 in kobo
    currency: 'ngn',
    recurring: { interval: 'month' },
    metadata: { tier: 'pro', interval: 'monthly' }
  });

  const proSemester = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 900000, // ₦9,000 in kobo
    currency: 'ngn',
    recurring: { interval: 'month', interval_count: 4 }, // Assuming a semester is 4 months
    metadata: { tier: 'pro', interval: 'semester' }
  });

  // 2. Premium
  const premiumProduct = await stripe.products.create({
    name: 'Premium',
    description: 'Everything in Pro, Image Analysis, Team collaboration, Early access',
  });

  const premiumMonthly = await stripe.prices.create({
    product: premiumProduct.id,
    unit_amount: 700000, // ₦7,000 in kobo
    currency: 'ngn',
    recurring: { interval: 'month' },
    metadata: { tier: 'premium', interval: 'monthly' }
  });

  const premiumSemester = await stripe.prices.create({
    product: premiumProduct.id,
    unit_amount: 1600000, // ₦16,000 in kobo
    currency: 'ngn',
    recurring: { interval: 'month', interval_count: 4 },
    metadata: { tier: 'premium', interval: 'semester' }
  });

  console.log('Stripe initialization complete!');
  console.log('UNIVERSITY PRO:');
  console.log(`  Monthly: ${proMonthly.id}`);
  console.log(`  Semester: ${proSemester.id}`);
  console.log('PREMIUM:');
  console.log(`  Monthly: ${premiumMonthly.id}`);
  console.log(`  Semester: ${premiumSemester.id}`);
}

initStripe().catch(console.error);
