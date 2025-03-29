'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to order page after 3 seconds
    const timer = setTimeout(() => {
      router.push('/order');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-amber-600 px-4 text-white">
      <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8">
        <span className="text-amber-600 text-4xl font-bold">1dm</span>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">1dm Coffee</h1>
      <p className="text-amber-100 text-center mb-8">Your premium coffee experience</p>
      
      <div className="animate-pulse flex space-x-2">
        <div className="w-2 h-2 bg-white rounded-full"></div>
        <div className="w-2 h-2 bg-white rounded-full"></div>
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </div>
  );
}