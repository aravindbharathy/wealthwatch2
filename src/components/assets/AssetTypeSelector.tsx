"use client";

import React from 'react';
import { Asset } from '@/lib/firebase/types';
import { ASSET_TYPES, ASSET_CATEGORIES } from '@/lib/assetTypes';

interface AssetTypeSelectorProps {
  onSelectType: (type: Asset['type']) => void;
  onClose: () => void;
}

export default function AssetTypeSelector({ onSelectType, onClose }: AssetTypeSelectorProps) {
  const handleTypeSelect = (type: Asset['type']) => {
    onSelectType(type);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Add Asset</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Asset Type Grid */}
      <div className="space-y-6">
        {/* Financial Assets */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Financial Assets</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Stock Tickers */}
            <button
              onClick={() => handleTypeSelect('stock_ticker')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{ASSET_TYPES.stock_ticker.icon}</div>
                <div>
                  <div className="font-medium text-gray-900">{ASSET_TYPES.stock_ticker.label}</div>
                  <div className="text-xs text-gray-500">{ASSET_TYPES.stock_ticker.description}</div>
                </div>
              </div>
            </button>

            {/* Cash */}
            <button
              onClick={() => handleTypeSelect('cash')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{ASSET_TYPES.cash.icon}</div>
                <div>
                  <div className="font-medium text-gray-900">{ASSET_TYPES.cash.label}</div>
                  <div className="text-xs text-gray-500">{ASSET_TYPES.cash.description}</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Digital Assets */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Digital Assets</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Crypto Tickers */}
            <button
              onClick={() => handleTypeSelect('crypto_ticker')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{ASSET_TYPES.crypto_ticker.icon}</div>
                <div>
                  <div className="font-medium text-gray-900">{ASSET_TYPES.crypto_ticker.label}</div>
                  <div className="text-xs text-gray-500">{ASSET_TYPES.crypto_ticker.description}</div>
                </div>
              </div>
            </button>

            {/* Crypto Exchanges & Wallets */}
            <button
              onClick={() => handleTypeSelect('crypto_exchange_wallet')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{ASSET_TYPES.crypto_exchange_wallet.icon}</div>
                <div>
                  <div className="font-medium text-gray-900">{ASSET_TYPES.crypto_exchange_wallet.label}</div>
                  <div className="text-xs text-gray-500">{ASSET_TYPES.crypto_exchange_wallet.description}</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Physical Assets */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Physical Assets</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Homes */}
            <button
              onClick={() => handleTypeSelect('home')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{ASSET_TYPES.home.icon}</div>
                <div>
                  <div className="font-medium text-gray-900">{ASSET_TYPES.home.label}</div>
                  <div className="text-xs text-gray-500">{ASSET_TYPES.home.description}</div>
                </div>
              </div>
            </button>

            {/* Cars */}
            <button
              onClick={() => handleTypeSelect('car')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{ASSET_TYPES.car.icon}</div>
                <div>
                  <div className="font-medium text-gray-900">{ASSET_TYPES.car.label}</div>
                  <div className="text-xs text-gray-500">{ASSET_TYPES.car.description}</div>
                </div>
              </div>
            </button>

            {/* Precious Metals */}
            <button
              onClick={() => handleTypeSelect('precious_metals')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{ASSET_TYPES.precious_metals.icon}</div>
                <div>
                  <div className="font-medium text-gray-900">{ASSET_TYPES.precious_metals.label}</div>
                  <div className="text-xs text-gray-500">{ASSET_TYPES.precious_metals.description}</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Generic Assets */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Generic</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Manual Assets */}
            <button
              onClick={() => handleTypeSelect('generic_asset')}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{ASSET_TYPES.generic_asset.icon}</div>
                <div>
                  <div className="font-medium text-gray-900">{ASSET_TYPES.generic_asset.label}</div>
                  <div className="text-xs text-gray-500">{ASSET_TYPES.generic_asset.description}</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Pro Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-blue-800">
              <strong>Pro tip:</strong> You can enter asset values in any currency code. E.g. EUR 100, GBP 100, INR 100, AUD 100 etc.{' '}
              <button className="text-blue-600 hover:text-blue-800 underline">
                Know More
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
