"use client";

import React, { useState } from 'react';
import { CreateAssetInput } from '@/lib/firebase/types';
import CurrencyInput from '@/components/CurrencyInput';

interface CashFormProps {
  onSubmit: (asset: CreateAssetInput) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

export default function CashForm({ onSubmit, onBack, loading = false }: CashFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    currentValue: 0,
    currency: 'USD',
    accountType: '',
    institution: '',
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
      newErrors.name = 'Asset name is required';
    }

    if (formData.currentValue <= 0) {
      newErrors.currentValue = 'Value must be greater than 0';
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
        type: 'cash',
        currency: formData.currency,
        quantity: 1, // Cash is always quantity 1
        currentPrice: formData.currentValue,
        currentValue: formData.currentValue,
        costBasis: formData.currentValue, // For cash, cost basis equals current value
        sectionId: '', // Will be set by parent component
        metadata: {
          description: formData.description,
          tags: ['cash', 'liquid'],
          customFields: {
            accountType: formData.accountType,
            institution: formData.institution,
          },
        },
      };

      await onSubmit(assetData);
    } catch (error) {
      console.error('Error creating cash asset:', error);
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
          <h2 className="text-xl font-semibold text-gray-900">Add Cash</h2>
          <p className="text-sm text-gray-500">Enter your cash and cash equivalent details</p>
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
            placeholder="e.g., Emergency Fund, Checking Account"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Current Value */}
        <div>
          <CurrencyInput
            value={formData.currentValue}
            onChange={handleValueChange}
            label="Current Value *"
            placeholder="Enter the current cash amount"
            className="mb-2"
          />
          {errors.currentValue && (
            <p className="mt-1 text-sm text-red-600">{errors.currentValue}</p>
          )}
        </div>

        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Type
          </label>
          <select
            value={formData.accountType}
            onChange={(e) => handleInputChange('accountType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Select account type</option>
            <option value="checking">Checking Account</option>
            <option value="savings">Savings Account</option>
            <option value="money_market">Money Market</option>
            <option value="cd">Certificate of Deposit</option>
            <option value="cash">Physical Cash</option>
            <option value="other">Other</option>
          </select>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="e.g., Chase Bank, Wells Fargo, Cash"
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
            {loading ? 'Adding...' : 'Add Cash'}
          </button>
        </div>
      </form>
    </div>
  );
}
