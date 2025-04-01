'use client';

import { useState } from 'react';

export default function LoginForm({ onLoginSuccess, switchView }) {
  const [loginData, setLoginData] = useState({
    user_name: '',
    password: ''
  });
  const [loggingIn, setLoggingIn] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);
  
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value
    });
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setAuthError(null);
    setAuthSuccess(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      console.log("Login successful");
      
      // Store token in localStorage for client-side checks
      localStorage.setItem('auth_token', data.token);
      
      // Store user info
      localStorage.setItem('user_info', JSON.stringify({
        id: data.user.id,
        user_name: data.user.user_name,
        full_name: data.user.full_name,
        email: data.user.email
      }));
      
      setAuthSuccess("Login successful!");
      
      // Wait briefly and then notify parent
      setTimeout(() => {
        onLoginSuccess();
      }, 1000);
      
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoggingIn(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Login to Your Account</h2>
      
      {authError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{authError}</p>
        </div>
      )}
      
      {authSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{authSuccess}</p>
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            name="user_name"
            value={loginData.user_name}
            onChange={handleLoginChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={loginData.password}
            onChange={handleLoginChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loggingIn}
          className={`w-full ${loggingIn ? 'bg-amber-400' : 'bg-amber-600'} text-white py-2 rounded-md font-medium`}
        >
          {loggingIn ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={switchView}
            className="text-amber-600 hover:underline"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}