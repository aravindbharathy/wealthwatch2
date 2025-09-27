"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Asset } from '@/lib/firebase/types';
import CurrencyFormattedValue from '@/components/CurrencyFormattedValue';

interface AssetDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
}

type TabType = 'HOLDING' | 'VALUE' | 'RETURNS' | 'REPORTING' | 'ASSORTED' | 'NOTES' | 'DOCUMENTS';

export default function AssetDetailPopup({ isOpen, onClose, asset }: AssetDetailPopupProps) {
  const [activeTab, setActiveTab] = useState<TabType>('HOLDING');
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !asset) return null;

  const tabs: TabType[] = ['HOLDING', 'VALUE', 'RETURNS', 'REPORTING', 'ASSORTED', 'NOTES', 'DOCUMENTS'];

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getPerformanceIcon = (change: number) => {
    if (change > 0) {
      return (
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (change < 0) {
      return (
        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'HOLDING':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{asset.symbol || 'N/A'}</h3>
                  <p className="text-sm text-gray-600">{asset.name}</p>
                  <p className="text-xs text-gray-500">{asset.exchange || 'NASDAQ'}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {asset.currentPrice ? `${asset.currency} ${asset.currentPrice.toFixed(2)}` : 'N/A'}
                  </div>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    {getPerformanceIcon(asset.performance?.dayChange || 0)}
                    <span className={`text-sm font-medium ${
                      (asset.performance?.dayChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {asset.performance?.dayChange ? formatPercent(asset.performance.dayChange) : '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  defaultValue={asset.quantity?.toString() || "100"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 'VALUE':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Current Value</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Value:</span>
                  <CurrencyFormattedValue 
                    amount={asset.currentValue} 
                    fromCurrency={asset.currency}
                    className="text-sm font-medium"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Cost Basis:</span>
                  <CurrencyFormattedValue 
                    amount={asset.costBasis || 0} 
                    fromCurrency={asset.currency}
                    className="text-sm font-medium"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Gain/Loss:</span>
                  <span className="text-sm font-medium text-green-600">
                    <CurrencyFormattedValue 
                      amount={(asset.currentValue || 0) - (asset.costBasis || 0)} 
                      fromCurrency={asset.currency}
                      className="text-sm font-medium"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'RETURNS':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Performance Metrics</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Return:</span>
                  <span className="text-sm font-medium text-green-600">+15.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Annualized Return:</span>
                  <span className="text-sm font-medium text-green-600">+8.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Volatility:</span>
                  <span className="text-sm font-medium">24.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Sharpe Ratio:</span>
                  <span className="text-sm font-medium">1.2</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'REPORTING':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Tax Reporting</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Taxable Gain:</span>
                  <span className="text-sm font-medium text-green-600">$2,546.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Holding Period:</span>
                  <span className="text-sm font-medium">Long-term</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tax Rate:</span>
                  <span className="text-sm font-medium">15%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Estimated Tax:</span>
                  <span className="text-sm font-medium">$381.90</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ASSORTED':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Additional Information</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Sector:</span>
                  <span className="text-sm font-medium">Technology</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Market Cap:</span>
                  <span className="text-sm font-medium">$4.1T</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">P/E Ratio:</span>
                  <span className="text-sm font-medium">28.5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Dividend Yield:</span>
                  <span className="text-sm font-medium">0.4%</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'NOTES':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                placeholder="Add your notes about this asset..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                defaultValue="This is a core holding in my technology portfolio. Strong fundamentals and consistent growth."
              />
            </div>
          </div>
        );

      case 'DOCUMENTS':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Attached Documents</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Purchase Receipt.pdf</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Research Report.pdf</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white shadow-xl max-w-4xl w-full h-[75vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{asset.name}</h2>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-2xl font-bold text-gray-900">
                <CurrencyFormattedValue 
                  amount={asset.currentValue} 
                  fromCurrency={asset.currency}
                  className="text-2xl font-bold"
                />
              </span>
              {asset.costBasis !== undefined && asset.costBasis > 0 && (
                <span className={`text-lg font-medium ${
                  ((asset.currentValue - asset.costBasis) / asset.costBasis) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  IRR: {formatPercent(((asset.currentValue - asset.costBasis) / asset.costBasis) * 100)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {renderTabContent()}
        </div>

      </div>
    </div>
  );
}
