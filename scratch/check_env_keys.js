console.log('Environment Keys:', Object.keys(process.env).filter(key => key.includes('SUPABASE') || key.includes('PAYSTACK') || key.includes('TOKEN') || key.includes('KEY')));
