"use client";

import { useState } from 'react';
import { AssetSection, Asset } from '@/lib/firebase/types';
import AssetTable from './AssetTable';
import { useDroppable } from '@dnd-kit/core';

interface SectionItemProps {
  section: AssetSection;
  assets: Asset[];
  onToggle: (sectionId: string) => void;
  onAddAsset: (sectionId: string) => void;
  onEditSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onEditAsset: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onReorderAssets?: (assetId: string, newSectionId: string, newIndex: number) => void;
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
  onReorderAssets,
  loading = false,
  isAuthenticated = true,
  activeAssetId,
}: SectionItemProps) {
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

  const totalInvested = assets.reduce((sum, asset) => sum + asset.costBasis, 0);
  const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalReturn = totalValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  return (
    <div 
      ref={isSectionEmpty ? setDroppableRef : undefined}
      className={`relative bg-white rounded-lg shadow-sm border transition-all duration-200 overflow-visible mb-6 ${
        isOver && isSectionEmpty ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-gray-200'
      }`}
    >

      {/* Section Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 relative"
        onClick={() => onToggle(section.id)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
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
            <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Summary Stats */}
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600">
              Invested: {formatCurrency(totalInvested)}
            </span>
            <span className={`font-medium ${
              totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercent(totalReturnPercent)}
            </span>
            <span className="text-gray-900 font-medium">
              {formatCurrency(totalValue)}
            </span>
          </div>

          {/* Actions Menu */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors"
                title="Section options"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>

              {showActions && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[160px] z-10">
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

      {/* Section Content */}
      {section.isExpanded && (
        <div className="border-t border-gray-200 overflow-visible">
          {/* Asset Table */}
          <div className="overflow-visible">
            <AssetTable
              assets={assets}
              onEditAsset={onEditAsset}
              onDeleteAsset={onDeleteAsset}
              onReorderAssets={onReorderAssets}
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
                className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-gray-900"
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