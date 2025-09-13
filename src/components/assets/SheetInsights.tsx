"use client";

import { useState, useEffect } from 'react';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { Asset } from '@/lib/firebase/types';

interface SheetInsightsProps {
  currentSheetAssets: Asset[];
  loading?: boolean;
  sheetName?: string;
}

interface SheetMetrics {
  totalInvested: number;
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export default function SheetInsights({ currentSheetAssets, loading, sheetName }: SheetInsightsProps) {
  const { formatCurrency, preferredCurrency } = useCurrency();
  const [formattedMetrics, setFormattedMetrics] = useState<{
    totalInvested: string;
    totalValue: string;
    totalReturn: string;
    totalReturnPercent: string;
  } | null>(null);

  // Calculate sheet metrics from assets
  const calculateSheetMetrics = (): SheetMetrics => {
    const totalInvested = currentSheetAssets.reduce((sum, asset) => sum + (asset.costBasis || 0), 0);
    const totalValue = currentSheetAssets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
    const totalReturn = totalValue - totalInvested;
    const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;


    return {
      totalInvested,
      totalValue,
      totalReturn,
      totalReturnPercent,
    };
  };


  // Format metrics when assets or currency changes
  useEffect(() => {
    const formatMetrics = async () => {
      const metrics = calculateSheetMetrics();
      
      const [formattedInvested, formattedValue, formattedReturn] = await Promise.all([
        formatCurrency(metrics.totalInvested),
        formatCurrency(metrics.totalValue),
        formatCurrency(metrics.totalReturn),
      ]);

      setFormattedMetrics({
        totalInvested: formattedInvested,
        totalValue: formattedValue,
        totalReturn: formattedReturn,
        totalReturnPercent: `${metrics.totalReturnPercent >= 0 ? '+' : ''}${metrics.totalReturnPercent.toFixed(2)}%`,
      });
    };

    if (currentSheetAssets.length > 0) {
      formatMetrics();
    }
  }, [currentSheetAssets, formatCurrency]);


  const formatPercent = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getChangeColor = (value: number): string => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading || !formattedMetrics) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="mt-6 pt-4 border-t border-purple-200">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
      <h4 className="font-semibold text-gray-900 mb-2">Sheet Performance</h4>
      {sheetName && (
        <p className="text-sm text-gray-600 mb-4">{sheetName}</p>
      )}
      
      <div className="space-y-4">
        {/* Total Invested */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Invested</span>
          <span className="text-sm font-medium text-gray-900">{formattedMetrics.totalInvested}</span>
        </div>
        
        {/* Total Value */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Value</span>
          <span className="text-sm font-medium text-gray-900">{formattedMetrics.totalValue}</span>
        </div>
        
        {/* Total Return */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Return</span>
          <div className="text-right">
            <div className={`text-sm font-medium ${getChangeColor(parseFloat(formattedMetrics.totalReturnPercent))}`}>
              {formattedMetrics.totalReturn}
            </div>
            <div className={`text-xs ${getChangeColor(parseFloat(formattedMetrics.totalReturnPercent))}`}>
              {formattedMetrics.totalReturnPercent}
            </div>
          </div>
        </div>
      </div>

      {/* Market Benchmarks Section */}
      <div className="mt-6 pt-4 border-t border-purple-200">
        <h4 className="font-semibold text-gray-900 mb-4">Market Benchmarks</h4>
        
        <div className="space-y-4">
          {/* S&P 500 Placeholder */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium text-gray-900">S&P 500</span>
              <div className="text-xs text-gray-500">SPY</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                $450.00
              </div>
              <div className="text-xs text-gray-500">
                +0.50%
              </div>
            </div>
          </div>
          
          {/* Dow Jones Placeholder */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium text-gray-900">Dow Jones</span>
              <div className="text-xs text-gray-500">DIA</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                $350.00
              </div>
              <div className="text-xs text-gray-500">
                +0.25%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
