"use client";

import { ConsolidatedSummary } from '@/lib/hooks/useConsolidatedAssets';
import CurrencyFormattedValue from '@/components/CurrencyFormattedValue';

interface NexusSidebarProps {
  summary: ConsolidatedSummary | null;
  loading: boolean;
}

export default function NexusSidebar({ summary, loading }: NexusSidebarProps) {
  if (loading) {
    return (
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 space-y-6">
      {/* Portfolio Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Portfolio Insights</h3>
        
        <div className="space-y-2">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900 mb-1">
              <CurrencyFormattedValue amount={summary?.totalAssets || 0} />
            </div>
            <div className="text-xs text-gray-600">Total Assets</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-red-600 mb-1">
              <CurrencyFormattedValue amount={summary?.totalDebts || 0} />
            </div>
            <div className="text-xs text-gray-600">Total Debts</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-lg font-bold text-blue-600 mb-1">
              <CurrencyFormattedValue amount={summary?.netWorth || 0} />
            </div>
            <div className="text-xs text-blue-600">Net Worth</div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Performance</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Return</span>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                <CurrencyFormattedValue amount={summary?.totalReturn || 0} />
              </div>
              <div className="text-xs text-gray-500">
                {(summary?.totalReturnPercent || 0).toFixed(2)}%
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Day Change</span>
            <div className="text-right">
              <div className={`text-sm font-medium ${(summary?.dayChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(summary?.dayChange || 0) >= 0 ? '+' : ''}<CurrencyFormattedValue amount={summary?.dayChange || 0} />
              </div>
              <div className={`text-xs ${(summary?.dayChangePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(summary?.dayChangePercent || 0) >= 0 ? '+' : ''}{(summary?.dayChangePercent || 0).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Asset Allocation</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Stocks</span>
            </div>
            <span className="text-sm font-medium text-gray-900">65%</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Crypto</span>
            </div>
            <span className="text-sm font-medium text-gray-900">20%</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Cash</span>
            </div>
            <span className="text-sm font-medium text-gray-900">10%</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Other</span>
            </div>
            <span className="text-sm font-medium text-gray-900">5%</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Actions</h3>
        
        <div className="space-y-3">
          <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Add Asset</div>
                <div className="text-xs text-gray-500">Track a new investment</div>
              </div>
            </div>
          </button>
          
          <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">View Reports</div>
                <div className="text-xs text-gray-500">Generate portfolio reports</div>
              </div>
            </div>
          </button>
          
          <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Portfolio Analysis</div>
                <div className="text-xs text-gray-500">Deep dive into performance</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
