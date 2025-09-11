"use client";

import { useState } from 'react';
import { AssetSection, Asset } from '@/lib/firebase/types';
import AssetTable from './AssetTable';

interface SectionItemProps {
  section: AssetSection;
  assets: Asset[];
  onToggle: (sectionId: string) => void;
  onAddAsset: (sectionId: string) => void;
  onEditSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onEditAsset: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
  loading?: boolean;
  isAuthenticated?: boolean;
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
  loading = false,
  isAuthenticated = true,
}: SectionItemProps) {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Section Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => onToggle(section.id)}
      >
        <div className="flex items-center space-x-3">
          {/* Expand/Collapse Icon */}
          <div className="w-4 h-4 flex items-center justify-center">
            {section.isExpanded ? (
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>

          {/* Section Name */}
          <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
        </div>

        {/* Section Summary */}
        <div className="flex items-center space-x-6">
          <div className="text-sm text-gray-600">
            Invested: {formatCurrency(section.summary.totalInvested)}
          </div>
          <div className={`text-sm font-medium ${
            section.summary.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPercent(section.summary.totalReturnPercent)}
          </div>
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(section.summary.totalValue)}
          </div>

          {/* Section Actions */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {/* Actions Dropdown */}
              {showActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSection(section.id);
                        setShowActions(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Edit Section
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSection(section.id);
                        setShowActions(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete Section
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section Content */}
      {section.isExpanded && (
        <div className="border-t border-gray-200">
          {/* Asset Table */}
          <div className="p-2">
            <AssetTable
              assets={assets}
              onEditAsset={onEditAsset}
              onDeleteAsset={onDeleteAsset}
              loading={loading}
              isAuthenticated={isAuthenticated}
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
