"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPreferredCurrency, setPreferredCurrency } from '@/lib/preferences';
import { convertCurrency, formatCurrency as formatCurrencyUtil, getCurrencySymbol } from '@/lib/currency';

interface CurrencyContextType {
  preferredCurrency: string;
  setPreferredCurrency: (currency: string) => Promise<void>;
  convertAmount: (amount: number, fromCurrency?: string) => Promise<number>;
  formatCurrency: (amount: number, fromCurrency?: string) => Promise<string>;
  getCurrencySymbol: (currency?: string) => string;
  isLoading: boolean;
  error: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { user } = useAuth();
  const [preferredCurrency, setPreferredCurrencyState] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's preferred currency on mount
  useEffect(() => {
    const loadPreferredCurrency = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const currency = await getPreferredCurrency(user?.uid);
        setPreferredCurrencyState(currency);
      } catch (err) {
        console.error('Error loading preferred currency:', err);
        setError('Failed to load currency preference');
        // Fallback to USD
        setPreferredCurrencyState('USD');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferredCurrency();
  }, [user?.uid]);

  // Update preferred currency
  const updatePreferredCurrency = useCallback(async (currency: string) => {
    try {
      setError(null);
      await setPreferredCurrency(currency, user?.uid);
      setPreferredCurrencyState(currency);
    } catch (err) {
      console.error('Error updating preferred currency:', err);
      setError('Failed to update currency preference');
      throw err;
    }
  }, [user?.uid]);

  // Convert amount from USD (default) to preferred currency
  const convertAmount = useCallback(async (amount: number, fromCurrency: string = 'USD'): Promise<number> => {
    if (fromCurrency === preferredCurrency) {
      return amount;
    }

    try {
      const conversion = await convertCurrency(fromCurrency, preferredCurrency, amount);
      return conversion.convertedAmount || amount;
    } catch (err) {
      console.error('Error converting currency:', err);
      // Return original amount if conversion fails
      return amount;
    }
  }, [preferredCurrency]);

  // Format currency amount in preferred currency
  const formatCurrency = useCallback(async (amount: number, fromCurrency: string = 'USD'): Promise<string> => {
    try {
      const convertedAmount = await convertAmount(amount, fromCurrency);
      return formatCurrencyUtil(convertedAmount, preferredCurrency);
    } catch (err) {
      console.error('Error formatting currency:', err);
      // Fallback to USD formatting
      return formatCurrencyUtil(amount, 'USD');
    }
  }, [convertAmount, preferredCurrency]);

  // Get currency symbol
  const getCurrencySymbolUtil = useCallback((currency?: string): string => {
    return getCurrencySymbol(currency || preferredCurrency);
  }, [preferredCurrency]);

  const value: CurrencyContextType = {
    preferredCurrency,
    setPreferredCurrency: updatePreferredCurrency,
    convertAmount,
    formatCurrency,
    getCurrencySymbol: getCurrencySymbolUtil,
    isLoading,
    error,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
