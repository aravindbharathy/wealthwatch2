"use client";

import { Asset } from '@/lib/firebase/types';

interface AssetTableProps {
  assets: Asset[];
  onEditAsset: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onReorderAssets?: (assetIds: string[]) => void;
  loading?: boolean;
  isAuthenticated?: boolean;
}

export default function AssetTable({
  assets,
  onEditAsset,
  onDeleteAsset,
  onReorderAssets,
  loading = false,
  isAuthenticated = true,
}: AssetTableProps) {
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
          <div key={i} className="flex items-center py-3 border-b border-gray-100">
            <div className="flex items-center space-x-4 w-48">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="flex items-center space-x-8 flex-1">
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
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
    <div className="space-y-1">
      {/* Table Header */}
      <div className="flex items-center py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
        <div className="flex items-center space-x-4 w-48">
          <div className="w-4"></div>
          <div className="w-32">ASSET</div>
        </div>
        <div className="flex items-center space-x-8 flex-1">
          <div className="w-20 text-center">IRR</div>
          <div className="w-20 text-center">COST BASIS</div>
          <div className="w-20 text-center">VALUE</div>
        </div>
      </div>

      {/* Asset Rows */}
      {assets.map((asset) => {
        const totalReturnPercent = asset.costBasis > 0 ? 
          ((asset.currentValue - asset.costBasis) / asset.costBasis) * 100 : 0;
        const dayChange = asset.performance?.dayChange || 0;

        return (
          <div
            key={asset.id}
            className="flex items-center py-3 px-4 hover:bg-gray-50 group"
          >
            <div className="flex items-center space-x-4 w-48">
              {/* Drag Handle */}
              <div className="w-4 flex justify-center">
                <svg className="w-3 h-3 text-gray-400 cursor-move" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                </svg>
              </div>

              {/* Asset Info */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div>
                  <div className="font-medium text-gray-900">{asset.name}</div>
                  {asset.symbol && (
                    <div className="text-xs text-gray-500">{asset.symbol}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-8 flex-1">
              {/* IRR */}
              <div className={`w-20 text-center text-sm font-medium ${
                totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercent(totalReturnPercent)}
              </div>

              {/* Cost Basis */}
              <div className="w-20 text-center text-sm font-medium text-gray-900">
                {formatCurrency(asset.costBasis)}
              </div>

              {/* Value */}
              <div className="flex items-center justify-center space-x-2 w-20">
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(asset.currentValue)}
                </div>
                {getPerformanceIcon(dayChange)}
              </div>

              {/* Actions */}
              {isAuthenticated && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                  <button
                    onClick={() => onEditAsset(asset.id)}
                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                    title="Edit asset"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteAsset(asset.id)}
                    className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                    title="Delete asset"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
