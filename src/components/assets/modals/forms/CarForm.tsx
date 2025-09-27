"use client";

import React, { useState } from 'react';
import { CreateAssetInput } from '@/lib/firebase/types';
import CurrencyInput from '@/components/CurrencyInput';

interface CarFormProps {
  onSubmit: (asset: CreateAssetInput) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

export default function CarForm({ onSubmit, onBack, loading = false }: CarFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    currentValue: 0,
    currency: 'USD',
    make: '',
    model: '',
    year: '',
    vin: '',
    mileage: '',
    condition: '',
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
      newErrors.name = 'Vehicle name is required';
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
        type: 'other',
        currency: formData.currency,
        quantity: 1, // Vehicles are always quantity 1
        currentPrice: formData.currentValue,
        currentValue: formData.currentValue,
        costBasis: formData.purchasePrice || formData.currentValue, // Use purchase price if available, otherwise current value
        sectionId: '', // Will be set by parent component
        metadata: {
          description: formData.description,
          tags: ['vehicle', 'automobile'],
          model: formData.model,
          year: formData.year ? parseInt(formData.year) : undefined,
          customFields: {
            make: formData.make,
            model: formData.model,
            year: formData.year,
            vin: formData.vin,
            mileage: formData.mileage,
            condition: formData.condition,
            purchasePrice: formData.purchasePrice,
            purchasePriceCurrency: formData.purchasePriceCurrency,
          },
        },
      };

      await onSubmit(assetData);
    } catch (error) {
      console.error('Error creating car asset:', error);
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
          <h2 className="text-xl font-semibold text-gray-900">Add Car</h2>
          <p className="text-sm text-gray-500">Enter your vehicle details</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., 2020 Honda Civic, My Daily Driver"
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

        {/* Make and Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Make
            </label>
            <input
              type="text"
              value={formData.make}
              onChange={(e) => handleInputChange('make', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., Honda, Toyota, Ford"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., Civic, Camry, F-150"
            />
          </div>
        </div>

        {/* Year and Mileage */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              value={formData.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., 2020"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mileage
            </label>
            <input
              type="number"
              min="0"
              value={formData.mileage}
              onChange={(e) => handleInputChange('mileage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="e.g., 50000"
            />
          </div>
        </div>

        {/* VIN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VIN (Vehicle Identification Number)
          </label>
          <input
            type="text"
            value={formData.vin}
            onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="e.g., 1HGBH41JXMN109186"
            maxLength={17}
          />
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condition
          </label>
          <select
            value={formData.condition}
            onChange={(e) => handleInputChange('condition', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Select condition</option>
            <option value="excellent">Excellent</option>
            <option value="very_good">Very Good</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
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
            placeholder="Optional description, features, or other details"
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
            {loading ? 'Adding...' : 'Add Car'}
          </button>
        </div>
      </form>
    </div>
  );
}
