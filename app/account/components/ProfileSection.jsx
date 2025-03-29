'use client';

import { useState } from 'react';
import EditProfileForm from './EditProfileForm';
import ActiveSubscriptionCard from './ActiveSubscriptionCard';

export default function ProfileSection({ userData, subscriptions, onLogout, onUpdateSuccess }) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Get active subscriptions
  const activeSubscriptions = subscriptions.filter(
    subscription => subscription.status === 'ACTIVE'
  );
  
  const handleUpdateSuccess = () => {
    setIsEditing(false);
    if (onUpdateSuccess) onUpdateSuccess();
  };
  
  if (isEditing) {
    return <EditProfileForm 
      userData={userData} 
      onCancel={() => setIsEditing(false)} 
      onSuccess={handleUpdateSuccess} 
    />;
  }
  
  return (
    <div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {userData?.profile_image ? (
          <div className="h-32 bg-amber-600 relative">
            <div className="absolute -bottom-16 left-4 w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-200">
              <img 
                src={userData.profile_image} 
                alt={userData.full_name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="h-32 bg-amber-600 relative">
            <div className="absolute -bottom-16 left-4 w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        )}
        
        <div className="pt-20 px-4 pb-4">
          <h2 className="text-xl font-bold">{userData?.full_name || 'User'}</h2>
          <p className="text-gray-500">{userData?.user_name}</p>
          
          {userData?.member && (
            <div className="mt-2 inline-block bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
              Premium Member
            </div>
          )}
          
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 border border-amber-600 text-amber-600 py-2 rounded-md font-medium"
            >
              Edit Profile
            </button>
            
            <button
              onClick={onLogout}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Active Subscriptions Section */}
      {activeSubscriptions.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-lg mb-3">Your Active Subscriptions</h3>
          
          <div className="space-y-4">
            {activeSubscriptions.map(subscription => (
              <ActiveSubscriptionCard key={subscription.id} subscription={subscription} />
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-6 space-y-4">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div>{userData?.email || 'Not provided'}</div>
          </div>
        </div>
        
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <div>
            <div className="text-sm text-gray-500">Phone</div>
            <div>{userData?.phone_number || 'Not provided'}</div>
          </div>
        </div>
        
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <div className="text-sm text-gray-500">Address</div>
            <div>{userData?.address || 'Not provided'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}