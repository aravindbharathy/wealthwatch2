"use client";

import { useState } from 'react';
import { ConsolidatedAsset, ConsolidatedDebt, ConsolidatedSummary } from '@/lib/hooks/useConsolidatedAssets';
import CurrencyFormattedValue from '@/components/CurrencyFormattedValue';

interface ConsolidatedTableProps {
  assets: ConsolidatedAsset[];
  debts: ConsolidatedDebt[];
  summary: ConsolidatedSummary | null;
  loading: boolean;
}

export default function ConsolidatedTable({ assets, debts, summary, loading }: ConsolidatedTableProps) {
  const [showDebts, setShowDebts] = useState(false);


  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatAssetName = (asset: ConsolidatedAsset) => {
    if (asset.symbol && asset.exchange) {
      return `${asset.symbol}.${asset.exchange} • ${asset.name}`;
    } else if (asset.symbol) {
      return `${asset.symbol} • ${asset.name}`;
    }
    return asset.name;
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'stock_ticker':
        return '📈';
      case 'crypto_ticker':
        return '₿';
      case 'cash':
        return '💰';
      case 'home':
        return '🏠';
      case 'car':
        return '🚗';
      case 'precious_metals':
        return '🥇';
      default:
        return '💎';
    }
  };

  const getDebtIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
        return '💳';
      case 'mortgage':
        return '🏠';
      case 'auto_loan':
        return '🚗';
      case 'student_loan':
        return '🎓';
      case 'personal_loan':
        return '📋';
      default:
        return '📄';
    }
  };

  return (
    <div className="space-y-4">
      {/* Net Worth Summary */}
      {summary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Net Worth</h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                <CurrencyFormattedValue amount={summary.netWorth || 0} />
              </div>
              <div className={`text-sm ${(summary.dayChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(summary.dayChange || 0) >= 0 ? '+' : ''}<CurrencyFormattedValue amount={summary.dayChange || 0} />
                ({(summary.dayChangePercent || 0) >= 0 ? '+' : ''}{(summary.dayChangePercent || 0).toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assets Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Assets</h2>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                <CurrencyFormattedValue amount={summary?.totalAssets || 0} />
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {assets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No assets found
            </div>
          ) : (
            assets.map((asset) => (
              <div key={asset.id} className="px-4 py-2 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getAssetIcon(asset.type)}</span>
                    <div className="flex items-center space-x-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatAssetName(asset)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {asset.sheetName} • {asset.sectionName}
                        </div>
                      </div>
                      {/* Link icon for assets linked to accounts */}
                      {asset.isLinkedToAccount && (
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
                      {asset.isAccountSummary && (
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
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      <CurrencyFormattedValue amount={asset.currentValue || 0} />
                    </div>
                    {asset.dayChange !== undefined && (
                      <div className={`text-xs ${(asset.dayChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(asset.dayChange || 0) >= 0 ? '+' : ''}<CurrencyFormattedValue amount={asset.dayChange || 0} />
                        ({(asset.dayChangePercent || 0) >= 0 ? '+' : ''}{(asset.dayChangePercent || 0).toFixed(2)}%)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Debts Section */}
      {debts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Debts</h2>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-red-600">
                  <CurrencyFormattedValue amount={summary?.totalDebts || 0} />
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {debts.map((debt) => (
              <div key={debt.id} className="px-4 py-2 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getDebtIcon(debt.type)}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {debt.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {debt.institution} • {debt.interestRate.toFixed(2)}% APR
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600">
                      <CurrencyFormattedValue amount={debt.currentBalance || 0} />
                    </div>
                    <div className="text-xs text-gray-500">
                      Principal: <CurrencyFormattedValue amount={debt.principal || 0} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
