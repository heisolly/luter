import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function PaymentSuccess() {
  const query = useQuery();
  const navigate = useNavigate();
  const reference = query.get('reference');
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setMessage('Missing transaction reference.');
      return;
    }
    // Verify transaction exists and is completed
    const fetchTransaction = async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('status, gateway_response')
        .eq('reference', reference)
        .single();
      if (error) {
        setStatus('error');
        setMessage('Unable to fetch transaction. Please contact support.');
        return;
      }
      if (data.status !== 'completed') {
        setStatus('error');
        setMessage('Payment not yet confirmed. Please wait a moment and refresh.');
        return;
      }
      setStatus('success');
      setMessage('Your payment was successful! Redirecting to dashboard...');
      // Optionally refresh user profile to reflect new subscription
      setTimeout(() => navigate('/dashboard'), 3000);
    };
    fetchTransaction();
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
