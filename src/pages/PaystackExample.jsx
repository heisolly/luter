import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaystackButton from '../components/PaystackButton';

/**
 * Example page demonstrating PaystackButton usage
 * 
 * This page shows various ways to use the PaystackButton component:
 * - Basic usage
 * - With custom metadata
 * - With custom styling
 * - Error handling
 * - Success/cancel callbacks
 */
const PaystackExample = () => {
  const navigate = useNavigate();
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState(null);

  // Example user data (in real app, this would come from auth context)
  const user = {
    email: 'test@example.com',
    name: 'Test User',
  };

  // Payment plans for demonstration
  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 1000, // ₦1,000
      description: 'Perfect for getting started',
      features: ['5 uploads per month', 'Basic support'],
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 4000, // ₦4,000
      description: 'Most popular choice',
      features: ['Unlimited uploads', 'Priority support', 'Advanced features'],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: 10000, // ₦10,000
      description: 'For large teams',
      features: ['Everything in Pro', 'Custom integrations', 'Dedicated support'],
    },
  ];

  // Handle successful payment
  const handlePaymentSuccess = (transaction) => {
    console.log('Payment successful!', transaction);
    setPaymentResult({
      status: 'success',
      transaction,
      message: `Payment of ₦${transaction.amount / 100} was successful!`,
    });
    setError(null);

    // In a real app, you would:
    // 1. Verify the payment on your backend
    // 2. Update the user's subscription
    // 3. Redirect to a success page
    setTimeout(() => {
      navigate('/dashboard/payment/success?reference=' + transaction.reference);
    }, 2000);
  };

  // Handle payment cancellation
  const handlePaymentCancel = () => {
    console.log('Payment cancelled');
    setPaymentResult({
      status: 'cancelled',
      message: 'Payment was cancelled. You can try again anytime.',
    });
    setError(null);
  };

  // Handle payment errors
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setError({
      message: error.message || 'Payment failed. Please try again.',
    });
    setPaymentResult(null);
  };

  // Clear messages
  const clearMessages = () => {
    setPaymentResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Paystack Integration Example
          </h1>
          <p className="text-lg text-gray-600">
            Demonstrating the PaystackButton component with various use cases
          </p>
        </div>

        {/* Messages */}
        {(paymentResult || error) && (
          <div className="mb-8">
            {paymentResult && (
              <div
                className={`p-4 rounded-lg ${
                  paymentResult.status === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {paymentResult.status === 'success' ? (
                      <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {paymentResult.message}
                    </p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={clearMessages}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {error.message}
                    </p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={clearMessages}
                      className="text-red-400 hover:text-red-500"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${
                plan.popular
                  ? 'ring-2 ring-green-500 ring-offset-2'
                  : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <p className="text-3xl font-bold text-gray-900 mb-6">
                  ₦{plan.price.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500">/month</span>
                </p>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <svg
                        className="h-4 w-4 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <PaystackButton
                  email={user.email}
                  amount={plan.price}
                  metadata={{
                    plan_id: plan.id,
                    plan_name: plan.name,
                    user_id: 'user_123', // In real app, get from auth
                    billing_period: 'monthly',
                  }}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                  onError={handlePaymentError}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  Choose {plan.name}
                </PaystackButton>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Usage Examples */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Custom Usage Examples
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Usage */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Usage
              </h3>
              <PaystackButton
                email={user.email}
                amount={500}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                onError={handlePaymentError}
              >
                Pay ₦500
              </PaystackButton>
            </div>

            {/* Custom Styling */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Custom Styling
              </h3>
              <PaystackButton
                email={user.email}
                amount={1000}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                onError={handlePaymentError}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full"
              >
                Custom Styled Button
              </PaystackButton>
            </div>

            {/* With Custom Metadata */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                With Custom Metadata
              </h3>
              <PaystackButton
                email={user.email}
                amount={2000}
                metadata={{
                  product_id: 'prod_123',
                  category: 'digital_goods',
                  discount_code: 'SAVE10',
                }}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                onError={handlePaymentError}
              >
                Pay with Metadata
              </PaystackButton>
            </div>

            {/* Disabled State */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Disabled State
              </h3>
              <PaystackButton
                email={user.email}
                amount={3000}
                disabled={true}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                onError={handlePaymentError}
              >
                Disabled Button
              </PaystackButton>
            </div>
          </div>
        </div>

        {/* Debug Information */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Debug Information
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>User Email:</strong> {user.email}</p>
            <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
            <p><strong>Paystack Key:</strong> {import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ? 'Configured ✓' : 'Not configured ✗'}</p>
            <p><strong>Current Time:</strong> {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaystackExample;
