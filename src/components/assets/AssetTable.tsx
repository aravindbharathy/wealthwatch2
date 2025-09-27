"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Asset } from '@/lib/firebase/types';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import CurrencyFormattedValue from '@/components/CurrencyFormattedValue';
import AssetDetailPopup from './modals/AssetDetailPopup';

interface AssetTableProps {
  assets: Asset[];
  onEditAsset: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onMoveAsset?: (assetId: string) => void;
  onReorderAssets?: (assetId: string, newSectionId: string, newIndex: number) => void;
  onViewHoldings?: (assetId: string) => void;
  loading?: boolean;
  isAuthenticated?: boolean;
  sectionId?: string;
  activeAssetId?: string | null;
}

export default function AssetTable({
  assets,
  onEditAsset,
  onDeleteAsset,
  onMoveAsset,
  onReorderAssets,
  onViewHoldings,
  loading = false,
  isAuthenticated = true,
  sectionId,
  activeAssetId,
}: AssetTableProps) {
  const [popupState, setPopupState] = useState<{
    isOpen: boolean;
    assetId: string | null;
    position: { top: number; left: number };
    buttonElement: HTMLElement | null;
  }>({
    isOpen: false,
    assetId: null,
    position: { top: 0, left: 0 },
    buttonElement: null,
  });

  const [detailPopupState, setDetailPopupState] = useState<{
    isOpen: boolean;
    asset: Asset | null;
  }>({
    isOpen: false,
    asset: null,
  });



  const openPopup = (assetId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // If clicking on the same asset that already has a popup open, close it
    if (popupState.isOpen && popupState.assetId === assetId) {
      closePopup();
      return;
    }
    
    const buttonElement = event.currentTarget as HTMLElement;
    const rect = buttonElement.getBoundingClientRect();
    const popupWidth = 160; // min-w-[160px]
    
    // Calculate position relative to the button
    let left = rect.right - popupWidth;
    if (left < 10) {
      left = rect.left;
    }
    
    // Use setTimeout to delay the popup opening to prevent immediate closure by mousedown
    setTimeout(() => {
      setPopupState({
        isOpen: true,
        assetId,
        position: {
          top: rect.bottom + 4,
          left: left,
        },
        buttonElement,
      });
    }, 0);
  };

  const closePopup = () => {
    setPopupState({
      isOpen: false,
      assetId: null,
      position: { top: 0, left: 0 },
      buttonElement: null,
    });
  };

  const openDetailPopup = (asset: Asset) => {
    setDetailPopupState({
      isOpen: true,
      asset,
    });
  };

  const closeDetailPopup = () => {
    setDetailPopupState({
      isOpen: false,
      asset: null,
    });
  };

  // Update popup position on scroll
  useEffect(() => {
    if (!popupState.isOpen || !popupState.buttonElement) return;

    const updatePosition = () => {
      const rect = popupState.buttonElement!.getBoundingClientRect();
      const popupWidth = 160; // min-w-[160px]
      
      let left = rect.right - popupWidth;
      if (left < 10) {
        left = rect.left;
      }
      
      setPopupState(prev => ({
        ...prev,
        position: {
          top: rect.bottom + 4,
          left: left,
        },
      }));
    };

    // Update position on scroll
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [popupState.isOpen, popupState.buttonElement]);



  const formatCurrency = (amount: number) => {
    // For now, we'll use a synchronous approach with a fallback
    // In a real implementation, you might want to pre-format all values
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // This will be updated to use preferred currency
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

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`grid grid-cols-[16px_1fr_64px_80px_80px_40px] gap-4 items-center py-1 px-2 ${
            i < 2 ? 'border-b border-gray-100' : ''
          }`}>
            <div></div>
            <div className="h-4 bg-gray-200"></div>
            <div className="h-4 bg-gray-200"></div>
            <div className="h-4 bg-gray-200"></div>
            <div className="h-4 bg-gray-200"></div>
            <div></div>
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <p>No assets in this section</p>
        <p className="text-sm">Add your first asset to get started</p>
      </div>
    );
  }

  return (
    <div className="relative">
        {/* Table Header */}
        <div className="grid grid-cols-[16px_1fr_64px_120px_120px_32px_32px] gap-2 items-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div></div>
          <div className="text-left">ASSET</div>
          <div className="text-right">IRR</div>
          <div className="text-right">COST BASIS</div>
          <div className="text-right">VALUE</div>
          <div></div>
          <div></div>
        </div>

        {/* Asset Rows with Inter-Asset Drop Zones */}
        {(() => {
          const validAssets = assets.filter(asset => asset && asset.id);
          return validAssets.map((asset, index) => {
            const isActiveAsset = asset.id === activeAssetId;
            const prevAsset = index > 0 ? validAssets[index - 1] : null;
            const isPrevAssetActive = prevAsset?.id === activeAssetId;
          
          return (
            <React.Fragment key={asset.id}>
              {/* Drop zone before this asset - skip if current or previous asset is being dragged */}
              {!isActiveAsset && !isPrevAssetActive && (
                <InterAssetDropZone sectionId={sectionId} targetIndex={index} />
              )}
              
              <SortableAssetRow
                asset={asset}
                index={index}
                isLastAsset={index === assets.length - 1}
                isAuthenticated={isAuthenticated}
                onEditAsset={onEditAsset}
                onDeleteAsset={onDeleteAsset}
                onMoveAsset={onMoveAsset}
                openPopup={openPopup}
                openDetailPopup={openDetailPopup}
                formatCurrency={formatCurrency}
                formatPercent={formatPercent}
                getPerformanceIcon={getPerformanceIcon}
              />
            </React.Fragment>
          );
        });
        })()}
        
        {/* Drop zone after the last asset - only if section has assets and last asset is not being dragged */}
        {(() => {
          const validAssets = assets.filter(asset => asset && asset.id);
          return validAssets.length > 0 && validAssets[validAssets.length - 1]?.id !== activeAssetId && (
            <InterAssetDropZone sectionId={sectionId} targetIndex={validAssets.length} />
          );
        })()}
        
        {/* Popup Menu */}
        <PopupMenu
          isOpen={popupState.isOpen}
          onClose={closePopup}
          onEdit={() => popupState.assetId && onEditAsset(popupState.assetId)}
          onDelete={() => popupState.assetId && onDeleteAsset(popupState.assetId)}
          onMove={() => popupState.assetId && onMoveAsset?.(popupState.assetId)}
          onViewHoldings={() => popupState.assetId && onViewHoldings?.(popupState.assetId)}
          isAccountAsset={popupState.assetId ? assets.find(a => a.id === popupState.assetId)?.type === 'account' : false}
          isAccountHolding={popupState.assetId ? assets.find(a => a.id === popupState.assetId)?.accountMapping?.isLinked === true : false}
          position={popupState.position}
        />

        {/* Asset Detail Popup */}
        <AssetDetailPopup
          isOpen={detailPopupState.isOpen}
          onClose={closeDetailPopup}
          asset={detailPopupState.asset}
        />
    </div>
  );
}


