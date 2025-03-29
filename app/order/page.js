'use client';

import { useState, useEffect } from 'react'
import { useRouter }   from 'next/navigation'
import Head from 'next/head'

export default function Order() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [coffees, setCoffees] = useState([
    { id: 1, name: 'Espresso', price: 3.50, description: 'Strong and rich' },
    { id: 2, name: 'Cappuccino', price: 4.50, description: 'Creamy with perfect balance' },
    { id: 3, name: 'Latte', price: 4.75, description: 'Smooth and mild' },
    { id: 4, name: 'Americano', price: 3.75, description: 'Bold and robust' },
  ])
  const [cart, setCart] = useState([])
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [orderHistory, setOrderHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  
  // Check if user is logged in
  useEffect(() => {
    // Check local storage for user data
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setIsLoggedIn(true)
      
      // Fetch order history for logged in user
      fetchOrderHistory(parsedUser.id)
    }
  }, [])
  
  const fetchOrderHistory = async (userId) => {
    try {
      // In a real app, you'd include proper auth tokens
      const response = await fetch(`/api/order?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setOrderHistory(data.orders)
      }
    } catch (error) {
      console.error('Error fetching order history:', error)
    }
  }
  
  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Mock login - in a real app, this would validate against a backend
      if (loginForm.email && loginForm.password) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const mockUser = { 
          id: `user_${Date.now()}`, 
          name: loginForm.email.split('@')[0], 
          email: loginForm.email 
        }
        
        // Mock token
        const mockToken = `mock_token_${Date.now()}`
        
        // Save to local storage
        localStorage.setItem('user', JSON.stringify(mockUser))
        localStorage.setItem('token', mockToken)
        
        setUser(mockUser)
        setIsLoggedIn(true)
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setIsLoggedIn(false)
    setCart([])
    setOrderHistory([])
  }
  
  const addToCart = (coffee) => {
    setCart([...cart, coffee])
  }
  
  const removeFromCart = (index) => {
    const newCart = [...cart]
    newCart.splice(index, 1)
    setCart(newCart)
  }
  
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price, 0).toFixed(2)
  }
  
  const placeOrder = async () => {
    if (cart.length === 0) return
    
    setIsLoading(true)
    
    try {
      // Prepare order data
      const orderData = {
        userId: user.id,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price
        })),
        totalAmount: parseFloat(getTotalPrice())
      }
      
      // Send order to API
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Order placed successfully! Order ID: ${result.order.id}`)
        setCart([])
        
        // Refresh order history
        fetchOrderHistory(user.id)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to place order')
      }
    } catch (error) {
      console.error('Order error:', error)
      alert(`Failed to place order: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }
  
  const cancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    
    try {
      const response = await fetch(`/api/order?orderId=${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        alert('Order cancelled successfully')
        // Refresh order history
        fetchOrderHistory(user.id)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel order')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      alert(`Failed to cancel order: ${error.message}`)
    }
  }
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }
  
  return (
    <>
      <Head>
        <title>Order - 1dm Coffee</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-amber-50">
        {/* Header */}
        <header className="bg-amber-600 p-4 text-white">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center" onClick={() => router.push('/')} style={{cursor: 'pointer'}}>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                <span className="text-amber-600 text-lg font-bold">1dm</span>
              </div>
              <h1 className="text-xl font-bold">1dm Coffee</h1>
            </div>
            
            {isLoggedIn && (
              <div className="flex items-center space-x-4">
                <span>Welcome, {user.name}</span>
                <button 
                  onClick={handleLogout}
                  className="bg-amber-700 hover:bg-amber-800 px-3 py-1 rounded"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
        
        <main className="container mx-auto p-4">
          {!isLoggedIn ? (
            <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-amber-800 mb-4">Login to Order</h2>
              
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="block text-amber-800 mb-2" htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    className="w-full p-2 border border-amber-300 rounded"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-amber-800 mb-2" htmlFor="password">Password</label>
                  <input 
                    type="password" 
                    id="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full p-2 border border-amber-300 rounded"
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded font-bold disabled:opacity-70"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-amber-800">Coffee Shop</h2>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded"
                >
                  {showHistory ? 'Show Menu' : 'Order History'}
                </button>
              </div>
              
              {showHistory ? (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold text-amber-800 mb-4">Your Order History</h3>
                  
                  {orderHistory.length === 0 ? (
                    <p className="text-gray-500">You haven't placed any orders yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-amber-100">
                            <th className="py-2 px-4 text-left">Order ID</th>
                            <th className="py-2 px-4 text-left">Date</th>
                            <th className="py-2 px-4 text-left">Items</th>
                            <th className="py-2 px-4 text-right">Total</th>
                            <th className="py-2 px-4 text-center">Status</th>
                            <th className="py-2 px-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderHistory.map((order) => (
                            <tr key={order.id} className="border-b border-amber-100">
                              <td className="py-2 px-4">{order.id.slice(-6)}</td>
                              <td className="py-2 px-4">{formatDate(order.createdAt)}</td>
                              <td className="py-2 px-4">
                                {order.items.map(item => item.name).join(', ')}
                              </td>
                              <td className="py-2 px-4 text-right">${order.totalAmount.toFixed(2)}</td>
                              <td className="py-2 px-4 text-center">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-center">
                                {order.status === 'pending' && (
                                  <button
                                    onClick={() => cancelOrder(order.id)}
                                    className="text-red-500 hover:text-red-700"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="text-xl font-bold text-amber-800 mb-4">Our Coffee Selection</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {coffees.map((coffee) => (
                        <div key={coffee.id} className="bg-white p-4 rounded-lg shadow-md">
                          <h3 className="text-xl font-bold text-amber-700">{coffee.name}</h3>
                          <p className="text-gray-600 mb-2">{coffee.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-amber-800 font-bold">${coffee.price.toFixed(2)}</span>
                            <button 
                              onClick={() => addToCart(coffee)}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md h-fit">
                    <h3 className="text-xl font-bold text-amber-800 mb-4">Your Order</h3>
                    
                    {cart.length === 0 ? (
                      <p className="text-gray-500">Your cart is empty</p>
                    ) : (
                      <>
                        <ul className="divide-y divide-amber-100">
                          {cart.map((item, index) => (
                            <li key={index} className="py-2 flex justify-between">
                              <span>{item.name}</span>
                              <div className="flex items-center">
                                <span className="text-amber-800">${item.price.toFixed(2)}</span>
                                <button 
                                  onClick={() => removeFromCart(index)}
                                  className="ml-2 text-red-500 hover:text-red-700"
                                >
                                  ✕
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                        
                        <div className="mt-4 pt-4 border-t border-amber-100">
                          <div className="flex justify-between font-bold text-amber-800">
                            <span>Total:</span>
                            <span>${getTotalPrice()}</span>
                          </div>
                          
                          <button 
                            onClick={placeOrder}
                            disabled={isLoading}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded font-bold mt-4 disabled:opacity-70"
                          >
                            {isLoading ? 'Processing...' : 'Place Order'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  )
}