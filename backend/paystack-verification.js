/**
 * Paystack Backend Verification Examples
 * 
 * This file contains examples for:
 * 1. Transaction verification endpoint
 * 2. Webhook handler
 * 3. Payment verification utilities
 * 
 * IMPORTANT: Never trust frontend payment success alone
 * Always verify payments on your backend using Paystack's API
 */

const https = require('https');
const crypto = require('crypto');

// =================================
// CONFIGURATION
// =================================

// Get Paystack keys from environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY; // sk_test_... or sk_live_...
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET; // Optional but recommended

// =================================
// UTILITIES
// =================================

/**
 * Make HTTP request to Paystack API
 * @param {string} path - API endpoint path
 * @param {string} method - HTTP method
 * @param {Object} data - Request body (for POST requests)
 * @returns {Promise<Object>} - API response
 */
const paystackRequest = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method === 'POST') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

/**
 * Verify Paystack transaction
 * @param {string} reference - Transaction reference
 * @returns {Promise<Object>} - Transaction details
 */
const verifyTransaction = async (reference) => {
  try {
    const response = await paystackRequest(`/transaction/verify/${reference}`);
    
    if (response.status) {
      return {
        success: true,
        data: response.data,
        message: 'Transaction verified successfully',
      };
    } else {
      return {
        success: false,
        message: response.message || 'Transaction verification failed',
      };
    }
  } catch (error) {
    console.error('Paystack verification error:', error);
    return {
      success: false,
      message: `Verification failed: ${error.message}`,
    };
  }
};

/**
 * Verify webhook signature
 * @param {string} rawBody - Raw request body
 * @param {string} signature - X-Paystack-Signature header
 * @returns {boolean} - Whether signature is valid
 */
const verifyWebhookSignature = (rawBody, signature) => {
  if (!PAYSTACK_WEBHOOK_SECRET) {
    console.warn('Paystack webhook secret not configured. Skipping signature verification.');
    return true; // Allow if secret not configured (not recommended for production)
  }

  const hash = crypto
    .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  return hash === signature;
};

// =================================
// EXPRESS SERVER EXAMPLE
// =================================

/**
 * Example Express server with Paystack verification endpoints
 * 
 * To use this:
 * 1. npm install express body-parser
 * 2. Set environment variables:
 *    - PAYSTACK_SECRET_KEY=sk_test_xxx
 *    - PAYSTACK_WEBHOOK_SECRET=whsec_xxx (optional)
 * 3. node paystack-verification.js
 */

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Middleware for parsing JSON
app.use(bodyParser.json());

// Middleware for webhook verification (raw body needed)
app.use('/webhook/paystack', bodyParser.raw({ type: 'application/json' }));

/**
 * POST /api/verify-transaction
 * Verify a Paystack transaction
 */
app.post('/api/verify-transaction', async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference is required',
      });
    }

    // Verify transaction with Paystack
    const verification = await verifyTransaction(reference);

    if (!verification.success) {
      return res.status(400).json(verification);
    }

    const transaction = verification.data;

    // Additional validation
    if (transaction.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: `Transaction not successful. Status: ${transaction.status}`,
      });
    }

    // Check if transaction has already been processed
    // (In a real app, you'd check your database)
    const isAlreadyProcessed = await checkIfTransactionProcessed(reference);
    if (isAlreadyProcessed) {
      return res.status(200).json({
        success: true,
        message: 'Transaction already processed',
        data: transaction,
      });
    }

    // Update user subscription or grant access
    await processSuccessfulPayment(transaction);

    // Return success response
    res.json({
      success: true,
      message: 'Payment verified and processed successfully',
      data: transaction,
    });

  } catch (error) {
    console.error('Verification endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * POST /webhook/paystack
 * Handle Paystack webhooks
 */
app.post('/webhook/paystack', (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const rawBody = req.body.toString();

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).send('Unauthorized');
    }

    const event = JSON.parse(rawBody);
    console.log('Paystack webhook event:', event);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        handleSuccessfulCharge(event.data);
        break;
      
      case 'charge.failed':
        handleFailedCharge(event.data);
        break;
      
      case 'charge.disable':
        handleDisabledCharge(event.data);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    // Always return 200 to Paystack
    res.status(200).send('Webhook received');

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// =================================
// DATABASE OPERATIONS (Examples)
// =================================

/**
 * Check if transaction has been processed
 * @param {string} reference - Transaction reference
 * @returns {Promise<boolean>} - Whether transaction is processed
 */
async function checkIfTransactionProcessed(reference) {
  // Example: Check your database
  // const result = await db.query(
  //   'SELECT id FROM payment_transactions WHERE reference = $1',
  //   [reference]
  // );
  // return result.rows.length > 0;
  
  // For demo, return false
  return false;
}

/**
 * Process successful payment
 * @param {Object} transaction - Paystack transaction data
 */
async function processSuccessfulPayment(transaction) {
  try {
    console.log(`Processing successful payment: ${transaction.reference}`);
    
    // Example: Save transaction to database
    // await db.query(`
    //   INSERT INTO payment_transactions 
    //   (reference, amount, email, status, metadata, created_at)
    //   VALUES ($1, $2, $3, $4, $5, $6)
    // `, [
    //   transaction.reference,
    //   transaction.amount,
    //   transaction.customer.email,
    //   transaction.status,
    //   JSON.stringify(transaction.metadata),
    //   new Date()
    // ]);

    // Example: Update user subscription
    // const planId = transaction.metadata.plan_id;
    // const userId = transaction.metadata.user_id;
    
    // if (planId && userId) {
    //   await db.query(`
    //     UPDATE user_profiles 
    //     SET subscription_tier = $1, 
    //         subscription_updated_at = $2
    //     WHERE id = $3
    //   `, [planId, new Date(), userId]);
    // }

    console.log('Payment processed successfully');
    
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
}

/**
 * Handle successful charge webhook
 * @param {Object} data - Charge data
 */
function handleSuccessfulCharge(data) {
  console.log('Charge success webhook:', data);
  // Similar to processSuccessfulPayment
  // This is a backup in case the frontend verification fails
}

/**
 * Handle failed charge webhook
 * @param {Object} data - Charge data
 */
function handleFailedCharge(data) {
  console.log('Charge failed webhook:', data);
  // Update transaction status in database
  // Notify user of payment failure
}

/**
 * Handle disabled charge webhook
 * @param {Object} data - Charge data
 */
function handleDisabledCharge(data) {
  console.log('Charge disabled webhook:', data);
  // Handle recurring payment disable
}

// =================================
// START SERVER (if running this file directly)
// =================================

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  
  app.listen(PORT, () => {
    console.log(`Paystack verification server running on port ${PORT}`);
    console.log(`Webhook endpoint: http://localhost:${PORT}/webhook/paystack`);
    console.log(`Verification endpoint: http://localhost:${PORT}/api/verify-transaction`);
  });
}

// =================================
// EXPORTS
// =================================

module.exports = {
  verifyTransaction,
  verifyWebhookSignature,
  processSuccessfulPayment,
  handleSuccessfulCharge,
  handleFailedCharge,
  handleDisabledCharge,
};
