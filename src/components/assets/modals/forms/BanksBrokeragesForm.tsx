"use client";

import React, { useState } from 'react';
import { Asset, CreateAssetInput } from '@/lib/firebase/types';
import CurrencyInput from '@/components/CurrencyInput';
import CurrencyPreferenceSelector from '@/components/CurrencyPreferenceSelector';
import { AccountService } from '@/lib/services/accountService';

interface BanksBrokeragesFormProps {
  onSubmit: (asset: CreateAssetInput) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
  initialData?: Partial<Asset>;
  sectionId: string;
  userId: string;
}

export default function BanksBrokeragesForm({ onSubmit, onBack, loading = false, initialData, sectionId, userId }: BanksBrokeragesFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    currentValue: initialData?.currentValue || 0,
    currency: initialData?.currency || 'USD',
    institution: initialData?.institution || '',
    accountType: initialData?.accountType || '',
    accountNumber: initialData?.accountNumber || '',
    description: initialData?.description || '',
    costBasis: initialData?.costBasis || 0,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Plaid integration state
  const [plaidMode, setPlaidMode] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePlaidSync = async () => {
    if (!accessToken.trim()) {
      setSyncError('Please enter a valid access token');
      return;
    }

    setSyncing(true);
    setSyncError('');
    setSyncSuccess(false);

    try {
      const result = await AccountService.syncPlaidAccount(accessToken, sectionId, userId);
      
      // Submit each account as a separate asset
      for (const accountAsset of result.accountAssets) {
        await onSubmit(accountAsset);
      }
      
      setSyncSuccess(true);
      setSyncError('');
      
      // Reset form after successful sync
      setTimeout(() => {
        setPlaidMode(false);
        setAccessToken('');
        setSyncSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Plaid sync error:', error);
      setSyncError(error instanceof Error ? error.message : 'Failed to sync with Plaid');
      setSyncSuccess(false);
    } finally {
      setSyncing(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (formData.currentValue <= 0) {
      newErrors.currentValue = 'Current value must be greater than 0';
    }

    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const assetData: CreateAssetInput = {
      type: 'banks_brokerages',
      name: formData.name.trim(),
      currentValue: formData.currentValue,
      currency: formData.currency,
      costBasis: formData.costBasis,
      quantity: 1, // Bank accounts typically have quantity of 1
      sectionId: '', // Will be set by the modal
      metadata: {
        institution: formData.institution.trim() || undefined,
        accountType: formData.accountType.trim() || undefined,
        accountNumber: formData.accountNumber.trim() || undefined,
        description: formData.description.trim() || undefined,
        tags: [],
        customFields: {}
      }
    };

    await onSubmit(assetData);
  };

  const accountTypes = [
    'Checking Account',
    'Savings Account',
    'Money Market Account',
    'Brokerage Account',
    'Investment Account',
    'Retirement Account (401k)',
    'Retirement Account (IRA)',
    'Retirement Account (Roth IRA)',
    'Certificate of Deposit (CD)',
    'High-Yield Savings',
    'Other'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Add Bank/Brokerage Account</h3>
        <button
          type="button"
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Plaid Integration Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔗</span>
            <h4 className="font-medium text-blue-900">Connect with Plaid</h4>
          </div>
          {!plaidMode && (
            <button
              type="button"
              onClick={() => setPlaidMode(true)}
              className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Get Data from Plaid
            </button>
          )}
        </div>
        
        {plaidMode && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Plaid Access Token (Sandbox)
              </label>
              <input
                type="text"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="access-sandbox-xxx"
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={syncing}
              />
              <p className="text-xs text-blue-600 mt-1">
                For testing, use: <code className="bg-blue-100 px-1 rounded">test-sandbox</code> or a real Plaid access token starting with <code className="bg-blue-100 px-1 rounded">access-sandbox-</code>
              </p>
            </div>
            
            {syncError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{syncError}</p>
              </div>
            )}
            
            {syncSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">✅ Successfully connected accounts! Each account will appear as a separate row in your section.</p>
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handlePlaidSync}
                disabled={!accessToken.trim() || syncing}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : 'Connect & Sync'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlaidMode(false);
                  setAccessToken('');
                  setSyncError('');
                  setSyncSuccess(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Account Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Chase Checking, Fidelity 401k"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Institution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Institution
          </label>
          <input
            type="text"
            value={formData.institution}
            onChange={(e) => handleInputChange('institution', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Chase Bank, Fidelity, Vanguard"
          />
        </div>

        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Type
          </label>
          <select
            value={formData.accountType}
            onChange={(e) => handleInputChange('accountType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select account type</option>
            {accountTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Number (Last 4 digits)
          </label>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) => handleInputChange('accountNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., ****1234"
            maxLength={8}
          />
        </div>

        {/* Current Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Value *
          </label>
          <CurrencyInput
            value={formData.currentValue}
            currency={formData.currency}
            onChange={(value) => handleInputChange('currentValue', value)}
            onCurrencyChange={(currency) => handleInputChange('currency', currency)}
            error={errors.currentValue}
          />
        </div>

        {/* Cost Basis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cost Basis (Initial Investment)
          </label>
          <CurrencyInput
            value={formData.costBasis}
            currency={formData.currency}
            onChange={(value) => handleInputChange('costBasis', value)}
            onCurrencyChange={(currency) => handleInputChange('currency', currency)}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Additional notes about this account..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Account'}
        </button>
      </div>
    </form>
  );
}
