import { useCurrency as useCurrencyContext } from '@/lib/contexts/CurrencyContext';
import { useState, useCallback } from 'react';

export function useCurrency() {
  const currencyContext = useCurrencyContext();
  const [converting, setConverting] = useState(false);

  // Convert and format currency with loading state
  const convertAndFormat = useCallback(async (amount: number, fromCurrency: string = 'USD') => {
    setConverting(true);
    try {
      const formatted = await currencyContext.formatCurrency(amount, fromCurrency);
      return formatted;
    } finally {
      setConverting(false);
    }
  }, [currencyContext]);

  // Convert amount without formatting
  const convertAmount = useCallback(async (amount: number, fromCurrency: string = 'USD') => {
    setConverting(true);
    try {
      const converted = await currencyContext.convertAmount(amount, fromCurrency);
      return converted;
    } finally {
      setConverting(false);
    }
  }, [currencyContext]);

  return {
    ...currencyContext,
    convertAndFormat,
    convertAmount,
    isConverting: converting,
  };
}
