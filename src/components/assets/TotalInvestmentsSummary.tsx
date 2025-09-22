"use client";

import { useState, useEffect, useMemo } from 'react';
import { Asset } from '@/lib/firebase/types';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { convertCurrency } from '@/lib/currency';

interface TotalInvestmentsSummaryProps {
  assetsBySection: { [sectionId: string]: Asset[] };
}

export default function TotalInvestmentsSummary({ assetsBySection }: TotalInvestmentsSummaryProps) {
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
        const totalInvested = allAssets.reduce((sum, asset) => {
          return asset.costBasis && asset.costBasis > 0 ? sum + asset.costBasis : sum;
        }, 0);
        const totalValue = allAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
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
  
  // Use converted totals if available, otherwise show loading
  if (!convertedTotals) {
    return (
      <div className="border-b border-gray-200 mb-2">
        <div className="grid grid-cols-[16px_1fr_64px_120px_120px_40px] gap-4 items-center py-2 px-2">
          <div></div>
          <div className="flex items-center">
            <h3 className="text-base font-semibold text-gray-900">Total Investments</h3>
          </div>
          <div className="flex justify-end text-sm font-bold text-gray-400">
            Loading...
          </div>
          <div className="flex justify-end items-center text-sm text-gray-400 font-bold">
            Loading...
          </div>
          <div className="flex justify-end items-center text-sm text-gray-400 font-bold">
            Loading...
          </div>
          <div></div>
        </div>
      </div>
    );
  }

  const { totalInvested, totalValue, totalReturn, totalReturnPercent } = convertedTotals;

  // Format values
  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="border-b border-gray-200 mb-2"> {/* Removed box, added bottom border */}
      {/* Column Headers */}
      <div className="grid grid-cols-[16px_1fr_64px_120px_120px_40px] gap-4 items-center py-1 px-2">
        {/* Empty space for toggle icon alignment */}
        <div></div>

        {/* Asset Name Column Header */}
        <div className="flex items-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide"></span>
        </div>

        {/* IRR Column Header */}
        <div className="flex justify-end">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">IRR</span>
        </div>

        {/* Cost Basis Column Header */}
        <div className="flex justify-end">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cost Basis</span>
        </div>

        {/* Value Column Header */}
        <div className="flex justify-end">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Value</span>
        </div>

        {/* Empty space for actions alignment */}
        <div></div>
      </div>

      {/* Total Investments Row */}
      <div className="grid grid-cols-[16px_1fr_64px_120px_120px_40px] gap-4 items-center py-2 px-2">
        {/* Empty space for toggle icon alignment */}
        <div></div>

        {/* Total Investments Label */}
        <div className="flex items-center">
          <h3 className="text-base font-semibold text-gray-900">Total Investments</h3>
        </div>

        {/* Total Return % */}
        <div className={`flex justify-end text-sm font-bold ${ // Made bold
          totalInvested > 0 ? (totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'
        }`}>
          {totalInvested > 0 ? formatPercent(totalReturnPercent) : '--'}
        </div>

        {/* Total Cost Basis */}
        <div className="flex justify-end items-center text-sm text-gray-900 font-bold"> {/* Made bold */}
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: preferredCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(totalInvested)}
        </div>

        {/* Total Value */}
        <div className="flex justify-end items-center text-sm text-gray-900 font-bold"> {/* Made bold */}
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: preferredCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(totalValue)}
        </div>

        {/* Empty space for actions alignment */}
        <div></div>
      </div>
    </div>
  );
}
