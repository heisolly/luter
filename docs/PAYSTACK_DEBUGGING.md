# Paystack Integration Debugging Guide

This guide helps you troubleshoot common Paystack integration issues and ensure a smooth payment experience.

## Table of Contents
- [Common 400 Bad Request Errors](#common-400-bad-request-errors)
- [Environment Variable Issues](#environment-variable-issues)
- [Test vs Live Mode](#test-vs-live-mode)
- [Debugging Steps](#debugging-steps)
- [Production Checklist](#production-checklist)

## Common 400 Bad Request Errors

### 1. Missing or Invalid Email
```javascript
// ❌ WRONG
email: undefined
email: ""
email: "invalid-email"
email: "user@"  // Missing domain

// ✅ CORRECT
email: "user@example.com"
email: "test+1@domain.co.uk"
```

**Fix:** Always validate email format before sending to Paystack.

### 2. Wrong Amount Type
```javascript
// ❌ WRONG
amount: "5000"        // String
amount: undefined     // Undefined
amount: 0             // Zero amount
amount: -1000         // Negative

// ✅ CORRECT
amount: 5000          // Number in kobo (₦50)
amount: 500000        // Number in kobo (₦5,000)
```

**Fix:** Ensure amount is always a positive number in kobo.

### 3. Invalid Public Key
```javascript
// ❌ WRONG
key: "sk_test_xxx"    // Secret key (NEVER in frontend)
key: "pk_live_xxx"    // Live key in test mode
key: undefined        // Missing
key: "invalid_key"    // Wrong format

// ✅ CORRECT
key: "pk_test_xxx"    // Test public key
key: "pk_live_xxx"    // Live public key (production only)
```

**Fix:** Use correct public key format and never expose secret keys.

### 4. Undefined Environment Variable
```javascript
// ❌ WRONG
const key = process.env.PAYSTACK_PUBLIC_KEY;  // Won't work in Vite

// ✅ CORRECT
const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;  // Vite syntax
```

**Fix:** Vite requires `VITE_` prefix and `import.meta.env` syntax.

## Environment Variable Issues

### Vite Configuration
```bash
# .env file
VITE_PAYSTACK_PUBLIC_KEY=pk_test_c8a8722dd6de03d5422679e52f747a54b4b0be9b
```

### Common Mistakes
1. **Missing VITE_ prefix**
   ```bash
   # ❌ WRONG
   PAYSTACK_PUBLIC_KEY=pk_test_xxx
   
   # ✅ CORRECT
   VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxx
   ```

2. **Wrong access method**
   ```javascript
   // ❌ WRONG
   const key = process.env.VITE_PAYSTACK_PUBLIC_KEY;
   
   // ✅ CORRECT
   const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
   ```

3. **Not restarting dev server**
   - Always restart `npm run dev` after changing .env

## Test vs Live Mode

### Test Mode (Development)
```bash
# .env
VITE_PAYSTACK_PUBLIC_KEY=pk_test_c8a8722dd6de03d5422679e52f747a54b4b0be9b
```

**Test Card Details:**
- Card Number: `4084084084084084081`
- CVV: `000`
- Expiry: `12/25`
- PIN: `1234`
- OTP: `123456`

### Live Mode (Production)
```bash
# .env
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:**
- Never use test keys in production
- Always test with real cards in live mode
- Ensure webhook endpoints are accessible

## Debugging Steps

### Step 1: Check Console Logs
```javascript
// Add this to your PaystackButton component
console.log('Paystack Debug:', {
  email: email,
  amount: amount,
  amountInKobo: amount * 100,
  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY?.substring(0, 10) + '...',
  publicKeyExists: !!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
});
```

### Step 2: Verify Network Request
1. Open DevTools → Network tab
2. Click "Pay Now"
3. Look for `checkout.paystack.co` requests
4. Check the request payload:
   ```json
   {
     "key": "pk_test_xxx",
     "email": "user@example.com",
     "amount": 500000,
     "currency": "NGN"
   }
   ```

### Step 3: Check Error Response
If you get 400 error, check the response body:
```json
{
  "message": "Invalid email address",
  "status": false
}
```

### Step 4: Verify Paystack Dashboard
1. Login to [Paystack Dashboard](https://dashboard.paystack.co)
2. Check Settings → API Keys
3. Ensure your public key is active
4. For live mode, check account verification status

## Production Checklist

### Before Going Live
- [ ] Switch to live public key
- [ ] Update webhook URLs to production endpoints
- [ ] Test with real payment cards
- [ ] Ensure SSL certificate is valid
- [ ] Set up proper error monitoring
- [ ] Test payment failure scenarios

### Security Checklist
- [ ] Never expose secret keys in frontend
- [ ] Verify webhook signatures
- [ ] Implement server-side payment verification
- [ ] Use HTTPS everywhere
- [ ] Set up proper CORS policies
- [ ] Monitor for suspicious transactions

### Monitoring Setup
```javascript
// Add payment tracking
const trackPaymentEvent = (eventName, data) => {
  // Send to your analytics service
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, {
      event_category: 'payment',
      value: data.amount,
      transaction_id: data.reference,
    });
  }
};

// Usage in PaystackButton
onSuccess: (transaction) => {
  trackPaymentEvent('payment_success', transaction);
  // ... rest of success handler
}
```

## Common Error Messages and Solutions

### "Paystack public key not configured"
**Cause:** `VITE_PAYSTACK_PUBLIC_KEY` not set in .env
**Solution:** Add the key to your .env file and restart dev server

### "Invalid email format"
**Cause:** Email doesn't pass basic validation
**Solution:** Ensure email includes '@' and domain

### "Payment initialization failed"
**Cause:** Network error or invalid parameters
**Solution:** Check console logs and network tab for details

### "Popup failed to open"
**Cause:** Popup blocked by browser
**Solution:** Ensure user interaction triggers the payment (not automated)

## Testing Checklist

### Manual Testing
- [ ] Test with valid email and amount
- [ ] Test with invalid email
- [ ] Test with zero amount
- [ ] Test popup cancellation
- [ ] Test successful payment flow
- [ ] Test payment success callback
- [ ] Test payment cancel callback

### Automated Testing
```javascript
// Example test case
describe('PaystackButton', () => {
  it('should validate email format', () => {
    const invalidEmails = ['', 'invalid', 'test@', '@test.com'];
    invalidEmails.forEach(email => {
      expect(() => validateEmail(email)).toThrow();
    });
  });
  
  it('should convert amount to kobo', () => {
    expect(convertToKobo(5000)).toBe(500000);
    expect(convertToKobo(0)).toBe(0);
  });
});
```

## Getting Help

If you're still stuck:

1. **Check Paystack Status:** [status.paystack.co](https://status.paystack.co)
2. **Paystack Documentation:** [developers.paystack.co](https://developers.paystack.co)
3. **Community Forum:** [community.paystack.co](https://community.paystack.co)
4. **Email Support:** support@paystack.co

## Quick Fix Script

Add this to your browser console to quickly test Paystack setup:

```javascript
// Quick Paystack test
const testPaystack = () => {
  const key = import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY;
  console.log('Public Key:', key ? key.substring(0, 10) + '...' : 'NOT FOUND');
  
  if (key && window.PaystackPop) {
    const popup = new window.PaystackPop();
    console.log('PaystackPop available ✓');
  } else {
    console.error('Paystack not properly loaded');
  }
};

testPaystack();
```

Run this in your browser console to verify the setup quickly.
