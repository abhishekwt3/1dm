'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import ProductCard from '../components/ProductCard';
import CategoryFilters from '../components/CategoryFilters';
import CartSection from '../components/CartSection';
import BottomNav from '../components/BottomNav';

export default function Order() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  
  // Check if user is logged in
  useEffect(() => {
    // Check local storage for user data
    const userData = localStorage.getItem('user_info');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
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

    // Check for saved cart in session storage
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
      setProducts(data);
      
      // Extract unique categories
      const uniqueCategories = [];
      data.forEach(product => {
        if (product.category && !uniqueCategories.includes(product.category)) {
          uniqueCategories.push(product.category);
        }
      });
      setCategories(uniqueCategories);
      
      // Set first category as default if available
      if (uniqueCategories.length > 0) {
        setCategoryFilter(uniqueCategories[0]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      // No mock data - show error or empty state
      setProducts([]);
    } finally {
      setProductsLoading(false);
      setIsLoading(false);
    }
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
        location: "Store Location", 
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
        
        // Clear cart and session storage
        setCart([]);
        sessionStorage.removeItem('pendingCart');
        
        // Show success message
        setPaymentSuccess(true);
      }
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
  };
  
  const handlePaymentError = (error) => {
    console.error("Payment failed:", error);
    setPaymentError(error.message || "Payment failed. Please try again.");
    setPaymentSuccess(false);
  };
  
  // Filter products by category
  const filteredProducts = categoryFilter === 'all' 
    ? products 
    : products.filter(product => product.category === categoryFilter);
  
  return (
    <>
      <Head>
        <title>1dm Coffee</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white p-4">
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="font-bold">1DM</span>
                </div>
              </div>
              
              {cart.length > 0 && (
                <div className="relative">
                  <button 
                    onClick={() => document.getElementById('cart-section').scrollIntoView({ behavior: 'smooth' })}
                    className="p-2 relative"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="absolute -top-1 -right-1 bg-amber-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                      {cart.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className="p-4">
          <h2 className="font-semibold mb-4 text-black">
            Hi, {isLoggedIn ? (user?.user_name || 'User') : 'User'}<br/>
            Greetings for the day
          </h2>
          
          {/* Category Filters Component */}
          {categories.length > 0 && (
            <CategoryFilters 
              categories={categories} 
              activeCategory={categoryFilter} 
              onSelectCategory={setCategoryFilter} 
            />
          )}
          
          {/* Products Grid */}
          {productsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center py-8 text-black">No products available</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.filter(product => product.available).map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={addToCart} 
                />
              ))}
            </div>
          )}
          
          {/* Cart Section Component */}
          <CartSection
            cart={cart}
            isLoggedIn={isLoggedIn}
            user={user}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            onRemoveItem={removeFromCart}
            onPlaceOrder={placeOrder}
            isLoading={isLoading}
            paymentSuccess={paymentSuccess}
            paymentError={paymentError}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            redirectToLogin={redirectToLogin}
            totalPrice={getTotalPrice()}
          />
        </div>
        
        {/* Bottom Navigation Component */}
        <BottomNav activePage="order" />
        
        {/* Extra bottom padding to account for nav */}
        <div className="pb-20"></div>
      </div>
    </>
  );
}