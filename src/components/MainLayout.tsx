"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { AuthProviderNew as AuthProvider } from "../lib/contexts/AuthContext";
// import { testDemoUserSetup } from "../lib/firebase/demoUserUtils";
import { testDemoUserSetup as testDemoUser } from "../lib/firebase/demoUserTest";
import { testFirebaseConnection } from "../lib/firebase/firebaseTest";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [demoSetupComplete, setDemoSetupComplete] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Initialize demo user setup on component mount (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !demoSetupComplete) {
      // First test Firebase connection
      testFirebaseConnection()
        .then((firebaseResult) => {
          if (firebaseResult.success) {
            // If Firebase is working, test demo user setup
            return testDemoUser();
          } else {
            console.error('Firebase connection failed, skipping demo user setup');
            setDemoSetupComplete(true);
          }
        })
        .then((result) => {
          if (result) {
          }
          setDemoSetupComplete(true);
        })
        .catch((error) => {
          console.error('Demo user setup failed:', error);
          // Don't throw the error to prevent app crash
          setDemoSetupComplete(true);
        });
    }
  }, [demoSetupComplete]);

  // Skip authentication for now - show dashboard directly
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
  //         <p className="mt-4 text-gray-600">Loading Wealth Watch...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
  //         <div className="text-center mb-8">
  //           <h1 className="text-3xl font-bold text-gray-900 mb-2">Wealth Watch</h1>
  //           <p className="text-gray-600">Track your investments and manage your wealth</p>
  //         </div>
  //         <SignInWithGoogle />
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
        
        {/* Main content area */}
        <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0 lg:ml-16"}`}>
          {/* Header */}
          <Header onMenuClick={toggleSidebar} />
          
          {/* Page content */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
