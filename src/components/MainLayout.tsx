"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { AuthProviderNew } from "@/lib/contexts/AuthContext";
import { CurrencyProvider } from "@/lib/contexts/CurrencyContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AuthProviderNew>
      <CurrencyProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
          
          {/* Main Content Area */}
          <div className={`transition-all duration-300 ${
            sidebarOpen ? "lg:ml-64" : "lg:ml-16"
          }`}>
            {/* Header */}
            <Header onMenuClick={toggleSidebar} />
            
            {/* Container with max-width and centering */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </div>
        </div>
      </CurrencyProvider>
    </AuthProviderNew>
  );
}
