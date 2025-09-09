"use client";

import { useState } from 'react';


export default function DemoSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoSignIn = async () => {
    setIsLoading(true);
    
    try {
      localStorage.setItem('demo-user-signed-in', 'true');
      
      // Verify localStorage was set correctly
      const verifyLocalStorage = localStorage.getItem('demo-user-signed-in');
      
      if (verifyLocalStorage !== 'true') {
        console.error('localStorage verification failed');
        return;
      }
      
      // Force immediate page reload
      window.location.reload();
      
    } catch (error) {
      console.error('Error in demo sign-in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDemoSignIn}
      disabled={isLoading}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200"
    >
      {isLoading ? 'Signing in...' : 'Sign in as Demo User'}
    </button>
  );
}
