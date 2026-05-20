import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://knnfgyedoxtywwlhazqg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubmZneWVkb3h0eXd3bGhhenFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTc0NDgsImV4cCI6MjA4OTk5MzQ0OH0.9vYZ070VLlYWIDcImJZukJWxoxMjoav1RhBW5fEfY90'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  try {
    // 1. Sign in with a test account or get a session. Let's see if we can sign in with Michael's email or create a temporary user.
    // Wait, let's see if we can sign in with a known email or just sign up a temporary user.
    const tempEmail = `test_checkout_${Date.now()}@luter.app`;
    const tempPassword = 'TemporaryPassword123!';
    
    console.log('Signing up temporary user:', tempEmail);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: tempEmail,
      password: tempPassword,
    });
    
    if (signUpError) {
      throw signUpError;
    }
    
    const session = signUpData.session;
    if (!session) {
      console.log('Sign up successful, but email confirmation might be enabled. Trying to sign in...');
      // If email confirmation is enabled, we might not get a session. Let's check if we can query profiles or if we can use an existing profile.
    }
    
    const accessToken = session?.access_token;
    console.log('Access Token obtained:', accessToken ? 'YES' : 'NO');
    
    if (!accessToken) {
      console.log('Cannot proceed without access token. Let\'s try to find an existing user or check if there is an admin profile.');
      return;
    }

    // Call create-paystack-checkout
    console.log('Calling create-paystack-checkout...');
    const response = await fetch(`${supabaseUrl}/functions/v1/create-paystack-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseKey,
      },
      body: JSON.stringify({
        planId: 'monthly',
        amount: 3000,
        email: tempEmail,
        currency: 'NGN',
        callback_url: 'http://localhost:5173/dashboard/payment/success',
      }),
    });
    
    const status = response.status;
    const text = await response.text();
    console.log('Response Status:', status);
    console.log('Response Body:', text);

    // Cleanup: delete user
    // (We don't have service_role key in this client to delete easily, but that's okay for testing)
  } catch (err) {
    console.error('Error during test:', err);
  }
}

run();
