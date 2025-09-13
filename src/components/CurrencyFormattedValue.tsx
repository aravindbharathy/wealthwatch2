"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '@/lib/hooks/useCurrency';

interface CurrencyFormattedValueProps {
  amount: number;
  fromCurrency?: string;
  className?: string;
  fallback?: string;
}

export default function CurrencyFormattedValue({ 
  amount, 
  fromCurrency = 'USD', 
  className = '',
  fallback 
}: CurrencyFormattedValueProps) {
  const { formatCurrency } = useCurrency();
  const [formattedValue, setFormattedValue] = useState<string>(fallback || '$0');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const formatValue = async () => {
      try {
        setIsLoading(true);
        const formatted = await formatCurrency(amount, fromCurrency);
        setFormattedValue(formatted);
      } catch (error) {
        console.error('Error formatting currency:', error);
        // Fallback to USD formatting
        setFormattedValue(new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount));
      } finally {
        setIsLoading(false);
      }
    };

    formatValue();
  }, [amount, fromCurrency, formatCurrency]);

  if (isLoading) {
    return (
      <span className={`animate-pulse bg-gray-200 rounded ${className}`}>
        {fallback || '$0'}
      </span>
    );
  }

  return <span className={className}>{formattedValue}</span>;
}
