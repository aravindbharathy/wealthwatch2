"use client";

import React, { useState } from 'react';
import { CreateAssetInput } from '@/lib/firebase/types';
import CurrencyInput from '@/components/CurrencyInput';

interface CryptoFormProps {
  onSubmit: (asset: CreateAssetInput) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

export default function CryptoForm({ onSubmit, onBack, loading = false }: CryptoFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    exchange: '',
    quantity: 0,
    costBasis: 0,
    costBasisCurrency: 'USD',
    walletAddress: '',
    blockchain: '',
    description: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleCostBasisChange = (value: number, currency: string) => {
    handleInputChange('costBasis', value);
    handleInputChange('costBasisCurrency', currency);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    }

    if (!formData.exchange.trim()) {
      newErrors.exchange = 'Exchange is required';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.costBasis < 0) {
      newErrors.costBasis = 'Cost basis cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // For crypto, we'll use the cost basis as current value for now
      // In the future, this could be updated with real-time prices
      const currentValue = formData.costBasis;

      const assetData: CreateAssetInput = {
        name: formData.name,
        type: 'crypto_ticker',
        symbol: formData.symbol.toUpperCase(),
        exchange: formData.exchange,
        currency: 'USD', // Crypto values are typically tracked in USD
        quantity: formData.quantity,
        currentPrice: currentValue / formData.quantity, // Price per unit
        currentValue: currentValue,
        costBasis: formData.costBasis,
        sectionId: '', // Will be set by parent component
        metadata: {
          description: formData.description,
          tags: ['crypto', 'digital'],
          customFields: {
            walletAddress: formData.walletAddress,
            blockchain: formData.blockchain,
            costBasisCurrency: formData.costBasisCurrency,
          },
        },
      };

      await onSubmit(assetData);
    } catch (error) {
      console.error('Error creating crypto asset:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Add Crypto</h2>
          <p className="text-sm text-gray-500">Enter your cryptocurrency details</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asset Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Bitcoin, Ethereum, Dogecoin"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Symbol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Symbol *
          </label>
          <input
            type="text"
            value={formData.symbol}
            onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              errors.symbol ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., BTC, ETH, DOGE"
          />
          {errors.symbol && (
            <p className="mt-1 text-sm text-red-600">{errors.symbol}</p>
          )}
        </div>

        {/* Exchange */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exchange *
          </label>
          <select
            value={formData.exchange}
            onChange={(e) => handleInputChange('exchange', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              errors.exchange ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select exchange</option>
            <option value="Binance">Binance</option>
            <option value="Coinbase">Coinbase</option>
            <option value="Kraken">Kraken</option>
            <option value="KuCoin">KuCoin</option>
            <option value="Huobi">Huobi</option>
            <option value="Bybit">Bybit</option>
            <option value="OKX">OKX</option>
            <option value="Crypto.com">Crypto.com</option>
            <option value="Gemini">Gemini</option>
            <option value="Bitfinex">Bitfinex</option>
            <option value="Other">Other</option>
          </select>
          {errors.exchange && (
            <p className="mt-1 text-sm text-red-600">{errors.exchange}</p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity *
          </label>
          <input
            type="number"
            min="0"
            step="0.00000001"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              errors.quantity ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter quantity"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
          )}
        </div>

        {/* Cost Basis */}
        <div>
          <CurrencyInput
            value={formData.costBasis}
            onChange={handleCostBasisChange}
            label="Cost Basis (Optional)"
            placeholder="Enter total amount invested"
            className="mb-2"
          />
          {errors.costBasis && (
            <p className="mt-1 text-sm text-red-600">{errors.costBasis}</p>
          )}
        </div>

        {/* Wallet Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Wallet Address
          </label>
          <input
            type="text"
            value={formData.walletAddress}
            onChange={(e) => handleInputChange('walletAddress', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="e.g., 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
          />
        </div>

        {/* Blockchain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Blockchain
          </label>
          <select
            value={formData.blockchain}
            onChange={(e) => handleInputChange('blockchain', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Select blockchain</option>
            <option value="Bitcoin">Bitcoin</option>
            <option value="Ethereum">Ethereum</option>
            <option value="Binance Smart Chain">Binance Smart Chain</option>
            <option value="Polygon">Polygon</option>
            <option value="Solana">Solana</option>
            <option value="Cardano">Cardano</option>
            <option value="Polkadot">Polkadot</option>
            <option value="Avalanche">Avalanche</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Optional description or notes"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Crypto'}
          </button>
        </div>
      </form>
    </div>
  );
}
