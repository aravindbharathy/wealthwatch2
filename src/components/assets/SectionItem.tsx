"use client";

import { useState, useEffect, useRef } from 'react';
import { AssetSection, Asset } from '@/lib/firebase/types';
import AssetTable from './AssetTable';
import { useDroppable } from '@dnd-kit/core';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { convertCurrency } from '@/lib/currency';
import CurrencyFormattedValue from '@/components/CurrencyFormattedValue';

interface SectionItemProps {
  section: AssetSection;
  assets: Asset[];
  onToggle: (sectionId: string) => void;
  onAddAsset: (sectionId: string) => void;
  onEditSection: (sectionId: string) => void;
  onRenameSection: (sectionId: string, newName: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onEditAsset: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onMoveAsset?: (assetId: string) => void;
  onReorderAssets?: (assetId: string, newSectionId: string, newIndex: number) => void;
  onViewHoldings?: (assetId: string) => void;
  onViewConsolidated?: (sectionId: string) => void;
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
  onRenameSection,
  onDeleteSection,
  onEditAsset,
  onDeleteAsset,
  onMoveAsset,
  onReorderAssets,
  onViewHoldings,
  onViewConsolidated,
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(section.name);
  const actionsRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Update editing name when section name changes
  useEffect(() => {
    setEditingName(section.name);
  }, [section.name]);

  const handleRenameClick = () => {
    setIsEditingName(true);
    setShowActions(false);
  };

  const handleNameSave = () => {
    if (editingName.trim() && editingName.trim() !== section.name) {
      onRenameSection(section.id, editingName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditingName(section.name);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  // Convert all values to preferred currency efficiently
  useEffect(() => {
    const convertTotals = async () => {
      try {
        // Calculate IRR at individual asset level first, then convert currencies
        let convertedReturnForIRR = 0;
        let convertedInvestedForIRR = 0;
        let convertedValue = 0;
        
        // Process each asset individually for IRR calculation
        for (const asset of assets) {
          // Skip undefined or invalid assets
          if (!asset || !asset.id) {
            continue;
          }
          
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
        console.error('Error converting section totals:', error);
        // Fallback to original values with correct IRR calculation
        const totalInvested = assets.reduce((sum, asset) => {
          if (!asset || !asset.id) return sum;
          return asset.costBasis !== undefined && asset.costBasis > 0 ? sum + asset.costBasis : sum;
        }, 0);
        const totalValue = assets.reduce((sum, asset) => {
          if (!asset || !asset.id) return sum;
          return sum + (asset.currentValue || 0);
        }, 0);
        
        // Calculate IRR only for assets with cost basis
        let totalReturnForIRR = 0;
        let totalInvestedForIRR = 0;
        
        assets.forEach(asset => {
          if (asset && asset.id && asset.costBasis !== undefined && asset.costBasis > 0) {
            totalInvestedForIRR += asset.costBasis;
            totalReturnForIRR += (asset.currentValue || 0) - asset.costBasis;
          }
        });
        
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
              {isEditingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={handleNameKeyDown}
                  className="text-base font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none"
                />
              ) : (
                <h3 className="text-base font-semibold text-gray-900">{section.name}</h3>
              )}
              {section.isFromAccount && (
                <div className="ml-2 flex items-center" title="Created from account holdings">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              )}
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
                      e.preventDefault();
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
      className={`relative transition-all duration-150 ease-out overflow-visible mb-2 ${
        isOver && isSectionEmpty ? 'border-blue-400 bg-blue-50 shadow-md border-2 rounded-lg' : 'border-transparent border-2'
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
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleNameKeyDown}
                className="text-base font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none"
              />
            ) : (
              <h3 className="text-base font-semibold text-gray-900">{section.name}</h3>
            )}
            {section.isFromAccount && (
              <div className="ml-2 flex items-center" title="Created from account holdings">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Summary Stats - Aligned with table columns */}
          <div className={`flex justify-end text-sm font-medium ${
            totalInvested > 0 ? (totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'
          }`}>
            {totalInvested > 0 ? formatPercent(totalReturnPercent) : '--'}
          </div>
          <div className="flex justify-end items-center text-sm text-gray-900 font-medium">
            {totalInvested > 0 ? (
              <CurrencyFormattedValue 
                amount={totalInvested} 
                fromCurrency={preferredCurrency}
                className="text-sm font-medium text-gray-900"
              />
            ) : (
              <span className="text-gray-400">--</span>
            )}
          </div>
          <div className="flex justify-end items-center text-sm text-gray-900 font-medium">
            <CurrencyFormattedValue 
              amount={totalValue} 
              fromCurrency={preferredCurrency}
              className="text-sm font-medium text-gray-900"
            />
          </div>
          
          {/* Actions Menu */}
          <div className="flex justify-center">
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
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
                  <div ref={actionsRef} className="absolute right-0 top-8 bg-white border border-gray-200 shadow-xl py-1 min-w-[160px] z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameClick();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Rename</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSection(section.id);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                    {section.isFromAccount && onViewConsolidated && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewConsolidated(section.id);
                          setShowActions(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>View Consolidated</span>
                      </button>
                    )}
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