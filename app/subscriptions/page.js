'use client';

import { useState, useEffect } from 'react';
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
  });
  const [locations, setLocations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
      setIsAuthenticated(true);
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
              image: null
            },
            {
              id: '2',
              name: 'Coffee Grinder',
              description: 'Burr grinder for precise coffee grinding',
              weekly_price: 800,
              monthly_price: 2500,
              deposit_amount: 5000,
              available: true,
              image: null
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
  }, []);
  
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
  
// Only the handleSubmit function is updated here
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
    price: price
    // payment_method removed since it doesn't exist in the schema
  };

  console.log("Submitting subscription with data:", subscriptionData);

  try {
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(subscriptionData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to create subscription');
    }
    
    const data = await response.json();
    setSubmitSuccess(true);
    
    // Reset after 3 seconds
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Coffee Equipment Subscriptions</h1>
      
      {/* Success message */}
      {submitSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Success!</p>
          <p>Your subscription has been created.</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : equipment.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No equipment available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {equipment.filter(e => e.available).map(item => (
            <EquipmentCard 
              key={item.id}
              equipment={item}
              onSelect={handleEquipmentSelect}
              currencySymbol="₹"
            />
          ))}
        </div>
      )}
      
      {/* Subscription Form */}
      {formOpen && selectedEquipment && (
        <div className="fixed inset-0 bg-white z-10 pt-4 px-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Subscribe to Equipment</h2>
            <button 
              onClick={() => setFormOpen(false)}
              className="text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Error message */}
          {submitError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">Error</p>
              <p>{submitError}</p>
            </div>
          )}
          
          <div className="mb-4">
            <h3 className="font-semibold text-lg">{selectedEquipment.name}</h3>
            <p className="text-gray-500 text-sm">{selectedEquipment.description}</p>
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
                className="w-full p-2 border rounded-md"
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
                className="w-full p-2 border rounded-md"
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
                className="w-full p-2 border rounded-md"
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
              <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                <h4 className="font-medium text-amber-800">Payment</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Payment will be collected via Cash on Delivery (COD) when the equipment is delivered.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between mb-2">
              <span>Subscription Price</span>
              <span>
                ₹{formData.subscriptionType === 'WEEKLY' 
                  ? selectedEquipment.weekly_price.toFixed(2) 
                  : selectedEquipment.monthly_price.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between mb-4">
              <span>Security Deposit</span>
              <span>₹{selectedEquipment.deposit_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Delivery Fee</span>
              <span>₹100.00</span>
            </div>
          </div>
          
          <button 
            onClick={handleSubmit}
            disabled={!formData.pickupLocation || !formData.dropLocation || submitting}
            className={`w-full ${submitting ? 'bg-amber-400' : 'bg-amber-600'} text-white py-3 rounded-md mt-4 font-medium disabled:opacity-50`}
          >
            {submitting ? 'Processing...' : 'Confirm Subscription'}
          </button>
        </div>
      )}
    </div>
  );
}