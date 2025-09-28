// Marketstack API integration for WealthWatch
// Based on the Marketstack API documentation

import axios, { AxiosResponse } from 'axios';
import { AssetType, AssetSubType } from './firebase/types';

// Use local API routes to avoid CORS issues
const BASE_URL = '/api/marketstack';

// Create axios instance with default config
const marketstackAPI = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Exchange to currency mapping
const EXCHANGE_CURRENCY_MAP: Record<string, string> = {
  'XNSE': 'INR', // National Stock Exchange of India
  'XBOM': 'INR', // BSE Ltd (Bombay Stock Exchange)
  'XNYS': 'USD', // New York Stock Exchange
  'XNAS': 'USD', // NASDAQ
  'IEXG': 'USD', // Investors Exchange
  'XLON': 'GBP', // London Stock Exchange
  'XETR': 'EUR', // XETRA (German Exchange)
  'XPAR': 'EUR', // Euronext Paris
  'XTKS': 'JPY', // Tokyo Stock Exchange
  'XHKG': 'HKD', // Hong Kong Stock Exchange
  'XASX': 'AUD', // Australian Securities Exchange
  'XTSE': 'CAD', // Toronto Stock Exchange
  'XBRU': 'EUR', // Euronext Brussels
  'XAMS': 'EUR', // Euronext Amsterdam
  'XMIL': 'EUR', // Borsa Italiana
  'XSWX': 'CHF', // SIX Swiss Exchange
  'XSTO': 'SEK', // Nasdaq Stockholm
  'XOSL': 'NOK', // Oslo Børs
  'XCOP': 'COP', // Colombian Stock Exchange
  'XMEX': 'MXN', // Mexican Stock Exchange
  'XBUE': 'ARS', // Bolsa de Comercio de Buenos Aires
  'BVMF': 'BRL', // B3 S.A. - Brasil Bolsa Balcão
};

// Function to get currency for an exchange
function getExchangeCurrency(exchangeCode: string): string {
  return EXCHANGE_CURRENCY_MAP[exchangeCode] || 'USD';
}

// Function to map Marketstack asset_type to our AssetType
export function mapMarketstackAssetTypeToAssetType(
  assetType: string, 
  symbol?: string, 
  name?: string, 
  exchangeCode?: string
): AssetType {
  // First try direct mapping from asset_type
  const typeMap: Record<string, AssetType> = {
    'stock': 'equity',
    'equity': 'equity',
    'etf': 'etf',
    'mutual_fund': 'mutual fund',
    'bond': 'fixed income',
    'fixed_income': 'fixed income',
    'crypto': 'cryptocurrency',
    'cryptocurrency': 'cryptocurrency',
    'derivative': 'derivative',
    'option': 'derivative',
    'warrant': 'derivative',
    'cash': 'cash',
    'currency': 'cash',
    'commodity': 'other',
    'other': 'other',
  };

  const directMapping = typeMap[assetType.toLowerCase()];
  if (directMapping && directMapping !== 'other') {
    return directMapping;
  }

  // If direct mapping failed or returned 'other', use intelligent detection
  return intelligentTypeDetection(symbol || '', name || '', exchangeCode || '');
}

// Intelligent type detection based on symbol, name, and exchange patterns
function intelligentTypeDetection(symbol: string, name: string, exchangeCode: string): AssetType {
  const lowerSymbol = symbol.toLowerCase();
  const lowerName = name.toLowerCase();
  const lowerExchange = exchangeCode.toLowerCase();

  // ETF Detection Patterns
  if (isETF(lowerSymbol, lowerName, lowerExchange)) {
    return 'etf';
  }

  // Mutual Fund Detection Patterns
  if (isMutualFund(lowerSymbol, lowerName, lowerExchange)) {
    return 'mutual fund';
  }

  // REIT Detection Patterns
  if (isREIT(lowerSymbol, lowerName, lowerExchange)) {
    return 'other'; // REITs are typically classified as 'other'
  }

  // Bond/Fixed Income Detection Patterns
  if (isBond(lowerSymbol, lowerName, lowerExchange)) {
    return 'fixed income';
  }

  // Cryptocurrency Detection Patterns
  if (isCryptocurrency(lowerSymbol, lowerName, lowerExchange)) {
    return 'cryptocurrency';
  }

  // Default to equity for most securities (stocks)
  return 'equity';
}

