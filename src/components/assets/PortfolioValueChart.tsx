"use client";

import React, { useState, useEffect } from 'react';
import { PortfolioValueEntry } from '@/lib/firebase/types';
import { useCurrency } from '@/lib/hooks/useCurrency';

interface PortfolioValueSummaryProps {
  portfolioHistory: PortfolioValueEntry[];
  loading?: boolean;
}

export default function PortfolioValueSummary({ portfolioHistory, loading = false }: PortfolioValueSummaryProps) {
  const { formatCurrency, isLoading: currencyLoading } = useCurrency();
  const [formattedValues, setFormattedValues] = useState<{
    totalValue: string;
    totalInvested: string;
    totalReturn: string;
  } | null>(null);

  // Calculate current portfolio data
  const currentData = portfolioHistory.length > 0 ? portfolioHistory[portfolioHistory.length - 1] : null;

  // Format currency values when data or currency changes
  useEffect(() => {
    const formatValues = async () => {
      if (!currentData) return;

      try {
        const totalValue = await formatCurrency(currentData.totalValue);
        const totalInvested = await formatCurrency(currentData.totalInvested);
        const totalReturn = await formatCurrency(currentData.totalReturn);

        setFormattedValues({
          totalValue,
          totalInvested,
          totalReturn,
        });
      } catch (error) {
        console.error('Error formatting currency values:', error);
      }
    };

    formatValues();
  }, [currentData, formatCurrency]);

  // Format percentage
  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  if (loading || currencyLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="flex items-center gap-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="flex items-center gap-4">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentData || !formattedValues) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Total assets value</h2>
        <div className="flex items-center gap-6">
          <div className="text-3xl font-bold text-gray-900">
            {formattedValues?.totalValue || '$0'}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total invested: </span>
              <span className="font-medium text-gray-900">{formattedValues?.totalInvested || '$0'}</span>
            </div>
            <div>
              <span className="text-gray-500">Total return: </span>
              <span className="font-medium text-gray-900">
                {formattedValues?.totalReturn || '$0'} (0.0%)
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Total assets value</h2>
      <div className="flex items-center gap-6">
        <div className="text-3xl font-bold text-gray-900">
          {formattedValues.totalValue}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total invested: </span>
            <span className="font-medium text-gray-900">{formattedValues.totalInvested}</span>
          </div>
          <div>
            <span className="text-gray-500">Total return: </span>
            <span className={`font-medium ${currentData.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formattedValues.totalReturn} ({formatPercent(currentData.totalReturnPercent)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
