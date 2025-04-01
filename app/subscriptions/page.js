'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EquipmentCard from '../components/EquipmentCard';
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
    paymentMethod: 'cod', // Default to COD
  });
  const [locations, setLocations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const razorpayScriptLoaded = useRef(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
      setIsAuthenticated(true);
      fetchUserSubscriptions();
    }

    // Fetch equipment
    fetch('/api/equipment')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch equipment');
        }
        return res.json();
      })
      .then(data => {
        setEquipment(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch equipment:", error);
        setLoading(false);
        
        // For development, provide mock data if API fails
        if (process.env.NODE_ENV === 'development') {
          const mockEquipment = [
            {
              id: '1',
              name: 'Espresso Machine',
              description: 'Professional-grade espresso machine for home use',
              weekly_price: 1200,
              monthly_price: 4000,
              deposit_amount: 10000,
              available: true,
              image: '/api/placeholder/400/300'
            },
            {
              id: '2',
              name: 'Coffee Grinder',
              description: 'Burr grinder for precise coffee grinding',
              weekly_price: 800,
              monthly_price: 2500,
              deposit_amount: 5000,
              available: true,
              image: '/api/placeholder/400/300'
            },
            {
              id: '3',
              name: 'Pour Over Kit',
              description: 'Complete pour over setup for manual brewing',
              weekly_price: 600,
              monthly_price: 2000,
              deposit_amount: 3000,
              available: true,
              image: '/api/placeholder/400/300'
            },
            {
              id: '4',
              name: 'French Press',
              description: 'Classic brewing method for rich coffee',
              weekly_price: 300,
              monthly_price: 1000,
              deposit_amount: 1500,
              available: true,
              image: '/api/placeholder/400/300'
            }
          ];
          setEquipment(mockEquipment);
        }
      });
    
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

  const fetchUserSubscriptions = async () => {
    try {
      // Get username
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
      
      const response = await fetch(`/api/subscriptions?user_name=${encodeURIComponent(userName)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
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
      
      // Refresh subscriptions
      fetchUserSubscriptions();
      
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

  const handleLogout = () => {
    localStorage.removeItem('user_info');
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setSubscriptions([]);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-amber-600 p-4 text-white sticky top-0 z-10 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center" onClick={() => router.push('/')} style={{cursor: 'pointer'}}>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
              <span className="text-amber-600 text-lg font-bold">1dm</span>
            </div>
            <h1 className="text-xl font-bold">1dm Coffee</h1>
          </div>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <span className="hidden md:inline">Welcome, {
                (() => {
                  try {
                    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
                    return userInfo.user_name || userInfo.full_name || 'User';
                  } catch (e) {
                    return 'User';
                  }
                })()
              }</span>
              <button 
                onClick={handleLogout}
                className="bg-amber-700 hover:bg-amber-800 px-3 py-1 rounded transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/account')}
              className="bg-amber-700 hover:bg-amber-800 px-3 py-1 rounded transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </header>
      
      <div className="container mx-auto p-4">
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
          <h2 className="text-2xl font-bold text-amber-800">Coffee Equipment Subscriptions</h2>
          
          {isAuthenticated && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="mt-4 md:mt-0 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded transition-colors"
            >
              {showHistory ? 'Browse Equipment' : 'My Subscriptions'}
            </button>
          )}
        </div>
        
        {/* Success message */}
        {submitSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-bold">Success!</p>
              <p>Your subscription has been created.</p>
            </div>
          </div>
        )}
        
        {isAuthenticated && showHistory ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-amber-800 mb-4">Your Subscriptions</h3>
            
            {subscriptions.length === 0 ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-500 mt-4">You do not have any active subscriptions.</p>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Browse Equipment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptions.map(subscription => (
                  <div key={subscription.id} className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between">
                      <div>
                        <span className="text-lg font-semibold">{subscription.equipment?.name || 'Coffee Equipment'}</span>
                        <div className="text-sm text-gray-500">{subscription.subscription_type} Subscription</div>
                      </div>
                      <span className={`px-2 py-1 h-fit rounded-full text-xs font-medium ${
                        subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        subscription.status === 'EXPIRED' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {subscription.status}
                      </span>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Start Date:</span>
                        <div>{formatDate(subscription.start_date)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">End Date:</span>
                        <div>{subscription.end_date ? formatDate(subscription.end_date) : 'Ongoing'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Pickup Location:</span>
                        <div>{subscription.pickup_location}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Payment:</span>
                        <div className="font-medium">₹{subscription.price.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 border-t pt-3 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {subscription.payment_method === 'online' ? 'Paid Online' : 'Cash on Delivery'}
                      </span>
                      <button className="text-amber-600 hover:text-amber-700 text-sm font-medium transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : equipment.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-gray-500 mt-4">No equipment available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipment.filter(e => e.available).map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {item.image && (
                    <div className="h-48 bg-gray-100 overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                    
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Weekly:</span>
                        <span className="font-semibold">₹{item.weekly_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Monthly:</span>
                        <span className="font-semibold">₹{item.monthly_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Deposit:</span>
                        <span className="font-semibold">₹{item.deposit_amount.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleEquipmentSelect(item)}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-md mt-4 font-medium transition-colors flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Subscribe
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
      
      {/* Subscription Form Modal */}
      {formOpen && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Subscribe to Equipment</h2>
              <button 
                onClick={() => setFormOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              {/* Error message */}
              {submitError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-bold">Error</p>
                    <p>{submitError}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center mb-4">
                {selectedEquipment.image ? (
                  <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden mr-3">
                    <img 
                      src={selectedEquipment.image} 
                      alt={selectedEquipment.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-amber-100 rounded flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{selectedEquipment.name}</h3>
                  <p className="text-gray-500 text-sm">{selectedEquipment.description}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Type
                  </label>
                  <select 
                    name="subscriptionType"
                    value={formData.subscriptionType}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded-md focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="WEEKLY">Weekly (₹{selectedEquipment.weekly_price.toFixed(2)})</option>
                    <option value="MONTHLY">Monthly (₹{selectedEquipment.monthly_price.toFixed(2)})</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Location
                  </label>
                  <select
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded-md focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Select location</option>
                    {locations.map(location => (
                      <option key={`pickup-${location.id}`} value={location.name}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drop-off Location
                  </label>
                  <select
                    name="dropLocation"
                    value={formData.dropLocation}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded-md focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Select location</option>
                    {locations.map(location => (
                      <option key={`drop-${location.id}`} value={location.name}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="payment-cod"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleFormChange}
                        className="mr-2 focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-300"
                      />
                      <label htmlFor="payment-cod" className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Cash on Delivery (COD)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="payment-online"
                        name="paymentMethod"
                        value="online"
                        checked={formData.paymentMethod === 'online'}
                        onChange={handleFormChange}
                        className="mr-2 focus:ring-amber-500 h-4 w-4 text-amber-600 border-gray-300"
                      />
                      <label htmlFor="payment-online" className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Pay Online (Razorpay)
                      </label>
                    </div>
                  </div>
                </div>
                
                {formData.paymentMethod === 'cod' ? (
                  <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                    <h4 className="font-medium text-amber-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Payment Information
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Payment will be collected via Cash on Delivery (COD) when the equipment is delivered.
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <h4 className="font-medium text-blue-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Online Payment
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Payment will be processed securely using Razorpay.
                    </p>
                    <div className="mt-2 flex justify-center">
                      <img 
                        src="https://razorpay.com/assets/razorpay-glyph.svg" 
                        alt="Razorpay" 
                        className="h-6"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subscription Price</span>
                  <span className="font-medium">
                    ₹{formData.subscriptionType === 'WEEKLY' 
                      ? selectedEquipment.weekly_price.toFixed(2) 
                      : selectedEquipment.monthly_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Security Deposit</span>
                  <span className="font-medium">₹{selectedEquipment.deposit_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="font-medium">₹100.00</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>₹{(
                    (formData.subscriptionType === 'WEEKLY' 
                      ? selectedEquipment.weekly_price 
                      : selectedEquipment.monthly_price) + 
                    selectedEquipment.deposit_amount + 
                    100
                  ).toFixed(2)}</span>
                </div>
              </div>
              
              <button 
                onClick={handleSubmit}
                disabled={!formData.pickupLocation || !formData.dropLocation || submitting}
                className={`w-full ${submitting ? 'bg-amber-400' : 'bg-amber-600 hover:bg-amber-700'} text-white py-3 rounded-md mt-6 font-medium disabled:opacity-50 transition-colors`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span>
                    {formData.paymentMethod === 'online' ? 'Pay & Confirm Subscription' : 'Confirm Subscription'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}