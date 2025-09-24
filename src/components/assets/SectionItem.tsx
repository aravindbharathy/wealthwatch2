"use client";

import { useState, useEffect } from 'react';
import { AssetSection, Asset } from '@/lib/firebase/types';
import AssetTable from './AssetTable';
import { useDroppable } from '@dnd-kit/core';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { convertCurrency } from '@/lib/currency';

interface SectionItemProps {
  section: AssetSection;
  assets: Asset[];
  onToggle: (sectionId: string) => void;
  onAddAsset: (sectionId: string) => void;
  onEditSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onEditAsset: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onMoveAsset?: (assetId: string) => void;
  onReorderAssets?: (assetId: string, newSectionId: string, newIndex: number) => void;
  onViewHoldings?: (assetId: string) => void;
  loading?: boolean;
  isAuthenticated?: boolean;
  activeAssetId?: string | null;
}

export default function SectionItem({
  section,
  assets,
  onToggle,
  onAddAsset,
  onEditSection,
  onDeleteSection,
  onEditAsset,
  onDeleteAsset,
  onMoveAsset,
  onReorderAssets,
  onViewHoldings,
  loading = false,
  isAuthenticated = true,
  activeAssetId,
}: SectionItemProps) {
  const { preferredCurrency, convertAmount } = useCurrency();
  const [convertedTotals, setConvertedTotals] = useState<{
    totalInvested: number;
    totalValue: number;
    totalReturn: number;
    totalReturnPercent: number;
  } | null>(null);

  // Only create drop zone for empty sections to prevent blue rectangle flickering
  const isSectionEmpty = assets.length === 0;
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: section.id,
    data: {
      type: 'section',
    },
    disabled: !isSectionEmpty, // Only enable for empty sections
  });
  const [showActions, setShowActions] = useState(false);

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  // Convert all values to preferred currency efficiently
  useEffect(() => {
    const convertTotals = async () => {
      try {
        // Group assets by currency to minimize API calls
        const currencyGroups: { [currency: string]: { costBasis: number; currentValue: number } } = {};
        
        for (const asset of assets) {
          // Skip undefined or invalid assets
          if (!asset || !asset.id) {
            continue;
          }
          
          const currency = asset.currency || 'USD';
          if (!currencyGroups[currency]) {
            currencyGroups[currency] = { costBasis: 0, currentValue: 0 };
          }
          
          if (asset.costBasis && asset.costBasis > 0) {
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
        console.error('Error converting section totals:', error);
        // Fallback to original values
        const totalInvested = assets.reduce((sum, asset) => {
          if (!asset || !asset.id) return sum;
          return asset.costBasis && asset.costBasis > 0 ? sum + asset.costBasis : sum;
        }, 0);
        const totalValue = assets.reduce((sum, asset) => {
          if (!asset || !asset.id) return sum;
          return sum + (asset.currentValue || 0);
        }, 0);
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
  }, [assets, preferredCurrency]);

  const getPerformanceIcon = (change: number) => {
    if (change > 0) {
      return (
        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (change < 0) {
      return (
        <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  // Use converted totals if available, otherwise show loading
  if (!convertedTotals) {
    return (
      <div className="relative transition-all duration-200 overflow-visible mb-2">
        <div className="cursor-pointer relative bg-transparent">
          <div className="grid grid-cols-[16px_1fr_64px_120px_120px_40px] gap-4 items-center py-1 px-2">
            <div className="flex justify-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="flex items-center">
              <h3 className="text-base font-semibold text-gray-900">{section.name}</h3>
            </div>
            <div className="flex justify-end text-sm font-medium text-gray-400">
              Loading...
            </div>
            <div className="flex justify-end items-center text-sm text-gray-400 font-medium">
              Loading...
            </div>
            <div className="flex justify-end items-center text-sm text-gray-400 font-medium">
              Loading...
            </div>
            <div className="flex justify-center">
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActions(!showActions);
                    }}
                    className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Section options"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { totalInvested, totalValue, totalReturn, totalReturnPercent } = convertedTotals;

  return (
    <div 
      ref={isSectionEmpty ? setDroppableRef : undefined}
      className={`relative transition-all duration-200 overflow-visible mb-2 ${
        isOver && isSectionEmpty ? 'border-blue-400 bg-blue-50 shadow-md border' : ''
      }`}
    >

      {/* Section Header - Using same grid as asset table for perfect alignment */}
      <div 
        className={`cursor-pointer relative bg-transparent ${
          !section.isExpanded ? 'border-b border-gray-200' : ''
        }`}
        onClick={() => onToggle(section.id)}
      >
        <div className="grid grid-cols-[16px_1fr_64px_120px_120px_40px] gap-4 items-center py-1 px-2">
          {/* Toggle Icon */}
          <div className="flex justify-center">
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                section.isExpanded ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {/* Section Name */}
          <div className="flex items-center">
            <h3 className="text-base font-semibold text-gray-900">{section.name}</h3>
          </div>
          
          {/* Summary Stats - Aligned with table columns */}
          <div className={`flex justify-end text-sm font-medium ${
            totalInvested > 0 ? (totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'
          }`}>
            {totalInvested > 0 ? formatPercent(totalReturnPercent) : '--'}
          </div>
          <div className="flex justify-end items-center text-sm text-gray-900 font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: preferredCurrency,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(totalInvested)}
          </div>
          <div className="flex justify-end items-center text-sm text-gray-900 font-medium">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: preferredCurrency,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(totalValue)}
          </div>
          
          {/* Actions Menu */}
          <div className="flex justify-center">
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(!showActions);
                  }}
                  className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Section options"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>

                {showActions && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 shadow-xl py-1 min-w-[160px] z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSection(section.id);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSection(section.id);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Content */}
      {section.isExpanded && (
        <div className="bg-white shadow-sm border border-gray-200 overflow-visible">
          {/* Asset Table */}
          <div className="overflow-visible">
            <AssetTable
              assets={assets}
              onEditAsset={onEditAsset}
              onDeleteAsset={onDeleteAsset}
              onMoveAsset={onMoveAsset}
              onReorderAssets={onReorderAssets}
              onViewHoldings={onViewHoldings}
              loading={loading}
              isAuthenticated={isAuthenticated}
              sectionId={section.id}
              activeAssetId={activeAssetId}
            />
          </div>

          {/* Add Asset Button */}
          {isAuthenticated && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => onAddAsset(section.id)}
                className="flex items-center space-x-2 text-sm font-normal text-gray-600 hover:text-gray-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>ADD ASSET</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}