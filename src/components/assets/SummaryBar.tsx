"use client";

import { AssetSummary } from '@/lib/firebase/types';

interface SummaryBarProps {
  summary: AssetSummary | null;
  loading?: boolean;
}

export default function SummaryBar({ summary, loading }: SummaryBarProps) {
  // If loading and we have no summary, show loading placeholders
  if (loading && !summary) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="flex space-x-8">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  // If no summary and not loading, show no data message
  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="text-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Main Summary */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">Investments</h1>
            {loading && (
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            )}
          </div>
          <p className="text-sm text-gray-600">Total Portfolio Value</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary.totalValue)}
          </div>
          <div className={`text-sm flex items-center justify-end ${
            summary.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {summary.totalReturnPercent >= 0 ? '↗' : '↘'} {formatPercent(summary.totalReturnPercent)}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(summary.categories).map(([key, category]) => (
          <div key={key} className="text-center">
            <div className="text-sm text-gray-600 mb-1">{category.name}</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(category.value)}
            </div>
            <div className={`text-xs ${
              category.returnPercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercent(category.returnPercent)}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Invested: {formatCurrency(summary.totalInvested)}
          </div>
          <div className="text-sm text-gray-600">
            Return: {formatCurrency(summary.totalReturn)}
          </div>
          <div className={`text-sm ${
            summary.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            Today: {formatPercent(summary.dayChangePercent)}
          </div>
        </div>
      </div>
    </div>
  );
}
