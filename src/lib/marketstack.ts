// Marketstack API integration for WealthWatch
// Based on the Marketstack API documentation

import axios, { AxiosResponse } from 'axios';

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
}

// Search parameters interface
export interface SearchParams {
  search?: string;
  exchange?: string;
  limit?: number;
  offset?: number;
}

// Function to search for tickers using the tickerslist endpoint
export async function searchTickers(params: SearchParams): Promise<StockSearchResult[]> {
  try {
    const response: AxiosResponse<{ data: any[] }> = await marketstackAPI.get('/tickerslist', {
      params: {
        search: params.search,
        exchange: params.exchange,
        limit: params.limit || 50,
        offset: params.offset || 0,
      },
    });
    
    // Filter to only include tickers that have EOD data available
    const filteredTickers = response.data.data.filter((ticker: any) => ticker.has_eod === true);
    
    return filteredTickers.map((ticker: any) => {
      const exchangeCode = ticker.stock_exchange?.mic || '';
      const nativeCurrency = getExchangeCurrency(exchangeCode);
      
      return {
        symbol: ticker.ticker, // Use ticker field, not symbol
        name: ticker.name,
        exchange: ticker.stock_exchange?.name || '',
        exchange_code: ticker.stock_exchange?.acronym || '',
        country: ticker.stock_exchange?.country || '',
        currency: 'USD', // User's preferred currency
        native_currency: nativeCurrency,
        sector: ticker.sector,
        industry: ticker.industry,
      };
    });
  } catch (error) {
    console.error('Error searching tickers:', error);
    throw error;
  }
}

// Function to get latest price for a symbol
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

// Function to get current price with full stock information
export async function getStockWithPrice(symbol: string): Promise<StockSearchResult | null> {
  try {
    // Get the latest price data
    const priceData = await getLatestPrice(symbol);
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
    
    return {
      symbol: priceData.symbol,
      name: priceData.name || '',
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
