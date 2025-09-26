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
        // Calculate IRR at individual asset level first, then convert currencies
        let convertedReturnForIRR = 0;
        let convertedInvestedForIRR = 0;
        let convertedValue = 0;
        
        // Process each asset individually for IRR calculation
        for (const asset of allAssets) {
          
          // Only calculate IRR for assets with cost basis
          if (asset.costBasis !== undefined && asset.costBasis > 0) {
            // Convert cost basis to preferred currency
            let convertedCostBasis = asset.costBasis;
            if (asset.currency !== preferredCurrency) {
              const costBasisConversion = await convertCurrency(asset.currency || 'USD', preferredCurrency, asset.costBasis);
              convertedCostBasis = costBasisConversion.convertedAmount || 0;
            }
            
            // Convert current value to preferred currency
            let convertedCurrentValue = asset.currentValue || 0;
            if (asset.currency !== preferredCurrency) {
              const currentValueConversion = await convertCurrency(asset.currency || 'USD', preferredCurrency, asset.currentValue || 0);
              convertedCurrentValue = currentValueConversion.convertedAmount || 0;
            }
            
            convertedInvestedForIRR += convertedCostBasis;
            convertedReturnForIRR += convertedCurrentValue - convertedCostBasis;
          }
          
          // Convert current value for total value calculation (all assets)
          let assetConvertedValue = asset.currentValue || 0;
          if (asset.currency !== preferredCurrency) {
            const currentValueConversion = await convertCurrency(asset.currency || 'USD', preferredCurrency, asset.currentValue || 0);
            assetConvertedValue = currentValueConversion.convertedAmount || 0;
          }
          convertedValue += assetConvertedValue;
        }
        
        const convertedReturnPercent = convertedInvestedForIRR > 0 ? (convertedReturnForIRR / convertedInvestedForIRR) * 100 : 0;
        
        setConvertedTotals({
          totalInvested: convertedInvestedForIRR,
          totalValue: convertedValue,
          totalReturn: convertedReturnForIRR,
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
        const totalReturnPercent = totalInvestedForIRR > 0 ? (totalReturnForIRR / totalInvestedForIRR) * 100 : 0;
        
        setConvertedTotals({
          totalInvested: totalInvestedForIRR,
          totalValue,
          totalReturn: totalReturnForIRR,
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
