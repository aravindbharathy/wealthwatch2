"use client";

import React from 'react';
import { PortfolioValueEntry } from '@/lib/firebase/types';

interface PortfolioValueSummaryProps {
  portfolioHistory: PortfolioValueEntry[];
  loading?: boolean;
}

export default function PortfolioValueSummary({ portfolioHistory, loading = false }: PortfolioValueSummaryProps) {
  // Calculate current portfolio data
  const currentData = portfolioHistory.length > 0 ? portfolioHistory[portfolioHistory.length - 1] : null;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  if (loading) {
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

  if (!currentData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Total assets value</h2>
        <div className="flex items-center gap-6">
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(0)}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total invested: </span>
              <span className="font-medium text-gray-900">{formatCurrency(0)}</span>
            </div>
            <div>
              <span className="text-gray-500">Total return: </span>
              <span className="font-medium text-gray-900">
                {formatCurrency(0)} (0.0%)
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
          {formatCurrency(currentData.totalValue)}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total invested: </span>
            <span className="font-medium text-gray-900">{formatCurrency(currentData.totalInvested)}</span>
          </div>
          <div>
            <span className="text-gray-500">Total return: </span>
            <span className={`font-medium ${currentData.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(currentData.totalReturn)} ({formatPercent(currentData.totalReturnPercent)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
