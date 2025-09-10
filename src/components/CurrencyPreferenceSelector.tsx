'use client';

import React, { useState, useEffect } from 'react';
import { getUserPreferences, saveUserPreferences, getPreferredCurrency } from '@/lib/preferences';

interface CurrencyPreferenceSelectorProps {
  className?: string;
}

const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

export default function CurrencyPreferenceSelector({ className = "" }: CurrencyPreferenceSelectorProps) {
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setPreferredCurrency(getPreferredCurrency());
  }, []);

  const handleCurrencyChange = (currency: string) => {
    setPreferredCurrency(currency);
    saveUserPreferences({ preferredCurrency: currency });
    setIsOpen(false);
  };

  const selectedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === preferredCurrency);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="text-sm font-medium">{selectedCurrency?.symbol}</span>
        <span className="text-sm text-gray-700">{selectedCurrency?.code}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="py-1">
            {SUPPORTED_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleCurrencyChange(currency.code)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${
                  preferredCurrency === currency.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
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
  );
}
