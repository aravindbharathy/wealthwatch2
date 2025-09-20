"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CreateAssetInput } from '@/lib/firebase/types';
import { 
  searchTickers, 
  getStockWithPrice, 
  debouncedSearchTickers,
  StockSearchResult 
} from '@/lib/marketstack';
import CurrencyInput from '@/components/CurrencyInput';
import { useCurrency } from '@/lib/contexts/CurrencyContext';

interface StockTickerFormProps {
  onSubmit: (asset: CreateAssetInput) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

// Popular stocks to show as suggestions
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc - Class A', exchange: 'NASDAQ' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. - Class B', exchange: 'NYSE' },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', exchange: 'NYSE' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
];

export default function StockTickerForm({ onSubmit, onBack, loading = false }: StockTickerFormProps) {
  const { preferredCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 1,
    avgCost: 0,
    avgCostCurrency: 'USD',
    costBasis: 0,
    costBasisCurrency: 'USD',
  });
  const [quantityInput, setQuantityInput] = useState('1');
  const [showAverageCost, setShowAverageCost] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle search input changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      debouncedSearchTickers({ search: searchQuery })
        .then(results => {
          setSearchResults(results);
          setShowSuggestions(true);
        })
        .catch(error => {
          console.error('Search error:', error);
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    } else if (searchQuery.length === 0) {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  // Handle clicks outside search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setQuantityInput(inputValue);
    
    const numericValue = parseFloat(inputValue);
    if (!isNaN(numericValue) && numericValue >= 0) {
      handleInputChange('quantity', numericValue);
      
      if (showAverageCost && formData.avgCost > 0) {
        const newCostBasis = numericValue * formData.avgCost;
        handleInputChange('costBasis', newCostBasis);
      } else if (!showAverageCost && formData.costBasis > 0) {
        const newAvgCost = numericValue > 0 ? formData.costBasis / numericValue : 0;
        handleInputChange('avgCost', newAvgCost);
      }
    } else if (inputValue === '') {
      handleInputChange('quantity', 0);
    }
    
    if (errors.quantity) {
      setErrors(prev => ({
        ...prev,
        quantity: '',
      }));
    }
  };

  const handleCostBasisChange = (value: number, currency: string) => {
    handleInputChange('costBasis', value);
    handleInputChange('costBasisCurrency', currency);
    
    if (formData.quantity > 0 && value > 0) {
      const newAvgCost = value / formData.quantity;
      handleInputChange('avgCost', newAvgCost);
    }
  };

  const handleAverageCostChange = (value: number, currency: string) => {
    handleInputChange('avgCost', value);
    handleInputChange('avgCostCurrency', currency);
    
    if (formData.quantity > 0 && value > 0) {
      const newCostBasis = formData.quantity * value;
      handleInputChange('costBasis', newCostBasis);
    }
  };

  const toggleCostInput = () => {
    setShowAverageCost(!showAverageCost);
  };

  const handlePopularStockClick = async (stock: { symbol: string; name: string; exchange: string }) => {
    try {
      const stockWithPrice = await getStockWithPrice(stock.symbol);
      if (stockWithPrice) {
        const mergedStock = {
          ...stockWithPrice,
          symbol: stock.symbol,
          name: stock.name,
          exchange: stock.exchange,
          country: stockWithPrice.country || 'US',
          sector: stockWithPrice.sector || '',
          industry: stockWithPrice.industry || '',
        };
        
        setSelectedStock(mergedStock);
        setSearchQuery(`${mergedStock.symbol} - ${mergedStock.name}`);
        setShowSuggestions(false);
        
        // Update form data to use the native currency of the selected stock
        setFormData(prev => ({
          ...prev,
          avgCostCurrency: mergedStock.native_currency,
          costBasisCurrency: mergedStock.native_currency,
        }));
      }
    } catch (error: any) {
      console.error('Error fetching stock price:', error);
      const errorMessage = error.message || 'Failed to fetch stock price';
      setErrors({ stock: errorMessage });
    }
  };

  const handleStockSelect = async (stock: StockSearchResult) => {
    try {
      const stockWithPrice = await getStockWithPrice(stock.symbol);
      if (stockWithPrice) {
        const mergedStock = {
          ...stock,
          ...stockWithPrice,
          name: stock.name || stockWithPrice.name, // Preserve name from search results
          country: stock.country || stockWithPrice.country,
          sector: stock.sector || stockWithPrice.sector,
          industry: stock.industry || stockWithPrice.industry,
        };
        
        setSelectedStock(mergedStock);
        setSearchQuery(`${mergedStock.symbol} - ${mergedStock.name}`);
        setShowSuggestions(false);
        
        // Update form data to use the native currency of the selected stock
        setFormData(prev => ({
          ...prev,
          avgCostCurrency: mergedStock.native_currency,
          costBasisCurrency: mergedStock.native_currency,
        }));
      }
    } catch (error: any) {
      console.error('Error fetching stock price:', error);
      const errorMessage = error.message || 'Failed to fetch stock price';
      setErrors({ stock: errorMessage });
      setSearchQuery('');
      setSelectedStock(null);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedStock) {
      newErrors.stock = 'Please select a stock or fund';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (showAverageCost && formData.avgCost < 0) {
      newErrors.avgCost = 'Average cost cannot be negative';
    }

    if (!showAverageCost && formData.costBasis < 0) {
      newErrors.costBasis = 'Cost basis cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedStock) {
      return;
    }

    try {
      // Calculate current value in the native currency of the stock
      const nativePrice = selectedStock.current_price || 0;
      const currentValue = formData.quantity * nativePrice;
      
      // Calculate cost basis in the same currency as the cost basis input
      const costBasis = formData.costBasis || (formData.quantity * formData.avgCost);

      const assetData: CreateAssetInput = {
        name: selectedStock.name,
        type: 'stock_ticker',
        symbol: selectedStock.symbol,
        exchange: selectedStock.exchange,
        currency: selectedStock.native_currency, // Use the native currency of the stock
        quantity: formData.quantity,
        currentPrice: nativePrice, // Price in native currency
        currentValue: currentValue, // Value in native currency
        costBasis: costBasis,
        sectionId: '', // Will be set by parent component
        metadata: {
          description: '',
          tags: ['stock', 'equity'],
          customFields: {
            usdPrice: selectedStock.current_price_usd || 0,
            avgCostCurrency: formData.avgCostCurrency || selectedStock.native_currency,
            costBasisCurrency: formData.costBasisCurrency || selectedStock.native_currency,
            sector: selectedStock.sector || '',
            industry: selectedStock.industry || '',
            nativeCurrency: selectedStock.native_currency,
            conversionRate: selectedStock.conversion_rate || 1,
          },
        },
      };

      await onSubmit(assetData);
    } catch (error) {
      console.error('Error creating stock asset:', error);
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
          <h2 className="text-xl font-semibold text-gray-900">Add Stock</h2>
          <p className="text-sm text-gray-500">Search and add individual stocks, ETFs, and funds</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Search Bar */}
        <div ref={searchRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search for a company or ticker symbol
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                errors.stock ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Search for a company or ticker symbol"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          
          {/* Search Suggestions */}
          {showSuggestions && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 min-h-[120px] overflow-y-auto">
              {searchResults.map((stock, index) => (
                <div
                  key={index}
                  onClick={() => handleStockSelect(stock)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{stock.symbol}</div>
                      <div className="text-sm text-gray-600">{stock.name}</div>
                      <div className="text-xs text-gray-500">{stock.exchange}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">{stock.country}</div>
                      <div className="text-xs text-gray-500">{stock.native_currency}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {errors.stock && (
            <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
          )}
        </div>

        {/* Popular Stocks Suggestions */}
        {!selectedStock && searchQuery.length === 0 && (
          <div className="min-h-[200px]">
            <p className="text-sm text-gray-600 mb-4">Get latest value of your stocks, funds and bonds</p>
            <div className="grid grid-cols-2 gap-3">
              {POPULAR_STOCKS.map((stock, index) => (
                <div
                  key={index}
                  onClick={() => handlePopularStockClick(stock)}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="font-medium text-gray-900">{stock.symbol}</div>
                  <div className="text-sm text-gray-600">{stock.name}</div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">Search for more stocks.</p>
          </div>
        )}

        {/* Selected Stock Information */}
        {selectedStock && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedStock.symbol}</h3>
                <p className="text-sm text-gray-600">{selectedStock.name}</p>
                <p className="text-xs text-gray-500">{selectedStock.exchange}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {selectedStock.current_price ? `${selectedStock.native_currency} ${selectedStock.current_price.toFixed(2)}` : 'N/A'}
                </div>
                {selectedStock.native_currency !== preferredCurrency && selectedStock.current_price_usd && (
                  <div className="text-sm text-gray-600">
                    ≈ ${selectedStock.current_price_usd.toFixed(2)} {preferredCurrency}
                  </div>
                )}
              </div>
            </div>
            
            {selectedStock.native_currency !== preferredCurrency && selectedStock.conversion_rate && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Exchange Rate:</span>
                  <span className="font-medium">
                    1 {selectedStock.native_currency} = {selectedStock.conversion_rate.toFixed(4)} {preferredCurrency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>Last Updated:</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Inputs - Only show when stock is selected */}
        {selectedStock && (
          <>
            {/* Quantity Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="0"
                step="0.000001"
                value={quantityInput}
                onChange={handleQuantityChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                  errors.quantity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter quantity"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>

            {/* Cost Input with Toggle */}
            <div>
              {!showAverageCost ? (
                <CurrencyInput
                  value={formData.costBasis}
                  onChange={handleCostBasisChange}
                  label="Cost Basis (Optional)"
                  placeholder="Enter total cost basis (e.g., USD 1000, INR 1000, EUR 1000)"
                  className="mb-2"
                />
              ) : (
                <CurrencyInput
                  value={formData.avgCost}
                  onChange={handleAverageCostChange}
                  label="Average Cost (Optional)"
                  placeholder="Enter average cost (e.g., USD 100, INR 100, EUR 100)"
                  className="mb-2"
                />
              )}
              
              <button
                type="button"
                onClick={toggleCostInput}
                className="text-sm text-blue-600 hover:text-blue-800 underline mb-4"
              >
                {showAverageCost ? 'Switch to Cost Basis' : 'Switch to Average Cost'}
              </button>
              
              {errors.avgCost && (
                <p className="mt-1 text-sm text-red-600">{errors.avgCost}</p>
              )}
              {errors.costBasis && (
                <p className="mt-1 text-sm text-red-600">{errors.costBasis}</p>
              )}
            </div>
          </>
        )}

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
            disabled={loading || !selectedStock}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