// ETF Detection Logic
function isETF(symbol: string, name: string, exchange: string): boolean {
  // Symbol patterns
  const etfSymbolPatterns = [
    'bees', 'etf', 'spdr', 'qqq', 'spy', 'vti', 'voo', 'ark', 'xlk', 'xlf',
    'xle', 'xli', 'xlv', 'xly', 'xlp', 'xlu', 'xlb', 'xlc', 'xly'
  ];

  // Name patterns
  const etfNamePatterns = [
    'etf', 'exchange traded fund', 'index fund', 'spdr', 'proshares',
    'ishares', 'vanguard', 'ark', 'invesco', 'state street'
  ];

  // Exchange-specific patterns
  if (exchange === 'xnse' && symbol.includes('bees')) {
    return true; // NSE BEES are ETFs
  }

  // Check symbol patterns
  if (etfSymbolPatterns.some(pattern => symbol.includes(pattern))) {
    return true;
  }

  // Check name patterns
  if (etfNamePatterns.some(pattern => name.includes(pattern))) {
    return true;
  }

  return false;
}

// Mutual Fund Detection Logic
function isMutualFund(symbol: string, name: string, exchange: string): boolean {
  // Name patterns
  const mutualFundPatterns = [
    'mutual fund', 'fund', 'investment fund', 'growth fund', 'income fund',
    'balanced fund', 'equity fund', 'debt fund', 'hybrid fund'
  ];

  // Symbol patterns
  const mutualFundSymbolPatterns = ['mf', 'fund'];

  // Check name patterns
  if (mutualFundPatterns.some(pattern => name.includes(pattern))) {
    return true;
  }

  // Check symbol patterns
  if (mutualFundSymbolPatterns.some(pattern => symbol.includes(pattern))) {
    return true;
  }

  return false;
}

// REIT Detection Logic
function isREIT(symbol: string, name: string, exchange: string): boolean {
  const reitPatterns = [
    'reit', 'real estate investment trust', 'real estate', 'property',
    'reit', 'reits'
  ];

  return reitPatterns.some(pattern => 
    symbol.includes(pattern) || name.includes(pattern)
  );
}

// Bond Detection Logic
function isBond(symbol: string, name: string, exchange: string): boolean {
  const bondPatterns = [
    'bond', 'treasury', 't-bill', 't-note', 't-bond', 'corporate bond',
    'municipal bond', 'government bond', 'sovereign bond'
  ];

  return bondPatterns.some(pattern => 
    symbol.includes(pattern) || name.includes(pattern)
  );
}

// Cryptocurrency Detection Logic
function isCryptocurrency(symbol: string, name: string, exchange: string): boolean {
  const cryptoPatterns = [
    'btc', 'eth', 'bitcoin', 'ethereum', 'crypto', 'cryptocurrency',
    'coin', 'token', 'digital currency'
  ];

  return cryptoPatterns.some(pattern => 
    symbol.includes(pattern) || name.includes(pattern)
  );
}

