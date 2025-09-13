"use client";

import React, { useState } from 'react';
import { CreateAssetInput } from '@/lib/firebase/types';
import CurrencyInput from '@/components/CurrencyInput';

interface CryptoExchangeFormProps {
  onSubmit: (asset: CreateAssetInput) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

export default function CryptoExchangeForm({ onSubmit, onBack, loading = false }: CryptoExchangeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    exchange: '',
    currentValue: 0,
    currency: 'USD',
    exchangeType: '',
    accountId: '',
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

  const handleValueChange = (value: number, currency: string) => {
    handleInputChange('currentValue', value);
    handleInputChange('currency', currency);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (!formData.exchange.trim()) {
      newErrors.exchange = 'Exchange is required';
    }

    if (formData.currentValue <= 0) {
      newErrors.currentValue = 'Balance must be greater than 0';
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
      const assetData: CreateAssetInput = {
        name: formData.name,
        type: 'crypto_exchange_wallet',
        exchange: formData.exchange,
        currency: formData.currency,
        quantity: 1, // Exchange accounts are always quantity 1
        currentPrice: formData.currentValue,
        currentValue: formData.currentValue,
        costBasis: formData.currentValue, // For exchange accounts, cost basis equals current value
        sectionId: '', // Will be set by parent component
        metadata: {
          description: formData.description,
          tags: ['crypto', 'exchange'],
          customFields: {
            exchangeType: formData.exchangeType,
            accountId: formData.accountId,
          },
        },
      };

      await onSubmit(assetData);
    } catch (error) {
      console.error('Error creating crypto exchange asset:', error);
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
          <h2 className="text-xl font-semibold text-gray-900">Add Crypto Exchange</h2>
          <p className="text-sm text-gray-500">Enter your crypto exchange account details</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Binance Main Account, Coinbase Pro"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
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
            <option value="Coinbase Pro">Coinbase Pro</option>
            <option value="Kraken">Kraken</option>
            <option value="KuCoin">KuCoin</option>
            <option value="Huobi">Huobi</option>
            <option value="Bybit">Bybit</option>
            <option value="OKX">OKX</option>
            <option value="Crypto.com">Crypto.com</option>
            <option value="Gemini">Gemini</option>
            <option value="Bitfinex">Bitfinex</option>
            <option value="MetaMask">MetaMask</option>
            <option value="Trust Wallet">Trust Wallet</option>
            <option value="Other">Other</option>
          </select>
          {errors.exchange && (
            <p className="mt-1 text-sm text-red-600">{errors.exchange}</p>
          )}
        </div>

        {/* Current Balance */}
        <div>
          <CurrencyInput
            value={formData.currentValue}
            onChange={handleValueChange}
            label="Current Balance *"
            placeholder="Enter the current total balance"
            className="mb-2"
          />
          {errors.currentValue && (
            <p className="mt-1 text-sm text-red-600">{errors.currentValue}</p>
          )}
        </div>

        {/* Exchange Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exchange Type
          </label>
          <select
            value={formData.exchangeType}
            onChange={(e) => handleInputChange('exchangeType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Select type</option>
            <option value="centralized">Centralized Exchange (CEX)</option>
            <option value="decentralized">Decentralized Exchange (DEX)</option>
            <option value="wallet">Crypto Wallet</option>
            <option value="defi">DeFi Protocol</option>
            <option value="staking">Staking Platform</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Account ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account ID / Username
          </label>
          <input
            type="text"
            value={formData.accountId}
            onChange={(e) => handleInputChange('accountId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="e.g., username, account ID, or wallet address"
          />
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
            {loading ? 'Adding...' : 'Add Exchange'}
          </button>
        </div>
      </form>
    </div>
  );
}
