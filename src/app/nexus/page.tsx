"use client";

import { useAuth } from '@/lib/hooks/useAuth';
import { useConsolidatedAssets } from '@/lib/hooks/useConsolidatedAssets';
import ConsolidatedTable from '@/components/nexus/ConsolidatedTable';
import NexusSidebar from '@/components/nexus/NexusSidebar';

export default function NexusPage() {
  const { user } = useAuth();
  const { consolidatedAssets, consolidatedDebts, summary, loading, error } = useConsolidatedAssets(user?.uid || '');

  if (!user) {
    return (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-blue-900">Nexus</h2>
                <p className="text-sm text-blue-800">
                  Track relationships between assets and debts, and get insights into your complete financial picture.
                </p>
              </div>
            </div>
          </div>

          {/* Sign In Prompt */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Please sign in to view your consolidated financial overview and track relationships between your assets and debts.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Placeholder for unauthenticated users */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Portfolio Insights</h3>
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">Sign in to view insights</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-blue-900">Nexus</h2>
                <p className="text-sm text-blue-800">
                  Track relationships between assets and debts, and get insights into your complete financial picture.
                </p>
              </div>
            </div>
          </div>

          {/* Error State */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-red-900">Error Loading Data</h3>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
          </div>
        </div>

        {/* Right Sidebar - Placeholder for error state */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Portfolio Insights</h3>
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">Unable to load insights</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-blue-900">Nexus</h2>
              <p className="text-sm text-blue-800">
                Track relationships between assets and debts, and get insights into your complete financial picture.
              </p>
            </div>
          </div>
        </div>

        {/* Consolidated Table */}
        <ConsolidatedTable 
          assets={consolidatedAssets}
          debts={consolidatedDebts}
          summary={summary}
          loading={loading}
        />
      </div>

      {/* Right Sidebar */}
      <NexusSidebar 
        summary={summary}
        loading={loading}
      />
    </div>
  );
}