// Function to determine AssetSubType based on Marketstack data
export function determineAssetSubTypeFromMarketstack(
  assetType: string, 
  symbol: string, 
  name: string
): AssetSubType | undefined {
  const lowerAssetType = assetType.toLowerCase();
  const lowerName = name.toLowerCase();
  const lowerSymbol = symbol.toLowerCase();

  // Direct mappings based on asset type
  if (lowerAssetType === 'stock' || lowerAssetType === 'equity') {
    // Check for preferred stock indicators
    if (lowerName.includes('preferred') || lowerSymbol.includes('p') || lowerSymbol.includes('pr')) {
      return 'preferred equity';
    }
    // Check for depositary receipts
    if (lowerName.includes('depositary receipt') || lowerName.includes('adr') || lowerName.includes('gdr')) {
      return 'depositary receipt';
    }
    // Default to common stock
    return 'common stock';
  }

  if (lowerAssetType === 'etf') {
    return 'etf';
  }

  if (lowerAssetType === 'mutual_fund') {
    return 'mutual fund';
  }

  // Enhanced detection for foreign securities with missing asset_type
  if (!assetType || assetType === '' || assetType === 'other') {
    // ETF Detection
    if (isETF(lowerSymbol, lowerName, '')) {
      return 'etf';
    }
    
    // Mutual Fund Detection
    if (isMutualFund(lowerSymbol, lowerName, '')) {
      return 'mutual fund';
    }
    
    // REIT Detection
    if (isREIT(lowerSymbol, lowerName, '')) {
      return 'real estate investment trust';
    }
    
    // Bond Detection
    if (isBond(lowerSymbol, lowerName, '')) {
      return 'bond';
    }
    
    // Cryptocurrency Detection
    if (isCryptocurrency(lowerSymbol, lowerName, '')) {
      return 'cryptocurrency';
    }
    
    // Default to common stock for most securities
    return 'common stock';
  }

  if (lowerAssetType === 'bond' || lowerAssetType === 'fixed_income') {
    // Check for specific bond types
    if (lowerName.includes('treasury') && lowerName.includes('inflation')) {
      return 'treasury inflation protected securities';
    }
    if (lowerName.includes('municipal')) {
      return 'municipal bond';
    }
    if (lowerName.includes('mortgage')) {
      return 'mortgage backed security';
    }
    if (lowerName.includes('asset backed')) {
      return 'asset backed security';
    }
    if (lowerName.includes('convertible')) {
      return 'convertible bond';
    }
    if (lowerName.includes('bill')) {
      return 'bill';
    }
    if (lowerName.includes('note')) {
      return 'note';
    }
    // Default to bond
    return 'bond';
  }

  if (lowerAssetType === 'crypto' || lowerAssetType === 'cryptocurrency') {
    return 'cryptocurrency';
  }

  if (lowerAssetType === 'option') {
    return 'option';
  }

  if (lowerAssetType === 'warrant') {
    return 'warrant';
  }

  if (lowerAssetType === 'cash' || lowerAssetType === 'currency') {
    return 'cash';
  }

  // Check for REITs
  if (lowerName.includes('reit') || lowerName.includes('real estate investment trust')) {
    return 'real estate investment trust';
  }

  // Check for units
  if (lowerName.includes('unit') || lowerName.includes('lp')) {
    return 'unit';
  }

  return undefined; // Let the caller decide what to do with undefined
}

// Type definitions for Marketstack API responses
export interface Pagination {
  limit: number;
  offset: number;
  count: number;
  total: number;
}

export interface EODData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adj_open: number;
  adj_high: number;
  adj_low: number;
  adj_close: number;
  adj_volume: number;
  split_factor: number;
  dividend: number;
  symbol: string;
  exchange_code: string;
  name: string;
  asset_type: string;
  price_currency: string;
  exchange: string;
}

export interface EODResponse {
  pagination: Pagination;
  data: EODData[];
}

// Add intraday data interface (similar to EODData but for intraday)
export interface IntradayData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
  exchange_code: string;
  name: string;
  asset_type: string;
  price_currency: string;
  exchange: string;
}

export interface IntradayResponse {
  pagination: Pagination;
  data: IntradayData[];
}

export interface TickerInfo {
  name: string;
  ticker: string;
  item_type: string;
  sector: string;
  industry: string;
  exchange_code: string;
  full_time_employees: string;
  ipo_date?: string;
  date_founded?: string;
  key_executives: KeyExecutive[];
  incorporation: string;
  address: Address;
  phone: string;
  website: string;
  about: string;
}

export interface KeyExecutive {
  name: string;
  salary: string;
  function: string;
  exercised: string;
  birth_year: string;
}

export interface Address {
  city: string;
  street1: string;
  street2: string;
  postal_code: string;
  stateOrCountry: string;
  state_or_country_description: string;
}

export interface TickerInfoResponse {
  data: TickerInfo;
}

export interface TickerMetadata {
  name: string;
  symbol: string;
  cik: string;
  isin: string;
  cusip: string;
  ein_employer_id: string;
  lei: string;
  series_id: string;
  item_type: string;
  sector: string;
  industry: string;
  sic_code: string;
  sic_name: string;
  stock_exchange: StockExchange;
}

