"use client";

import { useState, useEffect, useMemo } from 'react';
import { Asset } from '@/lib/firebase/types';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { convertCurrency } from '@/lib/currency';

interface TotalAssetsSummaryProps {
  assetsBySection: { [sectionId: string]: Asset[] };
}

export default function TotalAssetsSummary({ assetsBySection }: TotalAssetsSummaryProps) {
  const { preferredCurrency } = useCurrency();
  const [convertedTotals, setConvertedTotals] = useState<{
    totalInvested: number;
    totalValue: number;
    totalReturn: number;
    totalReturnPercent: number;
  } | null>(null);
  
  // Memoize the assets array to prevent infinite re-renders
  const allAssets = useMemo(() => Object.values(assetsBySection).flat(), [assetsBySection]);
  
  // Create a stable key for the assets to detect changes
  const assetsKey = useMemo(() => 
    allAssets.map(asset => `${asset.id}-${asset.sectionId}-${asset.costBasis}-${asset.currentValue}-${asset.currency}`).join('|'),
    [allAssets]
  );
  
  // Convert all values to preferred currency efficiently
  useEffect(() => {
    const convertTotals = async () => {
      
      try {
        // Group assets by currency to minimize API calls
        const currencyGroups: { [currency: string]: { costBasis: number; currentValue: number } } = {};
        
        for (const asset of allAssets) {
          const currency = asset.currency || 'USD';
          if (!currencyGroups[currency]) {
            currencyGroups[currency] = { costBasis: 0, currentValue: 0 };
          }
          
          if (asset.costBasis !== undefined && asset.costBasis > 0) {
            currencyGroups[currency].costBasis += asset.costBasis;
          }
          currencyGroups[currency].currentValue += asset.currentValue || 0;
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
        
        // Calculate IRR only for assets with cost basis (separate from total value)
        let convertedReturnForIRR = 0;
        let convertedInvestedForIRR = 0;
        
        for (const conversion of conversions) {
          convertedInvestedForIRR += conversion.costBasis;
          // For IRR calculation, only include return from assets that have cost basis
          convertedReturnForIRR += conversion.costBasis > 0 ? (conversion.currentValue - conversion.costBasis) : 0;
        }
        
        // Sum up all conversions for total value (includes all assets)
        for (const conversion of conversions) {
          convertedValue += conversion.currentValue;
        }
        
        const convertedReturn = convertedValue - convertedInvestedForIRR;
        const convertedReturnPercent = convertedInvestedForIRR > 0 ? (convertedReturnForIRR / convertedInvestedForIRR) * 100 : 0;
        
        setConvertedTotals({
          totalInvested: convertedInvestedForIRR,
          totalValue: convertedValue,
          totalReturn: convertedReturn,
          totalReturnPercent: convertedReturnPercent,
        });
      } catch (error) {
        console.error('Error converting totals:', error);
        // Fallback to original values
        // Calculate IRR only for assets with cost basis
        let totalReturnForIRR = 0;
        let totalInvestedForIRR = 0;
        
        allAssets.forEach(asset => {
          if (asset.costBasis !== undefined && asset.costBasis > 0) {
            totalInvestedForIRR += asset.costBasis;
            totalReturnForIRR += (asset.currentValue || 0) - asset.costBasis;
          }
        });
        
        const totalValue = allAssets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
        const totalReturn = totalValue - totalInvestedForIRR;
        const totalReturnPercent = totalInvestedForIRR > 0 ? (totalReturnForIRR / totalInvestedForIRR) * 100 : 0;
        
        setConvertedTotals({
          totalInvested: totalInvestedForIRR,
          totalValue,
          totalReturn,
          totalReturnPercent,
        });
      }
    };
    
    convertTotals();
  }, [assetsKey, preferredCurrency]);
  
  // Use converted totals if available, otherwise show loading
  if (!convertedTotals) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400 mb-2">Loading...</div>
          <div className="text-sm text-gray-500">Calculating total assets value</div>
        </div>
      </div>
    );
  }

  const { totalInvested, totalValue, totalReturn, totalReturnPercent } = convertedTotals;

  // Format values
  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="p-2 mb-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg text-gray-900 mb-1">Total Assets</h2>
          <div className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: preferredCurrency,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(totalValue)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 mb-1">
            Total invested: <span className="font-semibold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: preferredCurrency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(totalInvested)}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Total return: <span className={`font-semibold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: preferredCurrency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(totalReturn)} ({formatPercent(totalReturnPercent)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
