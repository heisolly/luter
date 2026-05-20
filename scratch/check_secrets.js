import fetch from 'node-fetch'; // Wait, does the project support node-fetch or native fetch? Node 18+ has native fetch. Let's write standard JS using global fetch.
async function check() {
  try {
    const res = await fetch('https://knnfgyedoxtywwlhazqg.supabase.co/functions/v1/test-secrets', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubmZneWVkb3h0eXd3bGhhenFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTc0NDgsImV4cCI6MjA4OTk5MzQ0OH0.9vYZ070VLlYWIDcImJZukJWxoxMjoav1RhBW5fEfY90'
      }
    });
    const data = await res.json();
    console.log('Secrets Status:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}
check();