// Sortable Asset Row Component
interface SortableAssetRowProps {
  asset: Asset;
  index: number;
  isLastAsset: boolean;
  isAuthenticated: boolean;
  onEditAsset: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onMoveAsset?: (assetId: string) => void;
  openPopup: (assetId: string, event: React.MouseEvent) => void;
  openDetailPopup: (asset: Asset) => void;
  formatCurrency: (amount: number) => string;
  formatPercent: (percent: number) => string;
  getPerformanceIcon: (change: number) => JSX.Element | null;
}

const SortableAssetRow: React.FC<SortableAssetRowProps> = ({
  asset,
  index,
  isLastAsset,
  isAuthenticated,
  onEditAsset,
  onDeleteAsset,
  onMoveAsset,
  openPopup,
  openDetailPopup,
  formatCurrency,
  formatPercent,
  getPerformanceIcon,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    visibility: (isDragging ? 'hidden' : 'visible') as 'hidden' | 'visible',
  };

  const totalReturnPercent = asset.costBasis !== undefined && asset.costBasis > 0 ? 
    ((asset.currentValue - asset.costBasis) / asset.costBasis) * 100 : null;
  const dayChange = asset.performance?.dayChange || 0;

  // Use sortable ref directly

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative grid grid-cols-[16px_1fr_64px_120px_120px_32px_32px] gap-2 items-center py-1 px-2 hover:bg-gray-50 group transition-all duration-200 ${
        !isLastAsset ? 'border-b border-gray-100' : ''
      } ${isDragging ? 'z-50 pointer-events-none' : ''}`}
    >
      
      {/* Drag Handle */}
      <div className="flex justify-center">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move p-0.5 hover:bg-gray-200 transition-colors duration-150 group/drag"
          title="Drag to reorder"
        >
          <svg className="w-3 h-3 text-gray-400 group-hover/drag:text-gray-600 transition-colors duration-150" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>
      </div>

      {/* Asset Info */}
      <div className="text-left">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-normal text-gray-900">
            {asset.name}
            {asset.symbol && (
              <span className="text-xs text-gray-500 font-normal"> - {asset.symbol}</span>
            )}
          </div>
          {/* Link icon for assets linked to accounts */}
          {asset.accountMapping?.isLinked && (
            <div title="Linked to account">
              <svg 
                className="w-4 h-4 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          )}
          {/* Link icon for account summaries */}
          {asset.metadata?.customFields?.isAccountSummary && (
            <div title="Account summary">
              <svg 
                className="w-4 h-4 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* IRR */}
      <div className={`text-right text-sm font-medium ${
        totalReturnPercent !== null ? (totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'
      }`}>
        {totalReturnPercent !== null ? formatPercent(totalReturnPercent) : '--'}
      </div>

      {/* Cost Basis */}
      <div className="text-right text-sm font-medium text-gray-900">
        {asset.costBasis !== undefined && asset.costBasis > 0 ? (
          <CurrencyFormattedValue 
            amount={asset.costBasis} 
            fromCurrency={asset.currency}
            className="text-sm font-medium text-gray-900"
          />
        ) : (
          <span className="text-gray-400">--</span>
        )}
      </div>

      {/* Value */}
      <div className="text-right text-sm font-medium text-gray-900">
        <div className="flex items-center justify-end space-x-1">
          {getPerformanceIcon(dayChange)}
          <CurrencyFormattedValue 
            amount={asset.currentValue} 
            fromCurrency={asset.currency}
            className="text-sm font-medium text-gray-900"
          />
        </div>
      </div>

      {/* Info Icon - Only show for stock ticker assets */}
      {isAuthenticated && asset.type === 'stock_ticker' && (
        <div className="flex justify-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openDetailPopup(asset);
            }}
            className="p-0.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
            title="View details"
            type="button"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      )}

      {/* Actions */}
      {isAuthenticated && (
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openPopup(asset.id, e);
            }}
            className="p-0.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            title="More options"
            type="button"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// Inter-Asset Drop Zone Component  
interface InterAssetDropZoneProps {
  sectionId?: string;
  targetIndex: number;
}

const InterAssetDropZone: React.FC<InterAssetDropZoneProps> = ({ sectionId, targetIndex }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `inter-${sectionId}-${targetIndex}`,
    data: {
      type: 'inter-asset',
      sectionId,
      targetIndex,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-150 ease-out ${
        isOver 
          ? 'h-10 bg-blue-50 border-2 border-dashed border-blue-300 mx-2 rounded flex items-center justify-center shadow-sm' 
          : 'h-1 bg-transparent' // Keep minimal height to prevent layout shifts
      }`}
    >
      {isOver && (
        <div className="text-blue-600 text-sm font-medium opacity-80">
          Drop asset here
        </div>
      )}
    </div>
  );
};

// Popup Menu Component
interface PopupMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove?: () => void;
  onViewHoldings?: () => void;
  isAccountAsset?: boolean;
  isAccountHolding?: boolean;
  position: { top: number; left: number };
}

const PopupMenu: React.FC<PopupMenuProps> = ({ isOpen, onClose, onEdit, onDelete, onMove, onViewHoldings, isAccountAsset, isAccountHolding, position }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white border border-gray-200 shadow-xl py-1 min-w-[160px]"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
        type="button"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span>Edit</span>
      </button>
      {isAccountAsset && onViewHoldings && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onViewHoldings();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>View All Holdings</span>
        </button>
      )}
      {onMove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMove();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>Move</span>
        </button>
      )}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isAccountHolding) {
            onDelete();
            onClose();
          }
        }}
        disabled={isAccountHolding}
        className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-colors ${
          isAccountHolding 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-red-600 hover:bg-red-50'
        }`}
        type="button"
        title={isAccountHolding ? 'Cannot delete holdings that are part of an account. Use the account management to remove holdings.' : 'Delete asset'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Delete</span>
        {isAccountHolding && (
          <span className="text-xs text-gray-400 ml-auto">(Disabled)</span>
        )}
      </button>
    </div>
  );
};