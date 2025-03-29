'use client';

import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ProfileSection from './components/ProfileSection';
import OrdersSection from './components/OrdersSection';
import SubscriptionsSection from './components/SubscriptionsSection';
import DebugPanel from './components/DebugPanel';

export default function Account() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  
  // Tab state
  const [activeTab, setActiveTab] = useState('profile');
  
  // Data states
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbTestResults, setDbTestResults] = useState(null);
  
  // Error states
  const [error, setError] = useState(null);
  
  useEffect(() => {
    console.log("Account page loading...");
    checkAuthentication();
    
    // Run diagnostics in development mode
    if (process.env.NODE_ENV === 'development') {
      runDiagnostics();
    }
  }, []);
  
  // Diagnostic function for development
  const runDiagnostics = () => {
    fetch('/api/account-test')
      .then(res => res.json())
      .then(data => {
        console.log("Account database test results:", data);
        setDbTestResults(data);
      })
      .catch(err => {
        console.error("Account database test error:", err);
      });
  };
  
// Updated checkAuthentication function
const checkAuthentication = () => {
  const authToken = localStorage.getItem('auth_token');
  const userInfo = localStorage.getItem('user_info');
  
  if (authToken && userInfo) {
    try {
      // Parse user info to check if it's valid
      const userInfoObj = JSON.parse(userInfo);
      if (!userInfoObj.user_name) {
        throw new Error("Invalid user information");
      }
      
      setIsAuthenticated(true);
      loadUserData();
    } catch (e) {
      console.error("Error with stored authentication:", e);
      handleLogout(); // Clear invalid auth data
    }
  } else {
    // Auto-authenticate in development
    if (process.env.NODE_ENV === 'development') {
      // Set default demo user for development
      localStorage.setItem('auth_token', 'dev-token');
      localStorage.setItem('user_info', JSON.stringify({
        id: 'dev-id',
        user_name: 'current_user',
        full_name: 'Test User',
        email: 'test@example.com'
      }));
      
      setIsAuthenticated(true);
      loadUserData();
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  }
};

  // Load user data
  const loadUserData = () => {
    setLoading(true);
    
    // Try to get user data from localStorage first
    const userInfoString = localStorage.getItem('user_info');
    if (userInfoString && process.env.NODE_ENV === 'development') {
      try {
        const storedUserData = JSON.parse(userInfoString);
        setUserData(storedUserData);
        setLoading(false);
        
        // Continue to load related data
        fetchOrders();
        fetchSubscriptions();
        return;
      } catch (e) {
        console.error("Error parsing stored user data:", e);
      }
    }
    
    // Fetch user data from API
    fetchUserData();
  };
  
  // API calls
  const fetchUserData = () => {
    console.log("Fetching account data...");
    fetch('/api/account', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            setIsAuthenticated(false);
            throw new Error("Please log in to view your account");
          }
          return res.json().then(data => {
            throw new Error(data.message || 'Failed to fetch account');
          });
        }
        return res.json();
      })
      .then(data => {
        console.log("Account data fetched successfully");
        setUserData(data);
        setLoading(false);
        
        fetchOrders();
        fetchSubscriptions();
      })
      .catch(error => {
        console.error("Failed to fetch account:", error);
        setError(error.message || 'Failed to load account data');
        setLoading(false);
        
        if (process.env.NODE_ENV === 'development') {
          mockUserData();
        }
      });
  };
  
  const fetchOrders = () => {
    fetch('/api/orders', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log(`Orders fetched: ${data.length}`);
        setOrders(data);
      })
      .catch(error => {
        console.error("Failed to fetch orders:", error);
        
        if (process.env.NODE_ENV === 'development') {
          mockOrdersData();
        }
      });
  };
  
  // Updated fetchSubscriptions function