export interface StockExchange {
  name: string;
  acronym: string;
  mic: string;
  country?: string;
  country_code: string;
  city: string;
  website: string;
  operating_mic: string;
  oprt_sgmt: string;
  legal_entity_name: string;
  exchange_lei: string;
  market_category_code: string;
  exchange_status: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  exchange_code: string;
  country: string;
  currency: string;
  native_currency: string; // The actual currency of the stock exchange
  current_price?: number;
  current_price_usd?: number; // Price converted to USD
  conversion_rate?: number; // Exchange rate used for conversion
  market_cap?: number;
  sector?: string;
  industry?: string;
  asset_type?: string; // From Marketstack API
  type?: AssetType; // Mapped to our AssetType
  subType?: AssetSubType; // Mapped to our AssetSubType
}

// Search parameters interface
export interface SearchParams {
  search?: string;
  exchange?: string;
  limit?: number;
  offset?: number;
}

// Priority exchanges for search - ordered by importance and coverage
const PRIORITY_EXCHANGES = [
  'XNYS', // New York Stock Exchange
  'XNAS', // NASDAQ
  'XNSE', // National Stock Exchange of India
  'XBOM', // BSE Ltd (Bombay Stock Exchange)
  'XLON', // London Stock Exchange
  'XETR', // XETRA (German Exchange)
  'XPAR', // Euronext Paris
  'XTKS', // Tokyo Stock Exchange
  'XHKG', // Hong Kong Stock Exchange
  'XASX', // Australian Securities Exchange
];

// Core exchanges for fast initial search (most commonly used)
const CORE_EXCHANGES = [
  'XNYS', // New York Stock Exchange
  'XNAS', // NASDAQ
  'XNSE', // National Stock Exchange of India
  'XBOM', // BSE Ltd (Bombay Stock Exchange)
  'XLON', // London Stock Exchange
];

// Secondary exchanges for extended search
const SECONDARY_EXCHANGES = [
  'XTSE', // Toronto Stock Exchange
  'XSWX', // SIX Swiss Exchange
  'XSTO', // Nasdaq Stockholm
  'XMIL', // Borsa Italiana
  'XAMS', // Euronext Amsterdam
  'XBRU', // Euronext Brussels
  'XOSL', // Oslo Børs
  'BVMF', // B3 S.A. - Brasil Bolsa Balcão
  'XMEX', // Mexican Stock Exchange
  'XCOP', // Colombian Stock Exchange
  'XBUE', // Bolsa de Comercio de Buenos Aires
];

