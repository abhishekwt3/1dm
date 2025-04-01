'use client';

import { useState, useEffect, useRef } from 'react';

export default function RazorpayButton({ 
  amount, 
  currency = 'INR', 
  description = 'Purchase from 1dm Coffee', 
  name = '1dm Coffee',
  color = '#D97706', // amber-600
  onSuccess,
  onError,
  metadata = {},
  buttonText = 'Pay Now',
  buttonClassName
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const razorpayScriptLoaded = useRef(false);

  useEffect(() => {
    // Load Razorpay script
    loadRazorpayScript();
    
    // Cleanup function
    return () => {
      // Clean up if needed
    };
  }, []);

  const loadRazorpayScript = () => {
    if (typeof window === 'undefined' || razorpayScriptLoaded.current) return;
    
    razorpayScriptLoaded.current = true;
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log("Razorpay script loaded successfully");
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      setError("Failed to load payment gateway. Please try again later.");
      razorpayScriptLoaded.current = false;
    };
    
    document.body.appendChild(script);
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!razorpayLoaded) {
        // Try to load again
        loadRazorpayScript();
        throw new Error('Payment gateway not loaded. Please refresh and try again.');
      }
      
      // Get user info for prefill
      let userName = "Customer";
      let userEmail = "";
      let userPhone = "";
      
      try {
        const userInfoString = localStorage.getItem('user_info');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          if (userInfo.full_name) {
            userName = userInfo.full_name;
          } else if (userInfo.user_name) {
            userName = userInfo.user_name;
          }
          if (userInfo.email) {
            userEmail = userInfo.email;
          }
          if (userInfo.phone_number) {
            userPhone = userInfo.phone_number;
          }
        }
      } catch (e) {
        console.error("Error parsing user info:", e);
      }

      // Create Razorpay order
      const orderResponse = await fetch('/api/payments/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          amount,
          currency,
          receipt: `order_${Date.now()}`,
          payment_for: metadata.payment_for || 'PURCHASE',
          metadata
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || errorData.message || 'Failed to create payment');
      }

      const orderData = await orderResponse.json();

      // Initialize Razorpay payment
      const options = {
        key: orderData.key,
        amount: orderData.amount * 100, // in paise
        currency: orderData.currency,
        name: name,
        description: description,
        order_id: orderData.id,
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone
        },
        theme: {
          color: color
        },
        handler: function(response) {
          // Handle successful payment
          fetch('/api/payments/razorpay', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              metadata: metadata
            })
          })
          .then(res => res.json())
          .then(data => {
            if (onSuccess) {
              onSuccess(data);
            }
          })
          .catch(err => {
            console.error("Payment verification error:", err);
            if (onError) {
              onError(err);
            }
          })
          .finally(() => {
            setLoading(false);
          });
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            if (onError) {
              onError(new Error('Payment cancelled by user'));
            }
          }
        }
      };
      
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.message || 'Failed to process payment');
      setLoading(false);
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <>
      {error && (
        <div className="text-red-600 text-sm mb-2">{error}</div>
      )}
      
      <button
        onClick={handlePayment}
        disabled={loading || !razorpayLoaded}
        className={buttonClassName || `w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-md font-medium disabled:opacity-50`}
      >
        {loading ? 'Processing...' : buttonText}
      </button>
    </>
  );
}