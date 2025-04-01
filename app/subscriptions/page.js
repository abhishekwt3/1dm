'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EquipmentCard from '../components/EquipmentCard';
import SubscriptionForm from '../components/SubscriptionForm';
import BottomNav from '../components/BottomNav';
import locationsData from '../../public/data/locations.json';

export default function Subscriptions() {
  const router = useRouter();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    subscriptionType: 'WEEKLY',
    pickupLocation: '',
    dropLocation: '',
    paymentMethod: 'cod',
  });
  const [locations, setLocations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const razorpayScriptLoaded = useRef(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
      setIsAuthenticated(true);
      
      try {
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        setUser(userInfo);
      } catch (e) {
        console.error("Error parsing user info:", e);
      }
    }

    // Fetch equipment
    fetchEquipment();
    
    // Use locations from JSON file
    setLocations(locationsData.locations);
    if (locationsData.locations.length > 0) {
      setFormData(prev => ({
        ...prev,
        pickupLocation: locationsData.locations[0].name,
        dropLocation: locationsData.locations[0].name
      }));
    }

    // Load Razorpay script directly
    loadRazorpayScript();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment');
      
      if (!response.ok) {
        throw new Error('Failed to fetch equipment');
      }
      
      const data = await response.json();
      setEquipment(data);
    } catch (error) {
      console.error("Failed to fetch equipment:", error);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to load Razorpay script
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
      razorpayScriptLoaded.current = false;
    };
    
    document.body.appendChild(script);
  };
  
  const handleEquipmentSelect = (equipment) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      // Save equipment selection in session storage
      sessionStorage.setItem('pendingSubscription', JSON.stringify({
        equipmentId: equipment.id
      }));
      
      // Redirect to login page
      router.push('/account');
      return;
    }
    
    setSelectedEquipment(equipment);
    setFormOpen(true);
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const createRazorpayOrder = async (subscriptionData) => {
    try {
      const price = formData.subscriptionType === 'WEEKLY' 
        ? selectedEquipment.weekly_price 
        : selectedEquipment.monthly_price;
      
      const response = await fetch('/api/payments/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          amount: price,
          currency: 'INR',
          receipt: `subscription_${Date.now()}`,
          payment_for: 'SUBSCRIPTION',
          metadata: {
            user_name: subscriptionData.user_name,
            equipment_id: subscriptionData.equipment_id,
            equipment_name: selectedEquipment.name,
            subscription_type: subscriptionData.subscription_type,
            subscription_id: subscriptionData.id
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to create payment order');
      }
      
      return await response.json();
    } catch (error) {
      console.error("Payment order error:", error);
      throw error;
    }
  };
  
  const handleRazorpayPayment = async (orderData, subscriptionData) => {
    // First check if Razorpay is loaded
    if (typeof window === 'undefined' || !window.Razorpay) {
      // Try to reload script if it's not available
      loadRazorpayScript();
      throw new Error('Payment gateway not loaded. Please try again.');
    }
    
    // Get user info from localStorage
    let userName = "current_user";
    let userEmail = "user@example.com";
    let userPhone = "";
    
    try {
      const userInfoString = localStorage.getItem('user_info');
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo.user_name) {
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
    
    return new Promise((resolve, reject) => {
      const options = {
        key: orderData.key,
        amount: orderData.amount * 100, // back to paise
        currency: orderData.currency,
        name: "1dm Coffee",
        description: `${formData.subscriptionType} Subscription for ${selectedEquipment.name}`,
        order_id: orderData.id,
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone
        },
        theme: {
          color: "#D97706" // amber-600
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
              metadata: {
                subscription_id: subscriptionData.id
              }
            })
          })
          .then(res => res.json())
          .then(data => {
            resolve(data);
          })
          .catch(err => {
            reject(err);
          });
        },
        modal: {
          ondismiss: function() {
            reject(new Error('Payment cancelled by user'));
          }
        }
      };
      
      try {
        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
      } catch (err) {
        console.error("Razorpay initialization error:", err);
        reject(new Error('Failed to initialize payment. Please try again.'));
      }
    });
  };
  
  const handleSubmit = async () => {
    if (!selectedEquipment) return;
    
    setSubmitting(true);
    setSubmitError(null);
    
    // Get user info from localStorage
    let userName = "current_user"; // Default fallback
    
    try {
      const userInfoString = localStorage.getItem('user_info');
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo.user_name) {
          userName = userInfo.user_name;
        }
      }
    } catch (e) {
      console.error("Error parsing user info:", e);
    }
    
    const price = formData.subscriptionType === 'WEEKLY' 
      ? selectedEquipment.weekly_price 
      : selectedEquipment.monthly_price;
    
    const subscriptionData = {
      user_name: userName,
      equipment_id: selectedEquipment.id,
      subscription_type: formData.subscriptionType,
      pickup_location: formData.pickupLocation,
      drop_location: formData.dropLocation,
      deposit: selectedEquipment.deposit_amount,
      price: price,
      payment_method: formData.paymentMethod
    };

    console.log("Submitting subscription with data:", subscriptionData);

    try {
      // First create subscription (for both payment methods)
      const subscriptionResponse = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(subscriptionData)
      });
      
      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create subscription');
      }
      
      const subscriptionResult = await subscriptionResponse.json();
      
      // If online payment is selected, proceed with payment flow
      if (formData.paymentMethod === 'online') {
        if (!razorpayLoaded) {
          loadRazorpayScript();
          throw new Error('Payment gateway not loaded. Please refresh the page and try again.');
        }
        
        // Create Razorpay order
        const orderData = await createRazorpayOrder({
          ...subscriptionData,
          id: subscriptionResult.id
        });
        
        // Initialize Razorpay payment
        await handleRazorpayPayment(orderData, {
          ...subscriptionData,
          id: subscriptionResult.id
        });
      }
      
      // Payment succeeded or was COD
      setSubmitSuccess(true);
      
      // Reset after success
      setTimeout(() => {
        setSubmitSuccess(false);
        setFormOpen(false);
        setSelectedEquipment(null);
      }, 3000);
    } catch (error) {
      console.error("Subscription error:", error);
      setSubmitError(error.message || 'Failed to create subscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white p-4">
        <div className="container mx-auto">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="font-bold">1DM</span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="p-4">
        <h2 className="font-semibold mb-4 text-black">
          Hi, {isAuthenticated ? (user?.user_name || 'User') : 'User'}<br/>
          Greetings for the day
        </h2>
        
        <p className="text-base font-bold mb-2 text-black">Categories</p>
        <div className="flex space-x-4 mb-4 overflow-x-auto">
          <button className="bg-amber-600 text-white px-4 py-1 rounded-md whitespace-nowrap">
            All Equipment
          </button>
          <button className="bg-gray-200 text-black px-4 py-1 rounded-md whitespace-nowrap">
            Coffee Machines
          </button>
          <button className="bg-gray-200 text-black px-4 py-1 rounded-md whitespace-nowrap">
            Grinders
          </button>
        </div>
        
        {/* Success message */}
        {submitSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-4 text-sm">
            <p className="font-bold">Success!</p>
            <p>Your subscription has been created.</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : equipment.length === 0 ? (
          <p className="text-center py-8 text-black">No equipment available</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {equipment.filter(e => e.available).map(item => (
              <EquipmentCard 
                key={item.id} 
                equipment={item} 
                onSelect={handleEquipmentSelect} 
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Subscription Form */}
      {formOpen && selectedEquipment && (
        <SubscriptionForm
          equipment={selectedEquipment}
          onClose={() => setFormOpen(false)}
          formData={formData}
          handleFormChange={handleFormChange}
          handleSubmit={handleSubmit}
          locations={locations}
          submitError={submitError}
          submitting={submitting}
        />
      )}
      
      {/* Bottom Navigation */}
      <BottomNav activePage="subscriptions" />
      
      {/* Extra bottom padding to account for nav */}
      <div className="pb-20"></div>
    </div>
  );
}