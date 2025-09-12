"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Asset } from '@/lib/firebase/types';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface AssetTableProps {
  assets: Asset[];
  onEditAsset: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onReorderAssets?: (assetId: string, newSectionId: string, newIndex: number) => void;
  loading?: boolean;
  isAuthenticated?: boolean;
  sectionId?: string;
}

export default function AssetTable({
  assets,
  onEditAsset,
  onDeleteAsset,
  onReorderAssets,
  loading = false,
  isAuthenticated = true,
  sectionId,
}: AssetTableProps) {
  const [popupState, setPopupState] = useState<{
    isOpen: boolean;
    assetId: string | null;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    assetId: null,
    position: { top: 0, left: 0 },
  });


  const openPopup = (assetId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const popupWidth = 160; // min-w-[160px]
    
    // Calculate position to ensure popup stays within viewport
    let left = rect.left + window.scrollX - popupWidth + rect.width;
    if (left < 0) {
      left = rect.left + window.scrollX;
    }
    if (left + popupWidth > viewportWidth) {
      left = viewportWidth - popupWidth - 10;
    }
    
    setPopupState({
      isOpen: true,
      assetId,
      position: {
        top: rect.bottom + window.scrollY + 4,
        left: left,
      },
    });
  };

  const closePopup = () => {
    setPopupState({
      isOpen: false,
      assetId: null,
      position: { top: 0, left: 0 },
    });
  };


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

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`grid grid-cols-[16px_1fr_64px_80px_80px_40px] gap-4 items-center py-2 px-2 ${
            i < 2 ? 'border-b border-gray-100' : ''
          }`}>
            <div></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div></div>
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
    <div className="space-y-0">
        {/* Table Header */}
        <div className="grid grid-cols-[16px_1fr_64px_80px_80px_40px] gap-4 items-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div></div>
          <div className="text-left">ASSET</div>
          <div className="text-right">IRR</div>
          <div className="text-right">COST BASIS</div>
          <div className="text-right">VALUE</div>
          <div></div>
        </div>

        {/* Top Drop Zone */}
        <TopDropZone sectionId={sectionId} />

        {/* Asset Rows with Inter-Asset Drop Zones */}
        {assets.map((asset, index) => {
          return (
            <React.Fragment key={asset.id}>
              {/* Drop zone before this asset */}
              <InterAssetDropZone sectionId={sectionId} targetIndex={index} />
              
              <SortableAssetRow
                asset={asset}
                index={index}
                isLastAsset={index === assets.length - 1}
                isAuthenticated={isAuthenticated}
                onEditAsset={onEditAsset}
                onDeleteAsset={onDeleteAsset}
                openPopup={openPopup}
                formatCurrency={formatCurrency}
                formatPercent={formatPercent}
                getPerformanceIcon={getPerformanceIcon}
              />
            </React.Fragment>
          );
        })}
        
        {/* Drop zone after the last asset */}
        <InterAssetDropZone sectionId={sectionId} targetIndex={assets.length} />
        
        {/* Bottom Drop Zone */}
        <BottomDropZone sectionId={sectionId} />
        
        {/* Popup Menu */}
        <PopupMenu
          isOpen={popupState.isOpen}
          onClose={closePopup}
          onEdit={() => popupState.assetId && onEditAsset(popupState.assetId)}
          onDelete={() => popupState.assetId && onDeleteAsset(popupState.assetId)}
          position={popupState.position}
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
  openPopup: (assetId: string, event: React.MouseEvent) => void;
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
  openPopup,
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

  const totalReturnPercent = asset.costBasis > 0 ? 
    ((asset.currentValue - asset.costBasis) / asset.costBasis) * 100 : 0;
  const dayChange = asset.performance?.dayChange || 0;

  // Use sortable ref directly

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative grid grid-cols-[16px_1fr_64px_80px_80px_40px] gap-4 items-center py-2 px-2 hover:bg-gray-50 group transition-all duration-200 ${
        !isLastAsset ? 'border-b border-gray-100' : ''
      } ${isDragging ? 'z-50 pointer-events-none' : ''}`}
    >
      
      {/* Drag Handle */}
      <div className="flex justify-center">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move p-1 hover:bg-gray-200 rounded transition-colors duration-150 group/drag"
          title="Drag to reorder"
        >
          <svg className="w-3 h-3 text-gray-400 group-hover/drag:text-gray-600 transition-colors duration-150" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>
      </div>

      {/* Asset Info */}
      <div className="text-left">
        <div className="font-medium text-gray-900">{asset.name}</div>
        {asset.symbol && (
          <div className="text-xs text-gray-500">{asset.symbol}</div>
        )}
      </div>

      {/* IRR */}
      <div className={`text-right text-sm font-medium ${
        totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {formatPercent(totalReturnPercent)}
      </div>

      {/* Cost Basis */}
      <div className="text-right text-sm font-medium text-gray-900">
        {formatCurrency(asset.costBasis)}
      </div>

      {/* Value */}
      <div className="text-right text-sm font-medium text-gray-900">
        <div className="flex items-center justify-end space-x-1">
          {getPerformanceIcon(dayChange)}
          <span>{formatCurrency(asset.currentValue)}</span>
        </div>
      </div>

      {/* Actions */}
      {isAuthenticated && (
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openPopup(asset.id, e);
            }}
            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors"
            title="More options"
            type="button"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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
      className={`transition-all duration-200 ease-in-out ${
        isOver 
          ? 'h-12 bg-blue-50 border-2 border-dashed border-blue-300 mx-2 rounded-lg flex items-center justify-center' 
          : 'h-1 bg-transparent'
      }`}
    >
      {isOver && (
        <div className="text-blue-600 text-sm font-medium opacity-70">
          Drop asset here
        </div>
      )}
    </div>
  );
};

// Top Drop Zone Component
interface TopDropZoneProps {
  sectionId?: string;
}

const TopDropZone: React.FC<TopDropZoneProps> = ({ sectionId }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `top-${sectionId}`,
    data: {
      type: 'top-zone',
      sectionId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-200 ease-in-out ${
        isOver 
          ? 'h-12 bg-blue-50 border-2 border-dashed border-blue-300 mx-2 rounded-lg flex items-center justify-center' 
          : 'h-2 bg-transparent'
      }`}
    >
      {isOver && (
        <div className="text-blue-600 text-sm font-medium opacity-70">
          Drop asset here
        </div>
      )}
    </div>
  );
};

// Bottom Drop Zone Component
interface BottomDropZoneProps {
  sectionId?: string;
}

const BottomDropZone: React.FC<BottomDropZoneProps> = ({ sectionId }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `bottom-${sectionId}`,
    data: {
      type: 'bottom-zone',
      sectionId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-200 ease-in-out ${
        isOver 
          ? 'h-12 bg-blue-50 border-2 border-dashed border-blue-300 mx-2 rounded-lg flex items-center justify-center' 
          : 'h-2 bg-transparent'
      }`}
    >
      {isOver && (
        <div className="text-blue-600 text-sm font-medium opacity-70">
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
  position: { top: number; left: number };
}

const PopupMenu: React.FC<PopupMenuProps> = ({ isOpen, onClose, onEdit, onDelete, position }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[160px]"
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
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
        type="button"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Delete</span>
      </button>
    </div>
  );
};
