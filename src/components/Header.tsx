"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getPreferredCurrency, setPreferredCurrency } from "@/lib/preferences";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, isDemoUser, signOut } = useAuth();
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [isUpdating, setIsUpdating] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
    { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar" }
  ];

  // Load preferred currency on mount
  useEffect(() => {
    const loadPreferredCurrency = async () => {
      const currency = await getPreferredCurrency(user?.uid);
      setSelectedCurrency(currency);
    };
    loadPreferredCurrency();
  }, [user?.uid]);

  // Close currency dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCurrencyChange = async (currency: string) => {
    setIsUpdating(true);
    try {
      await setPreferredCurrency(currency, user?.uid);
      setSelectedCurrency(currency);
      setIsCurrencyOpen(false);
      
      // Trigger a page refresh to update all currency displays
      window.location.reload();
    } catch (error) {
      console.error('Error updating currency preference:', error);
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu button and Trial notice */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Right side - Actions and user */}
        <div className="flex items-center space-x-4">
          {/* Currency Selector */}
          <div className="relative" ref={currencyRef}>
            <button
              onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
              disabled={isUpdating}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-medium">
                {currencies.find(c => c.code === selectedCurrency)?.symbol || '$'}
              </span>
              <span className="text-sm text-gray-700">
                {selectedCurrency}
              </span>
              {isUpdating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              ) : (
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {isCurrencyOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                <div className="py-1">
                  {currencies.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() => handleCurrencyChange(currency.code)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${
                        selectedCurrency === currency.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{currency.symbol}</span>
                      <span>{currency.code}</span>
                      <span className="text-gray-500 text-xs">{currency.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action icons */}
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
            
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
            </button>
          </div>


          {/* User profile */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <span className="text-sm font-medium text-gray-700">
                  {user.displayName || user.email}
                  {isDemoUser && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Demo
                    </span>
                  )}
                </span>
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <span className="text-sm text-gray-500">Not signed in</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
