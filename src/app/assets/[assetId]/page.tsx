"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Asset } from '@/lib/firebase/types';
import CurrencyFormattedValue from '@/components/CurrencyFormattedValue';
import { useAuthNew } from '@/lib/contexts/AuthContext';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { getAsset, updateAsset } from '@/lib/firebase/firebaseUtils';
import { convertCurrency } from '@/lib/currency';
import TradingViewWidget from '@/components/TradingViewWidget';

type TabType = 'MY POSITION' | 'PERFORMANCE' | 'TRANSACTIONS' | 'STOCK DATA' | 'NOTES' | 'DOCUMENTS';

export default function AssetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthNew();
  const { preferredCurrency: contextPreferredCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<TabType>('MY POSITION');
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costBasisInput, setCostBasisInput] = useState('');
  const [detectedCurrency, setDetectedCurrency] = useState<string>('');
  const [convertedValue, setConvertedValue] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string>('');
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');
  const [exchangeCurrencyConversion, setExchangeCurrencyConversion] = useState<{
    fromAmount: number;
    toAmount: number;
    fromCurrency: string;
    toCurrency: string;
  } | null>(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
  const [isUpdatingCostBasis, setIsUpdatingCostBasis] = useState(false);
  const [updateError, setUpdateError] = useState<string>('');
  const [convertedAvgCost, setConvertedAvgCost] = useState<number>(0);
  const [isConvertingAvgCost, setIsConvertingAvgCost] = useState(false);
  
  // Cache for currency conversions to avoid redundant API calls
  const conversionCache = useMemo(() => new Map<string, number>(), []);

  // Get assetId from URL params
  const assetId = params.assetId as string;

  // Currency patterns for detection
  const currencyPatterns = [
    { pattern: /^USD\s*(\d+(?:\.\d{2})?)$/i, currency: 'USD', symbol: '$' },
    { pattern: /^INR\s*(\d+(?:\.\d{2})?)$/i, currency: 'INR', symbol: '₹' },
    { pattern: /^EUR\s*(\d+(?:\.\d{2})?)$/i, currency: 'EUR', symbol: '€' },
    { pattern: /^GBP\s*(\d+(?:\.\d{2})?)$/i, currency: 'GBP', symbol: '£' },
    { pattern: /^JPY\s*(\d+(?:\.\d{2})?)$/i, currency: 'JPY', symbol: '¥' },
    { pattern: /^CAD\s*(\d+(?:\.\d{2})?)$/i, currency: 'CAD', symbol: 'C$' },
    { pattern: /^AUD\s*(\d+(?:\.\d{2})?)$/i, currency: 'AUD', symbol: 'A$' },
    { pattern: /^CHF\s*(\d+(?:\.\d{2})?)$/i, currency: 'CHF', symbol: 'CHF' },
    { pattern: /^HKD\s*(\d+(?:\.\d{2})?)$/i, currency: 'HKD', symbol: 'HK$' },
    { pattern: /^SGD\s*(\d+(?:\.\d{2})?)$/i, currency: 'SGD', symbol: 'S$' },
  ];

  // Update preferred currency from context
  useEffect(() => {
    if (contextPreferredCurrency && contextPreferredCurrency !== preferredCurrency) {
      setPreferredCurrency(contextPreferredCurrency);
    }
  }, [contextPreferredCurrency, preferredCurrency]);

  // Initialize inputs when asset loads
  useEffect(() => {
    if (asset) {
      setQuantityInput(asset.quantity?.toString() || '');
    }
  }, [asset]);

  // Optimized currency conversion with caching
  const convertAvgCost = useCallback(async () => {
    if (!asset?.avgCost || !asset?.currency || !preferredCurrency) {
      setConvertedAvgCost(0);
      return;
    }

    // If the asset currency is the same as preferred currency, no conversion needed
    if (asset.currency === preferredCurrency) {
      setConvertedAvgCost(asset.avgCost);
      return;
    }

    // Check cache first
    const cacheKey = `${asset.currency}-${preferredCurrency}-${asset.avgCost}`;
    const cachedValue = conversionCache.get(cacheKey);
    if (cachedValue !== undefined) {
      setConvertedAvgCost(cachedValue);
      return;
    }

    // Convert to preferred currency
    setIsConvertingAvgCost(true);
    try {
      const conversion = await convertCurrency(asset.currency, preferredCurrency, asset.avgCost);
      const convertedAmount = conversion.convertedAmount || asset.avgCost;
      
      // Cache the result
      conversionCache.set(cacheKey, convertedAmount);
      setConvertedAvgCost(convertedAmount);
    } catch (error) {
      console.error('Average cost currency conversion failed:', error);
      // Fallback to original value
      setConvertedAvgCost(asset.avgCost);
    } finally {
      setIsConvertingAvgCost(false);
    }
  }, [asset, preferredCurrency, conversionCache]);

  // Convert average cost when asset or preferred currency changes
  useEffect(() => {
    convertAvgCost();
  }, [convertAvgCost]);

  // Initialize cost basis input when asset loads
  useEffect(() => {
    const initializeCostBasis = async () => {
      if (asset?.costBasis && asset?.currency && preferredCurrency) {
        // If the asset currency is the same as preferred currency, no conversion needed
        if (asset.currency === preferredCurrency) {
          setCostBasisInput(`${asset.currency} ${asset.costBasis.toString()}`);
          setDetectedCurrency(asset.currency);
          setConvertedValue(asset.costBasis);
          setExchangeCurrencyConversion(null);
        } else {
          // Convert to preferred currency
          try {
            const conversion = await convertCurrency(asset.currency, preferredCurrency, asset.costBasis);
            const convertedAmount = conversion.convertedAmount || asset.costBasis;
            setCostBasisInput(`${preferredCurrency} ${convertedAmount.toFixed(2)}`);
            setDetectedCurrency(preferredCurrency);
            setConvertedValue(convertedAmount);
            
            // Set up exchange currency conversion display
            setExchangeCurrencyConversion({
              fromAmount: convertedAmount,
              toAmount: asset.costBasis,
              fromCurrency: preferredCurrency,
              toCurrency: asset.currency
            });
          } catch (error) {
            console.error('Currency conversion failed during initialization:', error);
            // Fallback to original currency
            setCostBasisInput(`${asset.currency} ${asset.costBasis.toString()}`);
            setDetectedCurrency(asset.currency);
            setConvertedValue(asset.costBasis);
            setExchangeCurrencyConversion(null);
          }
        }
      }
    };

    if (asset && preferredCurrency) {
      initializeCostBasis();
    }
  }, [asset, preferredCurrency]);

  const detectCurrency = (input: string): { amount: number; currency: string; symbol: string } | null => {
    // First try to match currency patterns
    for (const { pattern, currency, symbol } of currencyPatterns) {
      const match = input.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        return { amount, currency, symbol };
      }
    }

    // If no currency pattern matches, try to parse as plain number
    const plainNumber = parseFloat(input);
    if (!isNaN(plainNumber)) {
      return { amount: plainNumber, currency: preferredCurrency, symbol: getCurrencySymbol(preferredCurrency) };
    }

    return null;
  };

  const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
      USD: '$',
      INR: '₹',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'CHF',
      HKD: 'HK$',
      SGD: 'S$',
    };
    return symbols[currency] || currency;
  };

  const handleQuantityInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantityInput(e.target.value);
    setUpdateError(''); // Clear any previous errors
  }, []);

  const handleQuantitySave = useCallback(async () => {
    const newQuantity = parseFloat(quantityInput);
    
    if (!asset || !user?.uid || isNaN(newQuantity) || newQuantity < 0) {
      // Revert to original value if invalid
      setQuantityInput(asset?.quantity?.toString() || '');
      return;
    }

    setIsUpdatingQuantity(true);
    setUpdateError('');

    try {
      // Calculate new current value based on current price and new quantity
      const newCurrentValue = asset.currentPrice ? newQuantity * asset.currentPrice : asset.currentValue;
      
      // Calculate new average cost based on cost basis and new quantity
      const newAvgCost = asset.costBasis && newQuantity > 0 ? asset.costBasis / newQuantity : 0;
      
      // Update the asset with new quantity, current value, and average cost
      const result = await updateAsset(user.uid, assetId, {
        quantity: newQuantity,
        currentValue: newCurrentValue,
        avgCost: newAvgCost
      });

      if (result.success && result.data) {
        setAsset(result.data);
      } else {
        setUpdateError(result.error || 'Failed to update quantity');
        // Revert the input
        setQuantityInput(asset.quantity?.toString() || '');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      setUpdateError('Failed to update quantity');
      // Revert the input
      setQuantityInput(asset.quantity?.toString() || '');
    } finally {
      setIsUpdatingQuantity(false);
    }
  }, [quantityInput, asset, user?.uid, assetId]);

  const handleQuantityKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQuantitySave();
    }
  }, [handleQuantitySave]);

  const handleQuantityBlur = useCallback(() => {
    handleQuantitySave();
  }, [handleQuantitySave]);

  const handleCostBasisInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    setConversionError('');
    setUpdateError(''); // Clear any previous errors

    if (!input.trim()) {
      setCostBasisInput('');
      setDetectedCurrency('');
      setConvertedValue(0);
      return;
    }

    // Ensure proper spacing between currency and number
    const formattedInput = input.replace(/([A-Z]{3})(\d)/, '$1 $2');
    if (formattedInput !== input) {
      input = formattedInput;
      setCostBasisInput(input);
    } else {
      setCostBasisInput(input);
    }

    const detected = detectCurrency(input);
    if (!detected) {
      setConversionError('Invalid currency format. Try: USD 100, INR 100, EUR 100');
      return;
    }

    setDetectedCurrency(detected.currency);

    // If the detected currency is the same as preferred, no conversion needed
    if (detected.currency === preferredCurrency) {
      setConvertedValue(detected.amount);
      return;
    }

    // Convert to preferred currency
    setIsConverting(true);
    convertCurrency(detected.currency, preferredCurrency, detected.amount)
      .then(conversion => {
        setConvertedValue(conversion.convertedAmount || detected.amount);
      })
      .catch(error => {
        console.error('Currency conversion failed:', error);
        setConversionError('Currency conversion failed. Using original amount.');
        setConvertedValue(detected.amount);
      })
      .finally(() => {
        setIsConverting(false);
      });
  };

  const handleCostBasisSave = async () => {
    if (!asset || !user?.uid || !detectedCurrency || convertedValue <= 0) {
      return;
    }

    setIsUpdatingCostBasis(true);
    setUpdateError('');

    try {
      // Calculate new average cost based on cost basis and quantity
      const newAvgCost = asset.quantity > 0 ? convertedValue / asset.quantity : 0;
      
      // Update the asset with new cost basis and average cost
      const result = await updateAsset(user.uid, assetId, {
        costBasis: convertedValue,
        avgCost: newAvgCost,
        currency: preferredCurrency
      });

      if (result.success && result.data) {
        setAsset(result.data);
      } else {
        setUpdateError(result.error || 'Failed to update cost basis');
      }
    } catch (error) {
      console.error('Error updating cost basis:', error);
      setUpdateError('Failed to update cost basis');
    } finally {
      setIsUpdatingCostBasis(false);
    }
  };

  const handleCostBasisKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCostBasisSave();
    }
  };

  const handleCostBasisBlur = () => {
    handleCostBasisSave();
  };

  // Fetch asset data from Firebase
  useEffect(() => {
    const fetchAsset = async () => {
      if (!assetId || assetId === 'undefined' || !user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const result = await getAsset(user.uid, assetId);
        
        if (result.success && result.data) {
          setAsset(result.data);
        } else {
          setError(result.error || 'Asset not found');
          console.error('Failed to fetch asset:', result.error);
        }
      } catch (err) {
        console.error('Error fetching asset:', err);
        setError('Failed to load asset data');
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [assetId, user?.uid]);

  // Memoized calculations
  const calculatedValues = useMemo(() => {
    if (!asset) return null;
    
    const currentValue = asset.currentValue || 0;
    const costBasis = asset.costBasis || 0;
    const quantity = asset.quantity || 0;
    const avgCost = asset.avgCost || 0;
    
    return {
      currentValue,
      costBasis,
      quantity,
      avgCost,
      gainLoss: currentValue - costBasis,
      irr: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0
    };
  }, [asset]);

  const formatPercent = useCallback((percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  }, []);


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
    if (!asset) return null;

    switch (activeTab) {
    case 'MY POSITION':
      return (
        <div className="grid grid-cols-1 gap-6">
          {/* Position Details */}
          <div className="bg-white p-4 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-3">Position Details</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Total Shares)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={quantityInput}
                    onChange={handleQuantityInputChange}
                    onKeyPress={handleQuantityKeyPress}
                    onBlur={handleQuantityBlur}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      updateError ? 'border-red-300 focus:ring-red-500' : ''
                    }`}
                    placeholder="Enter quantity"
                    disabled={isUpdatingQuantity}
                  />
                  {isUpdatingQuantity && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                {updateError && (
                  <p className="mt-1 text-sm text-red-600">{updateError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Basis</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        value={costBasisInput}
                        onChange={handleCostBasisInputChange}
                        onKeyPress={handleCostBasisKeyPress}
                        onBlur={handleCostBasisBlur}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          conversionError || updateError ? 'border-red-300 focus:ring-red-500' : ''
                        }`}
                        placeholder="Enter total cost basis (e.g., USD 1000, INR 1000, EUR 1000)"
                        disabled={isUpdatingCostBasis}
                      />
                      {(isConverting || isUpdatingCostBasis) && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                    
                    {(conversionError || updateError) && (
                      <p className="mt-1 text-sm text-red-600">{conversionError || updateError}</p>
                    )}

                    {detectedCurrency && detectedCurrency !== preferredCurrency && convertedValue > 0 && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md">
                        <p className="text-xs text-blue-700">
                          <span className="font-medium">{detectedCurrency} {costBasisInput.replace(/[^\d.]/g, '')}</span> = 
                          <span className="font-medium"> {preferredCurrency} {convertedValue.toFixed(2)}</span>
                        </p>
                      </div>
                    )}

                    {detectedCurrency && (
                      <div className="mt-1 text-xs text-gray-500">
                        Detected: {detectedCurrency} | Stored as: {preferredCurrency}
                      </div>
                    )}

                    {/* Exchange Currency Conversion Display */}
                    {exchangeCurrencyConversion && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md border">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">{exchangeCurrencyConversion.fromCurrency} {exchangeCurrencyConversion.fromAmount.toFixed(2)}</span>
                            <span className="mx-2 text-gray-400">=</span>
                            <span className="font-medium">{exchangeCurrencyConversion.toCurrency} {exchangeCurrencyConversion.toAmount.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Exchange rate
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Your preferred currency ({preferredCurrency}) vs Stock exchange currency ({asset?.currency})
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Average Cost</label>
                  <div className="relative w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {asset.avgCost !== undefined && asset.avgCost > 0 ? (
                      <span className="text-sm font-medium">
                        {preferredCurrency} {convertedAvgCost.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Not available</span>
                    )}
                    {isConvertingAvgCost && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

      case 'PERFORMANCE':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Performance Metrics */}
            <div className="space-y-4">
              <div className="bg-white p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3">Return Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Return:</span>
                    <span className={`text-sm font-medium ${
                      (calculatedValues?.irr || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculatedValues?.irr ? formatPercent(calculatedValues.irr) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Gain/Loss:</span>
                    <span className={`text-sm font-medium ${
                      (calculatedValues?.gainLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <CurrencyFormattedValue 
                        amount={calculatedValues?.gainLoss || 0} 
                        fromCurrency={asset.currency}
                        className="text-sm font-medium"
                      />
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Value:</span>
                    <CurrencyFormattedValue 
                      amount={calculatedValues?.currentValue || 0} 
                      fromCurrency={asset.currency}
                      className="text-sm font-medium"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cost Basis:</span>
                    <CurrencyFormattedValue 
                      amount={calculatedValues?.costBasis || 0} 
                      fromCurrency={asset.currency}
                      className="text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3">Price Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Price:</span>
                    <span className="text-sm font-medium">
                      {asset.currentPrice ? `${asset.currency} ${asset.currentPrice.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Cost:</span>
                    <span className="text-sm font-medium">
                      {preferredCurrency} {convertedAvgCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <span className="text-sm font-medium">
                      {calculatedValues?.quantity?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Price vs Avg Cost:</span>
                    <span className={`text-sm font-medium ${
                      (asset.currentPrice || 0) >= convertedAvgCost ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {asset.currentPrice && convertedAvgCost > 0 
                        ? formatPercent(((asset.currentPrice - convertedAvgCost) / convertedAvgCost) * 100)
                        : '--'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Market Performance */}
            <div className="space-y-4">
              <div className="bg-white p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3">Market Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Day Change:</span>
                    <div className="flex items-center space-x-1">
                      {getPerformanceIcon(asset.performance?.dayChange || 0)}
                      <span className={`text-sm font-medium ${
                        (asset.performance?.dayChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {asset.performance?.dayChange ? formatPercent(asset.performance.dayChange) : '--'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Week Change:</span>
                    <span className={`text-sm font-medium ${
                      (asset.performance?.weekChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {asset.performance?.weekChange ? formatPercent(asset.performance.weekChange) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Month Change:</span>
                    <span className={`text-sm font-medium ${
                      (asset.performance?.monthChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {asset.performance?.monthChange ? formatPercent(asset.performance.monthChange) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Year Change:</span>
                    <span className={`text-sm font-medium ${
                      (asset.performance?.yearChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {asset.performance?.yearChange ? formatPercent(asset.performance.yearChange) : '--'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3">Risk Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Volatility:</span>
                    <span className="text-sm font-medium">24.1%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sharpe Ratio:</span>
                    <span className="text-sm font-medium">1.2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Beta:</span>
                    <span className="text-sm font-medium">1.1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Max Drawdown:</span>
                    <span className="text-sm font-medium text-red-600">-15.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'TRANSACTIONS':
        return (
          <div className="grid grid-cols-1 gap-6">
            {/* Transactions Table */}
            <div className="bg-white p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-3">Transaction History</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {asset.transactions && asset.transactions.length > 0 ? (
                      asset.transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.date.toDate().toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'buy' ? 'bg-green-100 text-green-800' :
                              transaction.type === 'sell' ? 'bg-red-100 text-red-800' :
                              transaction.type === 'dividend' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.quantity.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <CurrencyFormattedValue 
                              amount={transaction.price} 
                              fromCurrency={asset.currency}
                              className="text-sm"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <CurrencyFormattedValue 
                              amount={transaction.totalAmount} 
                              fromCurrency={asset.currency}
                              className="text-sm"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {transaction.notes || '--'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Transaction Button */}
            <div className="bg-white p-4 shadow-sm">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Add New Transaction
              </button>
            </div>
          </div>
        );

      case 'STOCK DATA':
        return (
          <div className="grid grid-cols-1 gap-6">
            {/* Stock Information */}
            <div className="bg-white p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-3">Stock Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                  <p className="text-sm text-gray-900">{asset.symbol}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exchange</label>
                  <p className="text-sm text-gray-900">{asset.exchange || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Price</label>
                  <p className="text-sm text-gray-900">
                    {asset.currency} {asset.currentPrice?.toFixed(2) || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Market Cap</label>
                  <p className="text-sm text-gray-900">N/A</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                  <p className="text-sm text-gray-900">N/A</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">52-Week High</label>
                  <p className="text-sm text-gray-900">N/A</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">52-Week Low</label>
                  <p className="text-sm text-gray-900">N/A</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">P/E Ratio</label>
                  <p className="text-sm text-gray-900">N/A</p>
                </div>
              </div>
            </div>

            {/* Price History Chart */}
            <div className="bg-white p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-3">Price History</h4>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Price chart will be displayed here</p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-white p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-3">Key Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">N/A</p>
                  <p className="text-sm text-gray-600">Beta</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">N/A</p>
                  <p className="text-sm text-gray-600">Dividend Yield</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">N/A</p>
                  <p className="text-sm text-gray-600">EPS</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'NOTES':
        return (
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Notes */}
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

            {/* Right Column - Tags and Categories */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Tags & Categories</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input
                      type="text"
                      placeholder="e.g., tech, growth, blue-chip"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      defaultValue="tech, growth, blue-chip"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option>Core Holdings</option>
                      <option>Growth</option>
                      <option>Value</option>
                      <option>Dividend</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'DOCUMENTS':
        return (
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Attached Documents */}
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

            {/* Right Column - Upload New Documents */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Upload Documents</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
                    <input
                      type="file"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      accept=".pdf,.doc,.docx,.txt"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option>Purchase Receipt</option>
                      <option>Research Report</option>
                      <option>Tax Document</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                    Upload Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="ml-4 text-gray-600">Loading asset {assetId}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Asset</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">Asset ID: {assetId}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Asset Not Found</h1>
          <p className="text-gray-600 mb-4">The asset you&apos;re looking for doesn&apos;t exist.</p>
          <p className="text-sm text-gray-500 mb-4">Asset ID: {assetId}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const tabs: TabType[] = ['MY POSITION', 'PERFORMANCE', 'TRANSACTIONS', 'STOCK DATA', 'NOTES', 'DOCUMENTS'];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content Area - matches assets page layout */}
      <div className="flex-1 space-y-4 overflow-visible">
        {/* Back Button */}
        <div className="pt-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* Header */}
        <div className="py-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{asset.name}</h1>
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
        </div>

        {/* Tabs */}
        <div>
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
        <div className="py-4">
          {renderTabContent()}
        </div>
      </div>

      {/* Right Sidebar - Stock Information */}
      <div className="w-full lg:w-80 space-y-6">
        {/* TradingView Widget - Common for all tabs */}
        {asset.symbol && (
          <TradingViewWidget 
            symbol={asset.symbol}
            exchange={asset.exchange || 'NASDAQ'}
            name={asset.name}
          />
        )}
      </div>
    </div>
  );
}
