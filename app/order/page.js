'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from '../components/ProductCard';
import OrderItem from '../components/OrderItem';
import { getCurrentUsername, getAuthHeaders } from '../utils/authHelpers';

export default function Orders() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cart, setCart] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
      setIsAuthenticated(true);
    }

    // Fetch products
    fetch('/api/products')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch products');
        }
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch products:", error);
        setLoading(false);
        
        // For development, provide mock data if API fails
        if (process.env.NODE_ENV === 'development') {
          const mockProducts = [
            {
              id: '1',
              product_name: 'Espresso',
              description: 'Strong and rich espresso',
              price: 120,
              available: true,
              image: null,
              category: 'coffee'
            },
            {
              id: '2',
              product_name: 'Cappuccino',
              description: 'Espresso with steamed milk and foam',
              price: 150,
              available: true,
              image: null,
              category: 'coffee'
            },
            {
              id: '3',
              product_name: 'Latte',
              description: 'Espresso with plenty of steamed milk',
              price: 150,
              available: true,
              image: null,
              category: 'coffee'
            },
            {
              id: '4',
              product_name: 'Americano',
              description: 'Espresso diluted with hot water',
              price: 130,
              available: true,
              image: null,
              category: 'coffee'
            }
          ];
          setProducts(mockProducts);
        }
      });

    if (isAuthenticated) {
      fetchOrderHistory();
    }
  }, [isAuthenticated]);
  
  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      const userName = getCurrentUsername();
      const response = await fetch(`/api/orders?user_name=${encodeURIComponent(userName)}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch order history');
      }
      
      const data = await response.json();
      setOrderHistory(data);
    } catch (error) {
      console.error("Failed to fetch order history:", error);
      
      // For development, provide mock data if API fails
      if (process.env.NODE_ENV === 'development') {
        setOrderHistory([
          {
            id: 'order1',
            order_date: new Date().toISOString(),
            status: 'COMPLETED',
            location: 'Downtown Mumbai',
            price: 450,
            order_items: [
              { 
                id: 'item1', 
                product: { 
                  product_name: 'Espresso' 
                }, 
                quantity: 2, 
                price: 240 
              },
              { 
                id: 'item2', 
                product: { 
                  product_name: 'Cappuccino' 
                }, 
                quantity: 1, 
                price: 150 
              }
            ]
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddToCart = (product) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      // Redirect to login page
      router.push('/account');
      return;
    }
    
    // Check if product is already in cart
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      // Update quantity
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Add new item
      setCart([...cart, {
        product_id: product.id,
        product_name: product.product_name,
        price: product.price,
        quantity: 1
      }]);
    }
  };
  
  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };
  
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => 
      item.product_id === productId 
        ? { ...item, quantity: newQuantity } 
        : item
    ));
  };
  
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    if (!locationInput) {
      setSubmitError("Please enter a delivery location");
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    const userName = getCurrentUsername();
    
    const orderData = {
      user_name: userName,
      location: locationInput,
      payment_method: paymentMethod,
      delivery_notes: deliveryNotes,
      items: cart,
      total_price: getTotalPrice()
    };
    
    console.log("Submitting order with data:", orderData);
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create order');
      }
      
      const data = await response.json();
      setSubmitSuccess(true);
      setCart([]);
      setLocationInput('');
      setDeliveryNotes('');
      
      // Refresh order history
      fetchOrderHistory();
      
      // Reset after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Order error:", error);
      setSubmitError(error.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4">Order Coffee</h1>
      
      {/* Success message */}
      {submitSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Success!</p>
          <p>Your order has been placed.</p>
        </div>
      )}
      
      {/* Error message */}
      {submitError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{submitError}</p>
        </div>
      )}
      
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded"
        >
          {showHistory ? 'View Menu' : 'Order History'}
        </button>
        
        {cart.length > 0 && !showHistory && (
          <div className="text-right">
            <span className="font-bold">Cart: </span>
            <span>{cart.length} {cart.length === 1 ? 'item' : 'items'}</span>
            <span className="ml-2 font-bold">₹{getTotalPrice().toFixed(2)}</span>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : showHistory ? (
        /* Order History View */
        <div>
          <h2 className="text-xl font-bold mb-4">Your Order History</h2>
          
          {orderHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>You do not have any orders yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orderHistory.map(order => (
                <div key={order.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-gray-500">Order #{order.id.slice(-6)}</div>
                      <div className="font-medium mt-1">{new Date(order.order_date).toLocaleDateString()}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-100 mt-3 pt-3">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="font-medium">{order.location}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Items:</span>
                        <span className="font-medium">
                          {order.order_items.map(item => 
                            `${item.product.product_name} (${item.quantity})`
                          ).join(', ')}
                        </span>
                      </div>
                      {order.payment_method && (
                        <div className="flex justify-between mt-1">
                          <span>Payment Method:</span>
                          <span className="font-medium">
                            {order.payment_method === 'cod' ? 'Cash on Delivery' : 
                             order.payment_method === 'online' ? 'Online Payment' : 
                             order.payment_method === 'wallet' ? '1dm Wallet' : 
                             order.payment_method}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between mt-1">
                        <span>Total:</span>
                        <span className="font-medium">₹{order.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Menu and Cart View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Products List */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold mb-4">Menu</h2>
            
            {products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No products available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.filter(p => p.available).map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={() => handleAddToCart(product)} 
                    currencySymbol="₹" 
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Cart */}
          <div>
            <div className="bg-white rounded-lg shadow p-4 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Your Cart</h2>
              
              {cart.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div>
                  <div className="overflow-y-auto max-h-64 mb-4">
                    {cart.map(item => (
                      <div key={item.product_id} className="flex justify-between items-center pb-2 mb-2 border-b border-gray-100">
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-gray-500 text-sm">₹{item.price.toFixed(2)}</div>
                        </div>
                        
                        <div className="flex items-center">
                          <button 
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                            className="text-amber-600 w-6 h-6 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="px-2">{item.quantity}</span>
                          <button 
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                            className="text-amber-600 w-6 h-6 flex items-center justify-center"
                          >
                            +
                          </button>
                          
                          <button 
                            onClick={() => handleRemoveFromCart(item.product_id)}
                            className="ml-2 text-red-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mb-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Location*
                      </label>
                      <input 
                        type="text" 
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        placeholder="Enter your delivery address"
                        className="w-full p-2 border rounded-md"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Notes
                      </label>
                      <textarea 
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Any special instructions?"
                        className="w-full p-2 border rounded-md h-20"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="cod">Cash on Delivery</option>
                        <option value="online">Online Payment</option>
                        <option value="wallet">1dm Wallet</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal</span>
                      <span>₹{getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Delivery Fee</span>
                      <span>₹50.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{(getTotalPrice() + 50).toFixed(2)}</span>
                    </div>
                    
                    <button 
                      onClick={handleSubmitOrder}
                      disabled={cart.length === 0 || !locationInput || submitting}
                      className={`w-full ${submitting ? 'bg-amber-400' : 'bg-amber-600'} text-white py-3 rounded-md mt-4 font-medium disabled:opacity-50`}
                    >
                      {submitting ? 'Processing...' : 'Place Order'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}