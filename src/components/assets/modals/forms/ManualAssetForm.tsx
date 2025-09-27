"use client";

import React, { useState } from 'react';
import { CreateAssetInput, AssetType, AssetSubType } from '@/lib/firebase/types';
import CurrencyInput from '@/components/CurrencyInput';

interface ManualAssetFormProps {
  onSubmit: (asset: CreateAssetInput) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

// Asset type options for manual assets
const ASSET_TYPE_OPTIONS: { value: AssetType; label: string; subtypes?: AssetSubType[] }[] = [
  { value: 'cash', label: 'Cash', subtypes: ['cash'] },
  { value: 'equity', label: 'Equity', subtypes: ['common stock', 'preferred equity', 'depositary receipt'] },
  { value: 'etf', label: 'ETF', subtypes: ['etf'] },
  { value: 'mutual fund', label: 'Mutual Fund', subtypes: ['mutual fund', 'fund of funds', 'hedge fund', 'private equity fund'] },
  { value: 'fixed income', label: 'Fixed Income', subtypes: ['bond', 'bill', 'note', 'municipal bond', 'treasury inflation protected securities'] },
  { value: 'derivative', label: 'Derivative', subtypes: ['option', 'warrant', 'convertible bond', 'convertible equity'] },
  { value: 'cryptocurrency', label: 'Cryptocurrency', subtypes: ['cryptocurrency'] },
  { value: 'other', label: 'Other', subtypes: ['other'] },
];

export default function ManualAssetForm({ onSubmit, onBack, loading = false }: ManualAssetFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'other' as AssetType,
    subType: undefined as AssetSubType | undefined,
    currentValue: 0,
    currency: 'USD',
    category: '',
    tags: '',
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

  const handleTypeChange = (type: AssetType) => {
    setFormData(prev => ({
      ...prev,
      type,
      subType: undefined, // Reset subtype when type changes
    }));
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
      // Parse tags from comma-separated string
      const tagArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const assetData: CreateAssetInput = {
        name: formData.name,
        type: formData.type,
        subType: formData.subType || null, // Set to null if undefined
        currency: formData.currency,
        quantity: 1, // Manual assets are typically quantity 1
        currentPrice: formData.currentValue,
        currentValue: formData.currentValue,
        costBasis: formData.currentValue, // For manual assets, cost basis equals current value
        sectionId: '', // Will be set by parent component
        metadata: {
          description: formData.description,
          tags: tagArray,
          customFields: {
            category: formData.category,
            isManualAsset: true,
          },
        },
      };

      await onSubmit(assetData);
    } catch (error) {
      console.error('Error creating manual asset:', error);
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
          <h2 className="text-xl font-semibold text-gray-900">Add Manual Asset</h2>
          <p className="text-sm text-gray-500">Enter details for any other asset type</p>
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
            placeholder="e.g., Art Collection, Jewelry, Equipment"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Asset Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleTypeChange(e.target.value as AssetType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            {ASSET_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Asset Subtype */}
        {ASSET_TYPE_OPTIONS.find(opt => opt.value === formData.type)?.subtypes && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Subtype
            </label>
            <select
              value={formData.subType || ''}
              onChange={(e) => handleInputChange('subType', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Select subtype (optional)</option>
              {ASSET_TYPE_OPTIONS
                .find(opt => opt.value === formData.type)
                ?.subtypes?.map((subtype) => (
                  <option key={subtype} value={subtype}>
                    {subtype}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Current Value */}
        <div>
          <CurrencyInput
            value={formData.currentValue}
            onChange={handleValueChange}
            label="Current Value *"
            placeholder="Enter the current estimated value"
            className="mb-2"
          />
          {errors.currentValue && (
            <p className="mt-1 text-sm text-red-600">{errors.currentValue}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Select category</option>
            <option value="collectibles">Collectibles</option>
            <option value="jewelry">Jewelry</option>
            <option value="art">Art & Antiques</option>
            <option value="equipment">Equipment</option>
            <option value="furniture">Furniture</option>
            <option value="electronics">Electronics</option>
            <option value="books">Books & Media</option>
            <option value="clothing">Clothing & Accessories</option>
            <option value="sports">Sports & Recreation</option>
            <option value="tools">Tools</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => handleInputChange('tags', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="e.g., vintage, rare, antique (comma-separated)"
          />
          <p className="mt-1 text-xs text-gray-500">Separate multiple tags with commas</p>
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
            placeholder="Optional description, condition, or other details"
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
            {loading ? 'Adding...' : 'Add Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}
