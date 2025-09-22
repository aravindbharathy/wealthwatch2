"use client";

import { useState, useEffect, useMemo } from 'react';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { Asset } from '@/lib/firebase/types';
import { convertCurrency } from '@/lib/currency';

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
  const [convertedTotals, setConvertedTotals] = useState<{
    totalInvested: number;
    totalValue: number;
    totalReturn: number;
    totalReturnPercent: number;
  } | null>(null);
  const [formattedMetrics, setFormattedMetrics] = useState<{
    totalInvested: string;
    totalValue: string;
    totalReturn: string;
    totalReturnPercent: string;
  } | null>(null);

  // Create a stable key for the assets to detect changes
  const assetsKey = useMemo(() => 
    currentSheetAssets.map(asset => `${asset.id}-${asset.sectionId}-${asset.costBasis}-${asset.currentValue}-${asset.currency}`).join('|'),
    [currentSheetAssets]
  );

  // Convert all values to preferred currency efficiently
  useEffect(() => {
    const convertTotals = async () => {
      if (currentSheetAssets.length === 0) {
        setConvertedTotals({
          totalInvested: 0,
          totalValue: 0,
          totalReturn: 0,
          totalReturnPercent: 0,
        });
        return;
      }
      
      try {
        // Group assets by currency to minimize API calls
        const currencyGroups: { [currency: string]: { costBasis: number; currentValue: number } } = {};
        
        for (const asset of currentSheetAssets) {
          const currency = asset.currency || 'USD';
          if (!currencyGroups[currency]) {
            currencyGroups[currency] = { costBasis: 0, currentValue: 0 };
          }
          
          if (asset.costBasis && asset.costBasis > 0) {
            currencyGroups[currency].costBasis += asset.costBasis;
          }
          currencyGroups[currency].currentValue += asset.currentValue;
        }
        
        let convertedInvested = 0;
        let convertedValue = 0;
        
        // Convert each currency group efficiently
        const conversionPromises = Object.entries(currencyGroups).map(async ([currency, amounts]) => {
          if (currency === preferredCurrency) {
            // No conversion needed
            return {
              costBasis: amounts.costBasis,
              currentValue: amounts.currentValue
            };
          } else {
            // Use convertCurrency for efficient conversion with caching
            const [costBasisConversion, currentValueConversion] = await Promise.all([
              amounts.costBasis > 0 ? convertCurrency(currency, preferredCurrency, amounts.costBasis) : Promise.resolve({ convertedAmount: 0 }),
              convertCurrency(currency, preferredCurrency, amounts.currentValue)
            ]);
            
            return {
              costBasis: costBasisConversion.convertedAmount || 0,
              currentValue: currentValueConversion.convertedAmount || 0
            };
          }
        });
        
        const conversions = await Promise.all(conversionPromises);
        
        // Sum up all conversions
        for (const conversion of conversions) {
          convertedInvested += conversion.costBasis;
          convertedValue += conversion.currentValue;
        }
        
        const convertedReturn = convertedValue - convertedInvested;
        const convertedReturnPercent = convertedInvested > 0 ? (convertedReturn / convertedInvested) * 100 : 0;
        
        setConvertedTotals({
          totalInvested: convertedInvested,
          totalValue: convertedValue,
          totalReturn: convertedReturn,
          totalReturnPercent: convertedReturnPercent,
        });
      } catch (error) {
        console.error('Error converting totals:', error);
        // Fallback to original values
        const totalInvested = currentSheetAssets.reduce((sum, asset) => {
          return asset.costBasis && asset.costBasis > 0 ? sum + asset.costBasis : sum;
        }, 0);
        const totalValue = currentSheetAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
        const totalReturn = totalValue - totalInvested;
        const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
        
        setConvertedTotals({
          totalInvested,
          totalValue,
          totalReturn,
          totalReturnPercent,
        });
      }
    };
    
    convertTotals();
  }, [assetsKey, preferredCurrency]);


  // Format metrics when converted totals change
  useEffect(() => {
    const formatMetrics = () => {
      if (!convertedTotals) return;
      
      // Use direct formatting since amounts are already converted to preferred currency
      const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: preferredCurrency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      };

      setFormattedMetrics({
        totalInvested: formatAmount(convertedTotals.totalInvested),
        totalValue: formatAmount(convertedTotals.totalValue),
        totalReturn: formatAmount(convertedTotals.totalReturn),
        totalReturnPercent: `${convertedTotals.totalReturnPercent >= 0 ? '+' : ''}${convertedTotals.totalReturnPercent.toFixed(2)}%`,
      });
    };

    if (convertedTotals) {
      formatMetrics();
    }
  }, [convertedTotals, preferredCurrency]);


  const formatPercent = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getChangeColor = (value: number): string => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading || !convertedTotals || !formattedMetrics) {
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
