'use client';

import React, { useState, useEffect } from 'react';
import { convertCurrency } from '@/lib/currency';
import { getPreferredCurrency } from '@/lib/preferences';
import { useAuthNew } from '@/lib/contexts/AuthContext';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number, currency: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "Enter amount (e.g., USD 100, INR 100, EUR 100)",
  label,
  required = false,
  className = "",
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [detectedCurrency, setDetectedCurrency] = useState<string>('');
  const [convertedValue, setConvertedValue] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string>('');
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');
  const { user } = useAuthNew();

  // Load preferred currency on mount
  useEffect(() => {
    const loadPreferredCurrency = async () => {
      const currency = await getPreferredCurrency(user?.uid);
      setPreferredCurrency(currency);
    };
    loadPreferredCurrency();
  }, [user?.uid]);

  // Currency detection patterns - only support currency prefixes
  const currencyPatterns = [
    { pattern: /^USD\s*(\d+(?:\.\d{2})?)$/i, currency: 'USD', symbol: '$' },
    { pattern: /^INR\s*(\d+(?:\.\d{2})?)$/i, currency: 'INR', symbol: '₹' },
    { pattern: /^EUR\s*(\d+(?:\.\d{2})?)$/i, currency: 'EUR', symbol: '€' },
    { pattern: /^GBP\s*(\d+(?:\.\d{2})?)$/i, currency: 'GBP', symbol: '£' },
    { pattern: /^JPY\s*(\d+(?:\.\d{2})?)$/i, currency: 'JPY', symbol: '¥' },
    { pattern: /^CAD\s*(\d+(?:\.\d{2})?)$/i, currency: 'CAD', symbol: 'C$' },
    { pattern: /^AUD\s*(\d+(?:\.\d{2})?)$/i, currency: 'AUD', symbol: 'A$' },
    { pattern: /^CHF\s*(\d+(?:\.\d{2})?)$/i, currency: 'CHF', symbol: 'CHF' },
    { pattern: /^HKD\s*(\d+(?:\.\d{2})?)$/i, currency: 'HKD', symbol: 'HK$' },
    { pattern: /^SGD\s*(\d+(?:\.\d{2})?)$/i, currency: 'SGD', symbol: 'S$' },
  ];

  // Initialize input value from prop
  useEffect(() => {
    if (value > 0) {
      setInputValue(`${preferredCurrency} ${value}`);
      setDetectedCurrency(preferredCurrency);
      setConvertedValue(value);
    } else {
      // Show preferred currency prefix as placeholder
      setInputValue(`${preferredCurrency} `);
      setDetectedCurrency(preferredCurrency);
      setConvertedValue(0);
    }
  }, [value, preferredCurrency]);

  const detectCurrency = (input: string): { amount: number; currency: string; symbol: string } | null => {
    // First try to match currency patterns
    for (const { pattern, currency, symbol } of currencyPatterns) {
      const match = input.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        return { amount, currency, symbol };
      }
    }

    // If no currency pattern matches, try to parse as plain number
    const plainNumber = parseFloat(input);
    if (!isNaN(plainNumber)) {
      return { amount: plainNumber, currency: preferredCurrency, symbol: getCurrencySymbol(preferredCurrency) };
    }

    // If input is just a currency code, return 0 amount
    const currencyCode = input.trim().toUpperCase();
    const validCurrency = currencyPatterns.find(p => p.currency === currencyCode);
    if (validCurrency) {
      return { amount: 0, currency: validCurrency.currency, symbol: validCurrency.symbol };
    }

    return null;
  };

  const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
      USD: '$',
      INR: '₹',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'CHF',
      HKD: 'HK$',
      SGD: 'S$',
    };
    return symbols[currency] || currency;
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    setError('');

    if (!input.trim()) {
      setInputValue('');
      setDetectedCurrency('');
      setConvertedValue(0);
      onChange(0, preferredCurrency);
      return;
    }

    // Ensure proper spacing between currency and number
    const formattedInput = input.replace(/([A-Z]{3})(\d)/, '$1 $2');
    if (formattedInput !== input) {
      input = formattedInput;
      setInputValue(input);
    } else {
      setInputValue(input);
    }

    const detected = detectCurrency(input);
    if (!detected) {
      setError('Invalid currency format. Try: USD 100, INR 100, EUR 100');
      return;
    }

    setDetectedCurrency(detected.currency);

    // If the detected currency is the same as preferred, no conversion needed
    if (detected.currency === preferredCurrency) {
      setConvertedValue(detected.amount);
      onChange(detected.amount, detected.currency);
      return;
    }

    // Convert to preferred currency
    setIsConverting(true);
    try {
      const conversion = await convertCurrency(detected.currency, preferredCurrency, detected.amount);
      setConvertedValue(conversion.convertedAmount || detected.amount);
      onChange(conversion.convertedAmount || detected.amount, preferredCurrency);
    } catch (error) {
      console.error('Currency conversion failed:', error);
      setError('Currency conversion failed. Using original amount.');
      setConvertedValue(detected.amount);
      onChange(detected.amount, detected.currency);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && '*'}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
          }`}
        />
        
        {isConverting && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {detectedCurrency && detectedCurrency !== preferredCurrency && convertedValue > 0 && (
        <div className="mt-2 p-2 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-700">
            <span className="font-medium">{detectedCurrency} {inputValue.replace(/[^\d.]/g, '')}</span> = 
            <span className="font-medium"> {preferredCurrency} {convertedValue.toFixed(2)}</span>
          </p>
        </div>
      )}

      {detectedCurrency && (
        <p className="mt-1 text-xs text-gray-500">
          Detected: {detectedCurrency} | Stored as: {preferredCurrency}
        </p>
      )}
    </div>
  );
}
