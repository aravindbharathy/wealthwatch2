"use client";

import React, { useState } from 'react';
import { CreateAssetInput } from '@/lib/firebase/types';
import CurrencyInput from '@/components/CurrencyInput';

interface HomeFormProps {
  onSubmit: (asset: CreateAssetInput) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

export default function HomeForm({ onSubmit, onBack, loading = false }: HomeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    currentValue: 0,
    currency: 'USD',
    address: '',
    yearBuilt: '',
    squareFeet: '',
    propertyType: '',
    purchasePrice: 0,
    purchasePriceCurrency: 'USD',
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

  const handleCurrentValueChange = (value: number, currency: string) => {
    handleInputChange('currentValue', value);
    handleInputChange('currency', currency);
  };

  const handlePurchasePriceChange = (value: number, currency: string) => {
    handleInputChange('purchasePrice', value);
    handleInputChange('purchasePriceCurrency', currency);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Property name is required';
    }

    if (formData.currentValue <= 0) {
      newErrors.currentValue = 'Current value must be greater than 0';
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
        type: 'home',
        currency: formData.currency,
        quantity: 1, // Properties are always quantity 1
        currentPrice: formData.currentValue,
        currentValue: formData.currentValue,
        costBasis: formData.purchasePrice || formData.currentValue, // Use purchase price if available, otherwise current value
        sectionId: '', // Will be set by parent component
        metadata: {
          description: formData.description,
          tags: ['real-estate', 'property'],
          location: formData.address,
          year: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
          customFields: {
            address: formData.address,
            yearBuilt: formData.yearBuilt,
            squareFeet: formData.squareFeet,
            propertyType: formData.propertyType,
            purchasePrice: formData.purchasePrice,
            purchasePriceCurrency: formData.purchasePriceCurrency,
          },
        },
      };

      await onSubmit(assetData);
    } catch (error) {
      console.error('Error creating home asset:', error);
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
          <h2 className="text-xl font-semibold text-gray-900">Add Home</h2>
          <p className="text-sm text-gray-500">Enter your real estate property details</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Primary Residence, Investment Property"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Current Value */}
        <div>
          <CurrencyInput
            value={formData.currentValue}
            onChange={handleCurrentValueChange}
            label="Current Value *"
            placeholder="Enter the current estimated value"
            className="mb-2"
          />
          {errors.currentValue && (
            <p className="mt-1 text-sm text-red-600">{errors.currentValue}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter the property address"
          />
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Type
          </label>
          <select
            value={formData.propertyType}
            onChange={(e) => handleInputChange('propertyType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Select property type</option>
            <option value="single_family">Single Family Home</option>
            <option value="condo">Condominium</option>
            <option value="townhouse">Townhouse</option>
            <option value="multi_family">Multi-Family</option>
            <option value="apartment">Apartment</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Year Built and Square Feet */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year Built
            </label>
            <input
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              value={formData.yearBuilt}
              onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., 2020"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Square Feet
            </label>
            <input
              type="number"
              min="0"
              value={formData.squareFeet}
              onChange={(e) => handleInputChange('squareFeet', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., 2500"
            />
          </div>
        </div>

        {/* Purchase Price */}
        <div>
          <CurrencyInput
            value={formData.purchasePrice}
            onChange={handlePurchasePriceChange}
            label="Purchase Price (Optional)"
            placeholder="Enter the original purchase price"
            className="mb-2"
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
            {loading ? 'Adding...' : 'Add Home'}
          </button>
        </div>
      </form>
    </div>
  );
}