const fetchSubscriptions = () => {
  console.log("Fetching subscriptions...");
  
  let userName = "current_user";
  
  // Try to get username from localStorage
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
  
  // Fetch subscriptions with username parameter
  fetch(`/api/subscriptions?user_name=${encodeURIComponent(userName)}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  })
    .then(res => res.json())
    .then(data => {
      console.log(`Subscriptions fetched for ${userName}: ${data.length}`);
      
      // Sort subscriptions to show active ones first
      const sortedSubscriptions = data.sort((a, b) => {
        // First sort by status - active first
        if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
        if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
        
        // Then sort by date - newest first
        return new Date(b.start_date) - new Date(a.start_date);
      });
      
      setSubscriptions(sortedSubscriptions);
    })
    .catch(error => {
      console.error("Failed to fetch subscriptions:", error);
      
      // Mock data for development
      if (process.env.NODE_ENV === 'development') {
        setSubscriptions([
          {
            id: 'sub1',
            equipment: { name: 'Espresso Machine' },
            subscription_type: 'MONTHLY',
            price: 4000,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            pickup_location: 'Downtown Mumbai',
            status: 'ACTIVE'
          }
        ]);
      }
    });
};
  
  // Mock data helpers for development
  const mockUserData = () => {
    const mockAccount = {
      user_name: "current_user",
      email: "user@example.com",
      full_name: "Test User",
      phone_number: "555-123-4567",
      address: "123 Test St, Test City",
      member: true,
      profile_image: null
    };
    setUserData(mockAccount);
  };
  
  const mockOrdersData = () => {
    setOrders([
      {
        id: 'order1',
        order_date: new Date().toISOString(),
        status: 'COMPLETED',
        location: 'Downtown Mumbai',
        price: 550,
        order_items: [
          { id: 'item1', product: { product_name: 'Espresso' }, quantity: 2 }
        ]
      }
    ]);
  };
  
  const mockSubscriptionsData = () => {
    setSubscriptions([
      {
        id: 'sub1',
        equipment: { name: 'Espresso Machine' },
        subscription_type: 'MONTHLY',
        price: 4000,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        pickup_location: 'Downtown Mumbai',
        status: 'ACTIVE'
      }
    ]);
  };
  
  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    
    setIsAuthenticated(false);
    setUserData(null);
    setOrders([]);
    setSubscriptions([]);
    setAuthView('login');
  };
  
  // Authentication handlers
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    loadUserData();
  };
  
  const switchAuthView = (view) => {
    setAuthView(view);
  };
  
  // Main content renderer
  const renderContent = () => {
    // If not authenticated, show login or register form
    if (!isAuthenticated) {
      return authView === 'login' 
        ? <LoginForm onLoginSuccess={handleLoginSuccess} switchView={() => switchAuthView('register')} />
        : <RegisterForm onRegisterSuccess={handleLoginSuccess} switchView={() => switchAuthView('login')} />;
    }
    
    // If authenticated but still loading
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      );
    }
    
    // Global error message
    if (error && !userData) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <p className="mt-2">Please try refreshing the page or contact support if the problem persists.</p>
        </div>
      );
    }
    
    // Render the appropriate tab content
    switch (activeTab) {
      case 'profile':
        return <ProfileSection 
          userData={userData} 
          subscriptions={subscriptions} 
          onLogout={handleLogout}
          onUpdateSuccess={fetchUserData}
        />;
      case 'orders':
        return <OrdersSection orders={orders} />;
      case 'subscriptions':
        return <SubscriptionsSection subscriptions={subscriptions} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Account</h1>
      
      {/* Debug panel in development */}
      {process.env.NODE_ENV === 'development' && <DebugPanel data={dbTestResults} />}
      
      {/* Only show tabs if authenticated */}
      {isAuthenticated && (
        <div className="flex border-b mb-4">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium ${activeTab === 'profile' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500'}`}
          >
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-medium ${activeTab === 'orders' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 font-medium ${activeTab === 'subscriptions' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500'}`}
          >
            Subscriptions
          </button>
        </div>
      )}
      
      {renderContent()}
    </div>
  );
}