// Function to search for tickers using the optimized API route
export async function searchTickers(params: SearchParams): Promise<StockSearchResult[]> {
  try {
    
    // Use the optimized API route that handles all exchanges internally
    const response: AxiosResponse<{ data: StockSearchResult[] }> = await marketstackAPI.get('/tickerslist', {
      params: {
        search: params.search,
        exchange: params.exchange,
        limit: params.limit || 50,
        offset: params.offset || 0,
      },
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error searching tickers:', error);
    throw error;
  }
}


// Function to get latest price for a symbol (EOD data)
export async function getLatestPrice(symbol: string): Promise<EODData | null> {
  try {
    const response: AxiosResponse<EODResponse> = await marketstackAPI.get('/eod/latest', {
      params: {
        symbols: symbol,
      },
    });
    
    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching latest price:', error);
    
    // Check if it's a 422 error (unprocessable content)
    if (error.response?.status === 422) {
      const errorData = error.response.data;
      if (errorData?.error?.code === 'no_valid_symbols_provided') {
        throw new Error(`Symbol "${symbol}" is not valid or has no EOD data available`);
      }
    }
    
    throw error;
  }
}

// Function to get latest intraday price (real-time data)
export async function getLatestIntradayPrice(symbol: string): Promise<IntradayData | null> {
  try {
    const response: AxiosResponse<IntradayResponse> = await marketstackAPI.get('/intraday/latest', {
      params: {
        symbols: symbol,
        interval: '1min',
      },
    });
    
    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    }
    return null;
  } catch (error: any) {
    // Check if it's a 403 error (access restricted - subscription plan doesn't support intraday)
    if (error.response?.status === 403) {
      const errorData = error.response.data;
      if (errorData?.code === 'SUBSCRIPTION_LIMITATION') {
        // Display the user-friendly error message from the API
        console.warn(errorData.error);
        throw new Error(errorData.error);
      } else if (errorData?.error?.code === 'function_access_restricted') {
        const detailedMessage = `Intraday data not available - subscription plan doesn't support real-time data for ${symbol}`;
        console.warn(detailedMessage);
        throw new Error(detailedMessage);
      }
    }
    
    // Check if it's a 422 error (unprocessable content)
    if (error.response?.status === 422) {
      const errorData = error.response.data;
      if (errorData?.error?.code === 'no_valid_symbols_provided') {
        throw new Error(`Symbol "${symbol}" is not valid or has no intraday data available`);
      }
    }
    
    console.error('Error fetching latest intraday price:', error);
    throw error;
  }
}

// Function to get detailed ticker information
export async function getTickerInfo(ticker: string): Promise<TickerInfo | null> {
  try {
    const response: AxiosResponse<TickerInfoResponse> = await marketstackAPI.get('/tickerinfo', {
      params: { ticker },
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching ticker info:', error);
    throw error;
  }
}

// Updated function to get current price with full stock information
// Uses EOD data as primary source (more reliable for international stocks)
// Falls back to intraday data only for US stocks that have real-time data
export async function getStockWithPrice(symbol: string): Promise<StockSearchResult | null> {
  try {
    let priceData: EODData | IntradayData | null = null;
    let dataSource = 'EOD';
    
    // For US stocks, try intraday first for real-time data
    if (symbol.includes('.') === false || symbol.endsWith('.US')) {
      try {
        priceData = await getLatestIntradayPrice(symbol);
        dataSource = 'Intraday';
      } catch (intradayError: any) {
        // Check if it's a subscription plan issue (403 error)
        if (intradayError.message?.includes('subscription plan doesn\'t support')) {
          console.warn(`Intraday data not available for ${symbol} - subscription plan limitation, falling back to EOD`);
        } else {
          console.warn(`Intraday data not available for ${symbol}, falling back to EOD:`, intradayError.message);
        }
      }
    }
    
    // If intraday failed or not applicable, use EOD data
    if (!priceData) {
      try {
        priceData = await getLatestPrice(symbol);
        dataSource = 'EOD';
      } catch (eodError) {
        console.error(`EOD data not available for ${symbol}:`, eodError);
        return null;
      }
    }
    
    if (!priceData) return null;
    
    const exchangeCode = priceData.exchange || '';
    const nativeCurrency = getExchangeCurrency(exchangeCode);
    const nativePrice = priceData.close;
    
    // Convert to USD if needed
    let usdPrice = nativePrice;
    let conversionRate = 1;
    
    if (nativeCurrency !== 'USD') {
      try {
        // Import currency conversion function
        const { convertCurrency } = await import('./currency');
        const conversion = await convertCurrency(nativeCurrency, 'USD', nativePrice);
        usdPrice = conversion.convertedAmount || nativePrice;
        conversionRate = conversion.rate;
      } catch (conversionError) {
        console.warn('Currency conversion failed, using native price:', conversionError);
        usdPrice = nativePrice;
        conversionRate = 1;
      }
    }
    
    // Map asset type and subtype
    const assetType = priceData.asset_type || '';
    const mappedType = mapMarketstackAssetTypeToAssetType(
      assetType, 
      priceData.symbol, 
      priceData.name || '', 
      priceData.exchange_code || ''
    );
    const mappedSubType = determineAssetSubTypeFromMarketstack(
      assetType, 
      priceData.symbol, 
      priceData.name || ''
    );

    return {
      symbol: priceData.symbol,
      name: priceData.name || priceData.symbol, // Fallback to symbol if name is empty
      exchange: priceData.exchange || '',
      exchange_code: priceData.exchange_code || '',
      country: '', // We'll get this from the search results instead
      currency: 'USD', // User's preferred currency
      native_currency: nativeCurrency,
      current_price: nativePrice,
      current_price_usd: usdPrice,
      conversion_rate: conversionRate,
      sector: '',
      industry: '',
      asset_type: assetType,
      type: mappedType,
      subType: mappedSubType,
    };
  } catch (error) {
    console.error('Error fetching stock with price:', error);
    throw error;
  }
}

// Debounced search function for real-time suggestions
export function createDebouncedSearch<T extends any[], R>(
  func: (...args: T) => Promise<R>,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

// Export debounced search function
export const debouncedSearchTickers = createDebouncedSearch(searchTickers, 300);
