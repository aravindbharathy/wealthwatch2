'use client';

import { useState } from 'react';
import { clearPlaidData, clearLinkedAssets, clearAllAssets } from '@/lib/firebase/clearPlaidData';
import { useAuthNew } from '@/lib/contexts/AuthContext';

interface DebugPanelProps {
  userId: string;
}

export default function DebugPanel({ userId }: DebugPanelProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [isClearingLinked, setIsClearingLinked] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { user } = useAuthNew();

  const handleClearPlaidData = async () => {
    if (!confirm('⚠️ Are you sure you want to clear ALL Plaid-imported data? This action cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    setLastResult(null);

    try {
      const result = await clearPlaidData(userId);
      setLastResult(result);
      
      if (result.success) {
        alert(`✅ Successfully cleared ${result.totalDeleted} Plaid items!\n- Total Assets: ${result.deletedAssets}\n- Holdings: ${result.deletedHoldings}\n- Accounts: ${result.deletedAccounts}`);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        alert(`❌ Error clearing Plaid data: ${result.error}`);
      }
    } catch (error) {
      console.error('Debug panel error:', error);
      alert('❌ Unexpected error occurred');
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearLinkedAssets = async () => {
    if (!confirm('🔗 Are you sure you want to clear ALL linked assets (accountMapping.isLinked = true)? This action cannot be undone.')) {
      return;
    }

    setIsClearingLinked(true);
    setLastResult(null);

    try {
      const result = await clearLinkedAssets(userId);
      setLastResult(result);
      
      if (result.success) {
        alert(`✅ Successfully cleared ${result.totalDeleted} linked assets!`);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        alert(`❌ Error clearing linked assets: ${result.error}`);
      }
    } catch (error) {
      console.error('Debug panel linked assets error:', error);
      alert('❌ Unexpected error occurred');
    } finally {
      setIsClearingLinked(false);
    }
  };

  const handleClearAllAssets = async () => {
    if (!confirm('⚠️ NUCLEAR OPTION: This will delete ALL assets in your account. This action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    if (!confirm('🚨 FINAL WARNING: ALL assets will be permanently deleted. This is your last chance to cancel. Continue?')) {
      return;
    }

    setIsClearingAll(true);
    setLastResult(null);

    try {
      const result = await clearAllAssets(userId);
      setLastResult(result);
      
      if (result.success) {
        alert(`✅ Successfully cleared ALL ${result.totalDeleted} assets!`);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        alert(`❌ Error clearing all assets: ${result.error}`);
      }
    } catch (error) {
      console.error('Debug panel clear all assets error:', error);
      alert('❌ Unexpected error occurred');
    } finally {
      setIsClearingAll(false);
    }
  };


  // Only show in development or for demo users
  if (process.env.NODE_ENV === 'production' && !userId.includes('demo')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-2xl">🐛</span>
          <h3 className="font-semibold text-red-800">Debug Panel</h3>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={handleClearPlaidData}
            disabled={isClearing}
            className="w-full px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isClearing ? '🧹 Clearing...' : '🗑️ Clear All Plaid Data'}
          </button>
          
          <button
            onClick={handleClearLinkedAssets}
            disabled={isClearingLinked}
            className="w-full px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isClearingLinked ? '🔗 Clearing...' : '🔗 Clear Linked Assets'}
          </button>
          
          <button
            onClick={handleClearAllAssets}
            disabled={isClearingAll}
            className="w-full px-3 py-2 bg-red-800 text-white text-sm font-medium rounded-md hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isClearingAll ? '💥 Clearing...' : '💥 Clear ALL Assets'}
          </button>
          
          {lastResult && (
            <div className="text-xs text-gray-600 bg-white p-2 rounded border">
              <div className="font-medium">Last Result:</div>
              <div>✅ Success: {lastResult.success ? 'Yes' : 'No'}</div>
              {lastResult.success && (
                <>
                  {lastResult.deletedLinkedAssets !== undefined ? (
                    // Linked assets result
                    <>
                      <div>🔗 Linked assets deleted: {lastResult.deletedLinkedAssets}</div>
                      <div>📈 Total deleted: {lastResult.totalDeleted}</div>
                    </>
                  ) : (
                    // Plaid data result
                    <>
                      <div>📊 Total assets deleted: {lastResult.deletedAssets}</div>
                      <div>📈 Holdings: {lastResult.deletedHoldings}</div>
                      <div>🏛️ Accounts deleted: {lastResult.deletedAccounts}</div>
                      <div>📈 Total deleted: {lastResult.totalDeleted}</div>
                    </>
                  )}
                </>
              )}
              {lastResult.error && (
                <div className="text-red-600">❌ Error: {lastResult.error}</div>
              )}
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          <div>🔧 Debug tools for clearing</div>
          <div>Plaid data, linked assets & ALL assets</div>
        </div>
      </div>
    </div>
  );
}
