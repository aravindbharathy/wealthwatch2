import { NextRequest, NextResponse } from 'next/server';

const API_KEY = '049b900a4109c9c608a0ca696e73f0c6';
const BASE_URL = 'https://api.marketstack.com/v2';

// Core exchanges for FCL search
const CORE_EXCHANGES = [
  'XNYS', // New York Stock Exchange
  'XNAS', // NASDAQ
  'XNSE', // National Stock Exchange of India
  'XBOM', // BSE Ltd (Bombay Stock Exchange)
  'XLON', // London Stock Exchange
];

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

// Exchange name mappings for intelligent search
const EXCHANGE_NAME_MAP: Record<string, string> = {
  'nse': 'XNSE',
  'bse': 'XBOM', 
  'nasdaq': 'XNAS',
  'nyse': 'XNYS',
  'lse': 'XLON',
  'london': 'XLON',
  'bombay': 'XBOM',
  'national': 'XNSE',
  'new york': 'XNYS',
  'newyork': 'XNYS',
};

// Function to parse search query and detect exchange names
function parseSearchQuery(search: string): { ticker: string; targetExchange?: string } {
  const words = search.toLowerCase().split(/\s+/);
  let ticker = '';
  let targetExchange: string | undefined;

  // Look for exchange names in the search query
  for (const word of words) {
    if (EXCHANGE_NAME_MAP[word]) {
      targetExchange = EXCHANGE_NAME_MAP[word];
    } else {
      ticker += (ticker ? ' ' : '') + word;
    }
  }

  // If no exchange detected, use the original search as ticker
  if (!targetExchange) {
    ticker = search;
  }

  return { ticker, targetExchange };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const exchange = searchParams.get('exchange');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log('API Route: Searching for:', search, 'exchange:', exchange, 'limit:', limit);
    
    // Return empty results if search is empty
    if (!search) {
      return NextResponse.json({
        data: [],
        pagination: { limit, offset, count: 0, total: 0 },
      });
    }

    // Parse search query to detect exchange names and extract ticker
    const { ticker, targetExchange } = parseSearchQuery(search);
    console.log('Parsed search - ticker:', ticker, 'targetExchange:', targetExchange);
    
    // If specific exchange is provided, search only that exchange
    if (exchange) {
      const response = await fetch(`${BASE_URL}/tickerslist?access_key=${API_KEY}&search=${encodeURIComponent(ticker)}&exchange=${exchange}&limit=${limit}&offset=${offset}`);
      const data = await response.json();
      
      return NextResponse.json({
        data: data.data || [],
        pagination: data.pagination || { limit, offset, count: 0, total: 0 },
      });
    }

    // If target exchange was detected, search only that exchange
    if (targetExchange) {
      console.log(`Searching specific exchange: ${targetExchange} for ticker: ${ticker}`);
      const response = await fetch(`${BASE_URL}/tickerslist?access_key=${API_KEY}&search=${encodeURIComponent(ticker)}&exchange=${targetExchange}&limit=${limit}&offset=${offset}`);
      const data = await response.json();
      
      // Process the results through the same formatting logic
      const rawResults = data.data || [];
      
      // Filter to only include tickers that have EOD data available
      const filteredResults = rawResults.filter((ticker: any) => ticker.has_eod === true);
      
      // Sort by relevance (exact matches first, then partial matches)
      const sortedResults = filteredResults.sort((a: any, b: any) => {
        const searchTerm = ticker.toLowerCase();
        const aTicker = (a.ticker || '').toLowerCase();
        const bTicker = (b.ticker || '').toLowerCase();
        
        // Exact ticker match gets highest priority
        if (aTicker === searchTerm && bTicker !== searchTerm) return -1;
        if (bTicker === searchTerm && aTicker !== searchTerm) return 1;
        
        // Ticker starts with search term
        if (aTicker.startsWith(searchTerm) && !bTicker.startsWith(searchTerm)) return -1;
        if (bTicker.startsWith(searchTerm) && !aTicker.startsWith(searchTerm)) return 1;
        
        return 0;
      });
      
      // Convert to StockSearchResult format
      const processedResults = sortedResults.map((ticker: any) => {
        const exchangeCode = ticker.stock_exchange?.mic || '';
        const nativeCurrency = getExchangeCurrency(exchangeCode);
        
        return {
          symbol: ticker.ticker,
          name: ticker.name,
          exchange: ticker.stock_exchange?.name || '',
          exchange_code: ticker.stock_exchange?.acronym || '',
          country: ticker.stock_exchange?.country || '',
          currency: 'USD', // User's preferred currency
          native_currency: nativeCurrency,
          current_price: 0, // Will be fetched separately when stock is selected
          current_price_usd: 0, // Will be fetched separately when stock is selected
          conversion_rate: 1, // Will be calculated when stock is selected
          sector: ticker.sector,
          industry: ticker.industry,
        };
      });
      
      console.log(`API Route: Returning ${processedResults.length} results from ${targetExchange}`);
      
      return NextResponse.json({
        data: processedResults,
        pagination: {
          limit,
          offset,
          count: processedResults.length,
          total: processedResults.length,
        },
      });
    }

    // Search across core exchanges
    const allResults: any[] = [];
    
    for (const exchangeCode of CORE_EXCHANGES) {
      try {
        console.log(`Searching ${exchangeCode}...`);
        const response = await fetch(`${BASE_URL}/tickerslist?access_key=${API_KEY}&search=${encodeURIComponent(ticker)}&exchange=${exchangeCode}&limit=10&offset=0`);
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          allResults.push(...data.data);
          console.log(`Found ${data.data.length} results from ${exchangeCode}`);
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Search failed for exchange ${exchangeCode}:`, error);
      }
    }

    // Remove duplicates
    const uniqueResults = allResults.filter((ticker, index, self) => 
      index === self.findIndex(t => t.ticker === ticker.ticker)
    );

    // Filter to only include tickers that have EOD data available
    const filteredResults = uniqueResults.filter(ticker => ticker.has_eod === true);

    // Sort by relevance (exact matches first, then partial matches)
    const sortedResults = filteredResults.sort((a, b) => {
      const searchTerm = ticker.toLowerCase();
      const aTicker = (a.ticker || '').toLowerCase();
      const bTicker = (b.ticker || '').toLowerCase();
      
      // Exact ticker match gets highest priority
      if (aTicker === searchTerm && bTicker !== searchTerm) return -1;
      if (bTicker === searchTerm && aTicker !== searchTerm) return 1;
      
      // Ticker starts with search term
      if (aTicker.startsWith(searchTerm) && !bTicker.startsWith(searchTerm)) return -1;
      if (bTicker.startsWith(searchTerm) && !aTicker.startsWith(searchTerm)) return 1;
      
      return 0;
    });

    // Limit results
    const limitedResults = sortedResults.slice(0, limit);
    
    // Convert to StockSearchResult format
    const processedResults = limitedResults.map((ticker: any) => {
      const exchangeCode = ticker.stock_exchange?.mic || '';
      const nativeCurrency = getExchangeCurrency(exchangeCode);
      
      return {
        symbol: ticker.ticker,
        name: ticker.name,
        exchange: ticker.stock_exchange?.name || '',
        exchange_code: ticker.stock_exchange?.acronym || '',
        country: ticker.stock_exchange?.country || '',
        currency: 'USD', // User's preferred currency
        native_currency: nativeCurrency,
        current_price: 0, // Will be fetched separately when stock is selected
        current_price_usd: 0, // Will be fetched separately when stock is selected
        conversion_rate: 1, // Will be calculated when stock is selected
        sector: ticker.sector,
        industry: ticker.industry,
      };
    });
    
    console.log(`API Route: Returning ${processedResults.length} results`);
    
    return NextResponse.json({
      data: processedResults,
      pagination: {
        limit,
        offset,
        count: processedResults.length,
        total: processedResults.length,
      },
    });
  } catch (error) {
    console.error('Error in marketstack search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
