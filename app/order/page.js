'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import RazorpayButton from '../components/RazorpayButton';

export default function Order() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // Default to COD
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState(['all']);
  
  // Check if user is logged in
  useEffect(() => {
    // Check local storage for user data
    const userData = localStorage.getItem('user_info');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
        
        // Fetch order history for logged in user
        fetchOrderHistory(parsedUser.user_name);
      } catch (e) {
        console.error("Error parsing user info:", e);
      }
    }
    
    // Also check for auth token
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
      setIsLoggedIn(true);
    }

    // Fetch products from API
    fetchProducts();

    // Check for saved cart in session storage (from previous sessions)
    const savedCart = sessionStorage.getItem('pendingCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing saved cart:", e);
      }
    }
  }, []);
  
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      console.log("Products fetched:", data);
      setProducts(data);
      
      // Extract unique categories
      const uniqueCategories = ['all'];
      data.forEach(product => {
        if (product.category && !uniqueCategories.includes(product.category)) {
          uniqueCategories.push(product.category);
        }
      });
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error("Error fetching products:", error);
      // Fallback to mock data if API fails
      const mockProducts = [
        { 
          id: '1', 
          product_name: 'Espresso', 
          price: 150, 
          description: 'Strong and rich coffee', 
          available: true,
          category: 'hot coffee',
          image: '/api/placeholder/300/200'
        },
        { 
          id: '2', 
          product_name: 'Cappuccino', 
          price: 250, 
          description: 'Espresso with steamed milk and foam',
          available: true,
          category: 'hot coffee',
          image: '/api/placeholder/300/200'
        },
        { 
          id: '3', 
          product_name: 'Latte', 
          price: 220, 
          description: 'Espresso with steamed milk',
          available: true,
          category: 'hot coffee',
          image: '/api/placeholder/300/200'
        },
        { 
          id: '4', 
          product_name: 'Americano', 
          price: 180, 
          description: 'Espresso diluted with hot water',
          available: true,
          category: 'hot coffee',
          image: '/api/placeholder/300/200'
        },
        {
          id: '5',
          product_name: 'Iced Coffee',
          price: 200,
          description: 'Chilled coffee served with ice',
          available: true,
          category: 'cold coffee',
          image: '/api/placeholder/300/200'
        },
        {
          id: '6',
          product_name: 'Chocolate Muffin',
          price: 120,
          description: 'Freshly baked chocolate muffin',
          available: true,
          category: 'pastries',
          image: '/api/placeholder/300/200'
        }
      ];
      setProducts(mockProducts);
      
      // Extract unique categories from mock data
      const uniqueCategories = ['all'];
      mockProducts.forEach(product => {
        if (product.category && !uniqueCategories.includes(product.category)) {
          uniqueCategories.push(product.category);
        }
      });
      setCategories(uniqueCategories);
    } finally {
      setProductsLoading(false);
      setIsLoading(false);
    }
  };
  
  const fetchOrderHistory = async (userName) => {
    if (!userName) return;
    
    try {
      const response = await fetch(`/api/orders?user_name=${encodeURIComponent(userName)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrderHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user_info');
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsLoggedIn(false);
    setCart([]);
    setOrderHistory([]);
  };
  
  const addToCart = (product) => {
    // Check if product already in cart, if so increment quantity
    const existingProductIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingProductIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingProductIndex].quantity += 1;
      setCart(updatedCart);
      sessionStorage.setItem('pendingCart', JSON.stringify(updatedCart));
    } else {
      // Add new product to cart with quantity 1
      const updatedCart = [...cart, {...product, quantity: 1}];
      setCart(updatedCart);
      sessionStorage.setItem('pendingCart', JSON.stringify(updatedCart));
    }
  };
  
  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    sessionStorage.setItem('pendingCart', JSON.stringify(updatedCart));
  };
  
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      // Remove item if quantity is less than 1
      removeFromCart(productId);
      return;
    }
    
    const updatedCart = cart.map(item => 
      item.id === productId ? {...item, quantity: newQuantity} : item
    );
    setCart(updatedCart);
    sessionStorage.setItem('pendingCart', JSON.stringify(updatedCart));
  };
  
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };
  
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };
  
  const redirectToLogin = () => {
    // Save current cart to session storage
    sessionStorage.setItem('pendingCart', JSON.stringify(cart));
    // Redirect to account page
    router.push('/account');
  };
  
  const placeOrder = async () => {
    if (cart.length === 0) return;
    
    // If user is not logged in, redirect to login page
    if (!isLoggedIn) {
      redirectToLogin();
      return;
    }
    
    setIsLoading(true);
    
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
      
      // Prepare order data
      const orderData = {
        user_name: userName,
        location: "Store Location", // You might want to add a location selector to the UI
        price: parseFloat(getTotalPrice()),
        payment_method: paymentMethod,
        order_items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price * item.quantity
        }))
      };
      
      // For COD, use the existing flow
      if (paymentMethod === 'cod') {
        // Send order to API
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to place order');
        }
        
        const data = await response.json();
        
        // Clear cart and session storage
        setCart([]);
        sessionStorage.removeItem('pendingCart');
        
        // Show success message
        setPaymentSuccess(true);
        
        // Refresh order history after a short delay
        setTimeout(() => {
          fetchOrderHistory(userName);
        }, 1000);
      }
      // For online payment, the Razorpay flow will be handled separately
      // by the RazorpayButton component
    } catch (error) {
      console.error('Order error:', error);
      setPaymentError(error.message || 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePaymentSuccess = (data) => {
    console.log("Payment successful:", data);
    setPaymentSuccess(true);
    setPaymentError(null);
    setCart([]);
    sessionStorage.removeItem('pendingCart');
    
    // Refresh order history
    if (user && user.user_name) {
      fetchOrderHistory(user.user_name);
    }
  };
  
  const handlePaymentError = (error) => {
    console.error("Payment failed:", error);
    setPaymentError(error.message || "Payment failed. Please try again.");
    setPaymentSuccess(false);
  };
  
  const cancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        // Refresh order history
        if (user && user.user_name) {
          fetchOrderHistory(user.user_name);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert(`Failed to cancel order: ${error.message}`);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter products by category
  const filteredProducts = categoryFilter === 'all' 
    ? products 
    : products.filter(product => product.category === categoryFilter);
  
  return (
    <>
      <Head>
        <title>Order - 1dm Coffee</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
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
            
            <div className="flex items-center space-x-2">
              {isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <span className="hidden md:inline">Welcome, {user?.user_name || user?.full_name || 'User'}</span>
                  <button 
                    onClick={handleLogout}
                    className="bg-amber-700 hover:bg-amber-800 px-3 py-1 rounded transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={redirectToLogin}
                  className="bg-amber-700 hover:bg-amber-800 px-3 py-1 rounded transition-colors"
                >
                  Login
                </button>
              )}
              
              <div className="relative ml-4">
                <div className="bg-amber-700 rounded-full p-2 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto p-4">
          <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
            <h2 className="text-2xl font-bold text-amber-800">Coffee Shop</h2>
            
            <div className="mt-4 md:mt-0 flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
              {isLoggedIn && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded transition-colors"
                >
                  {showHistory ? 'Show Menu' : 'Order History'}
                </button>
              )}
            </div>
          </div>
          
          {isLoggedIn && showHistory ? (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-amber-800 mb-4">Your Order History</h3>
              
              {orderHistory.length === 0 ? (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500 mt-4">You have not placed any orders yet.</p>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-amber-100">
                        <th className="py-2 px-4 text-left">Order ID</th>
                        <th className="py-2 px-4 text-left">Date</th>
                        <th className="py-2 px-4 text-left">Location</th>
                        <th className="py-2 px-4 text-right">Total</th>
                        <th className="py-2 px-4 text-center">Status</th>
                        <th className="py-2 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderHistory.map((order) => (
                        <tr key={order.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                          <td className="py-2 px-4">{order.id.slice(-6)}</td>
                          <td className="py-2 px-4">{formatDate(order.order_date || order.created_at)}</td>
                          <td className="py-2 px-4">{order.location || 'Unknown'}</td>
                          <td className="py-2 px-4 text-right">₹{order.price?.toFixed(2)}</td>
                          <td className="py-2 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-center">
                            {order.status === 'PENDING' && (
                              <button
                                onClick={() => cancelOrder(order.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Category Tabs */}
              <div className="mb-6 overflow-x-auto">
                <div className="flex space-x-2 pb-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setCategoryFilter(category)}
                      className={`px-4 py-2 rounded-full transition-colors ${
                        categoryFilter === category 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-white text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-2/3">
                  <h3 className="text-xl font-bold text-amber-800 mb-4">Our Coffee Selection</h3>
                  
                  {productsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">No products available in this category.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredProducts.filter(product => product.available).map(product => (
                        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                          {product.image && (
                            <div className="h-48 bg-gray-100 overflow-hidden">
                              <img 
                                src={product.image} 
                                alt={product.product_name} 
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold text-lg">{product.product_name}</h3>
                              <span className="font-bold text-amber-600">₹{product.price.toFixed(2)}</span>
                            </div>
                            
                            {product.category && (
                              <div className="mt-1">
                                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                                  {product.category}
                                </span>
                              </div>
                            )}
                            
                            <p className="text-gray-600 text-sm mt-2">{product.description}</p>
                            
                            <button 
                              onClick={() => addToCart(product)}
                              className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded transition-colors flex items-center justify-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="lg:w-1/3">
                  <div className="bg-white rounded-lg shadow-md p-4 sticky top-20">
                    <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Your Order
                    </h3>
                    
                    {paymentSuccess && (
                      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        <p className="font-bold">Payment Successful!</p>
                        <p>Your order has been placed.</p>
                      </div>
                    )}
                    
                    {paymentError && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="font-bold">Payment Error</p>
                        <p>{paymentError}</p>
                      </div>
                    )}
                    
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-gray-500 mt-4">Your cart is empty</p>
                      </div>
                    ) : (
                      <>
                        <div className="divide-y divide-amber-100">
                          {cart.map((item) => (
                            <div key={item.id} className="py-3 first:pt-0">
                              <div className="flex justify-between">
                                <span className="font-medium">{item.product_name}</span>
                                <button 
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                                  >
                                    -
                                  </button>
                                  <span>{item.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="text-amber-800">₹{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-amber-100">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Subtotal</span>
                            <span>₹{getTotalPrice()}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Delivery Fee</span>
                            <span>₹50.00</span>
                          </div>
                          <div className="flex justify-between font-bold text-amber-800 text-lg mt-2">
                            <span>Total</span>
                            <span>₹{(parseFloat(getTotalPrice()) + 50).toFixed(2)}</span>
                          </div>
                          
                          {isLoggedIn ? (
                            <div className="mt-4 space-y-3">
                              <div className="bg-amber-50 p-3 rounded-md">
                                <label className="block text-sm font-medium text-amber-800 mb-2">
                                  Payment Method
                                </label>
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <input
                                      type="radio"
                                      id="payment-cod"
                                      name="paymentMethod"
                                      value="cod"
                                      checked={paymentMethod === 'cod'}
                                      onChange={() => setPaymentMethod('cod')}
                                      className="mr-2"
                                    />
                                    <label htmlFor="payment-cod" className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      Cash on Delivery
                                    </label>
                                  </div>
                                  <div className="flex items-center">
                                    <input
                                      type="radio"
                                      id="payment-online"
                                      name="paymentMethod"
                                      value="online"
                                      checked={paymentMethod === 'online'}
                                      onChange={() => setPaymentMethod('online')}
                                      className="mr-2"
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
                              
                              {paymentMethod === 'cod' ? (
                                <button 
                                  onClick={placeOrder}
                                  disabled={isLoading}
                                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded font-medium mt-2 disabled:opacity-70 transition-colors"
                                >
                                  {isLoading ? (
                                    <span className="flex items-center justify-center">
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Processing...
                                    </span>
                                  ) : (
                                    <span className="flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Place Order (COD)
                                    </span>
                                  )}
                                </button>
                              ) : (
                                <RazorpayButton 
                                  amount={parseFloat((parseFloat(getTotalPrice()) + 50).toFixed(2))}
                                  description={`Coffee Order: ${cart.map(item => item.product_name).join(', ')}`}
                                  buttonText={
                                    <span className="flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      Pay & Place Order
                                    </span>
                                  }
                                  buttonClassName="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded font-medium mt-2 disabled:opacity-70 transition-colors"
                                  onSuccess={handlePaymentSuccess}
                                  onError={handlePaymentError}
                                  metadata={{
                                    payment_for: 'ORDER',
                                    user_name: user?.user_name,
                                    items: cart.map(item => ({ 
                                      id: item.id, 
                                      name: item.product_name, 
                                      price: item.price,
                                      quantity: item.quantity
                                    }))
                                  }}
                                />
                              )}
                            </div>
                          ) : (
                            <button 
                              onClick={redirectToLogin}
                              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded font-medium mt-4 transition-colors"
                            >
                              Login to Complete Order
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}