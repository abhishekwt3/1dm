'use client';

import { useState } from 'react';

export default function RegisterForm({ onRegisterSuccess, switchView }) {
  const [registerData, setRegisterData] = useState({
    user_name: '',
    email: '',
    password: '',
    confirm_password: '',
    full_name: ''
  });
  const [registering, setRegistering] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);
  
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData({
      ...registerData,
      [name]: value
    });
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setAuthError(null);
    setAuthSuccess(null);
    
    // Basic validation
    if (registerData.password !== registerData.confirm_password) {
      setAuthError("Passwords do not match");
      setRegistering(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const data = await response.json();
      console.log("Registration successful");
      
      // Store token in localStorage for client-side checks
      localStorage.setItem('auth_token', data.token);
      
      // Store user info
      localStorage.setItem('user_info', JSON.stringify({
        id: data.user.id,
        user_name: data.user.user_name,
        full_name: data.user.full_name,
        email: data.user.email
      }));
      
      setAuthSuccess("Registration successful! Your account has been created.");
      
      // Wait briefly and then notify parent
      setTimeout(() => {
        onRegisterSuccess();
      }, 1000);
      
    } catch (error) {
      console.error("Registration error:", error);
      setAuthError(error.message || 'Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Create an Account</h2>
      
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
      
      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            name="user_name"
            value={registerData.user_name}
            onChange={handleRegisterChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="full_name"
            value={registerData.full_name}
            onChange={handleRegisterChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={registerData.email}
            onChange={handleRegisterChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={registerData.password}
            onChange={handleRegisterChange}
            className="w-full p-2 border rounded-md"
            required
            minLength="6"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            name="confirm_password"
            value={registerData.confirm_password}
            onChange={handleRegisterChange}
            className="w-full p-2 border rounded-md"
            required
            minLength="6"
          />
        </div>
        
        <button
          type="submit"
          disabled={registering}
          className={`w-full ${registering ? 'bg-amber-400' : 'bg-amber-600'} text-white py-2 rounded-md font-medium`}
        >
          {registering ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            onClick={switchView}
            className="text-amber-600 hover:underline"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}