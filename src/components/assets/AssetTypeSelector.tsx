"use client";

import React from 'react';
import { Asset } from '@/lib/firebase/types';
import { ASSET_TYPES } from '@/lib/assetTypes';

interface AssetTypeSelectorProps {
  onSelectType: (type: Asset['type']) => void;
  onClose: () => void;
}

// Modern SVG Icons
const ModernIcons = {
  banks: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  stock: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  crypto: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  ),
  wallet: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  portfolio: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  home: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  car: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7H6a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V9a2 2 0 00-2-2z" />
    </svg>
  ),
  metals: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  domain: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
    </svg>
  ),
  ai: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  manual: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
};

export default function AssetTypeSelector({ onSelectType, onClose }: AssetTypeSelectorProps) {
  const handleTypeSelect = (type: Asset['type']) => {
    onSelectType(type);
  };

  const assetOptions = [
    {
      type: 'account' as Asset['type'],
      label: 'Banks & Brokerages',
      icon: ModernIcons.banks,
      description: 'Bank accounts, brokerage accounts, and investment accounts'
    },
    {
      type: 'equity' as Asset['type'],
      label: 'Stocks & Equity',
      icon: ModernIcons.stock,
      description: 'Individual stocks and equity securities'
    },
    {
      type: 'etf' as Asset['type'],
      label: 'ETFs',
      icon: ModernIcons.portfolio,
      description: 'Exchange-traded funds'
    },
    {
      type: 'mutual fund' as Asset['type'],
      label: 'Mutual Funds',
      icon: ModernIcons.portfolio,
      description: 'Mutual funds and investment funds'
    },
    {
      type: 'fixed income' as Asset['type'],
      label: 'Fixed Income',
      icon: ModernIcons.banks,
      description: 'Bonds and fixed income securities'
    },
    {
      type: 'derivative' as Asset['type'],
      label: 'Derivatives',
      icon: ModernIcons.ai,
      description: 'Options, warrants, and other derivatives'
    },
    {
      type: 'cryptocurrency' as Asset['type'],
      label: 'Cryptocurrency',
      icon: ModernIcons.crypto,
      description: 'Digital currencies and crypto assets'
    },
    {
      type: 'cash' as Asset['type'],
      label: 'Cash',
      icon: ModernIcons.banks,
      description: 'Cash and cash equivalents'
    },
    {
      type: 'loan' as Asset['type'],
      label: 'Loans',
      icon: ModernIcons.banks,
      description: 'Loans and loan receivables'
    },
    {
      type: 'other' as Asset['type'],
      label: 'Other Assets',
      icon: ModernIcons.manual,
      description: 'Any other asset type'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Add Asset</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Modern Grid Layout */}
      <div className="grid grid-cols-2 gap-4">
        {assetOptions.map((option, index) => (
          <button
            key={`${option.type}-${index}`}
            onClick={() => handleTypeSelect(option.type)}
            className="group p-6 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="text-gray-600 group-hover:text-gray-900 transition-colors">
                {option.icon}
              </div>
              <div>
                <div className="font-medium text-gray-900 group-hover:text-gray-900">
                  {option.label}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
