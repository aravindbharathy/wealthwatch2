# Marketstack API Guide for Portfolio Tracking Applications

## Table of Contents
- [Overview](#overview)  
- [Authentication](#authentication)  
- [End-of-Day (EOD) Data](#end-of-day-eod-data)  
  - [Endpoint & Parameters](#endpoint--parameters)  
  - [Request Examples](#request-examples)  
  - [Sample Response](#sample-response)  
- [Intraday & Real-Time Data](#intraday--real-time-data)  
  - [Intraday Endpoint](#intraday-endpoint)  
  - [Real-Time Stock Price Endpoint](#real-time-stock-price-endpoint)  
  - [Request Examples](#request-examples-1)  
  - [Sample Response](#sample-response-1)  
- [Historical Data Usage](#historical-data-usage)  
- [Corporate Actions](#corporate-actions)  
  - [Splits](#splits)  
  - [Dividends](#dividends)  
- [Instrument & Company Information](#instrument--company-information)  
  - [Ticker Metadata](#ticker-metadata)  
  - [Company Profile](#company-profile)  
- [Bulk Ticker Discovery](#bulk-ticker-discovery)  
- [Commodity Prices](#commodity-prices)  
  - [Live Commodity Data](#live-commodity-data)  
  - [Historical Commodity Data](#historical-commodity-data)  
- [Stock Market Indices](#stock-market-indices)  
  - [List of Indices](#list-of-indices)  
  - [Index Details](#index-details)  
- [Analyst Ratings](#analyst-ratings)  
- [Usage Patterns & Best Practices](#usage-patterns--best-practices)  
- [TypeScript Integration Examples](#typescript-integration-examples)  
- [Type Definitions](#type-definitions)

---

## Overview  
This guide details how to integrate the Marketstack API into a portfolio-tracking application. It covers authentication, key endpoints, parameters, response structures, and examples for:  
- End-of-Day pricing  
- Intraday and real-time data  
- Historical ranges  
- Corporate actions (splits, dividends)  
- Instrument metadata and company profiles  
- Commodity prices  
- Market indices  
- Analyst ratings  

---

## Authentication  
Include your access key as the `access_key` query parameter in every request.  
```txt
Your API key: 049b900a4109c9c608a0ca696e73f0c6
Base URL: https://api.marketstack.com/v2
```

---

## End-of-Day (EOD) Data  

### Endpoint & Parameters  
**GET** `/eod`  
Required:  
- `access_key`  
- `symbols` (comma-separated tickers)  

Optional filters:  
- `date_from`, `date_to` (YYYY-MM-DD)  
- `exchange` (MIC code)  
- `sort` (`ASC`/`DESC`)  
- `limit`, `offset`  

### Request Examples  
```http
GET https://api.marketstack.com/v2/eod
? access_key=049b900a4109c9c608a0ca696e73f0c6
& symbols=AAPL,MSFT
& date_from=2025-01-01
& date_to=2025-09-08
& sort=ASC
& limit=100
```  
```http
# Latest available closing price for Google
GET https://api.marketstack.com/v2/eod/latest
? access_key=049b900a4109c9c608a0ca696e73f0c6
& symbols=GOOGL
```

### Sample Response  
```json
{
  "pagination": { "limit": 100, "offset": 0, "count": 2, "total": 2 },
  "data": [
    {
      "date": "2025-01-02T00:00:00+0000",
      "open": 133.52,
      "high": 135.00,
      "low": 132.30,
      "close": 134.12,
      "volume": 25000000,
      "adj_close": 134.12,
      "split_factor": 1,
      "dividend": 0,
      "symbol": "AAPL",
      "exchange_code": "NASDAQ"
    },
    { â€¦ }
  ]
}
```

---

## Intraday & Real-Time Data  

### Intraday Endpoint  
**GET** `/intraday`  
Required:  
- `access_key`  
- `symbols`  

Optional:  
- `interval` (`1min`, `5min`, `1hour`, etc.)  
- `date_from`, `date_to`  
- `after_hours=true`  
- `sort`, `limit`, `offset`  

### Real-Time Stock Price Endpoint  
**GET** `/stockprice`  
Required:  
- `access_key`  
- `ticker`  

Optional:  
- `exchange`  

### Request Examples  
```http
# 5-minute intraday series for Apple
GET https://api.marketstack.com/v2/intraday
? access_key=049b900a4109c9c608a0ca696e73f0c6
& symbols=AAPL
& interval=5min
& limit=50

# Live MSFT price on NASDAQ
GET https://api.marketstack.com/v2/stockprice
? access_key=049b900a4109c9c608a0ca696e73f0c6
& ticker=MSFT
& exchange=XNAS
```

### Sample Response  
```json
{
  "pagination": { "limit": 50, "offset": 0, "count": 2, "total": 2 },
  "data": [
    {
      "date": "2025-09-09T15:30:00+0000",
      "open": 248.10,
      "high": 249.00,
      "low": 247.50,
      "close": 248.75,
      "volume": 1200000,
      "mid": 248.55,
      "symbol": "AAPL",
      "exchange": "IEXG"
    },
    { â€¦ }
  ]
}
```

---

## Historical Data Usage  
- EOD: up to 15 years back with `date_from`/`date_to`.  
- Intraday: up to 10,000 data points per interval.  

---

## Corporate Actions  

### Splits  
**GET** `/splits`  
Parameters: `access_key`, `symbols`, optional `date_from`, `date_to`, `sort`, `limit`, `offset`  
**Example**  
```http
GET https://api.marketstack.com/v2/splits
? access_key=â€¦
& symbols=AAPL
```

### Dividends  
**GET** `/dividends`  
Same parameters as `/splits`  
**Example**  
```http
GET https://api.marketstack.com/v2/dividends
? access_key=â€¦
& symbols=MSFT
& date_from=2025-01-01
```

---

## Instrument & Company Information  

### Ticker Metadata  
**GET** `/tickers/{symbol}`  
**Example**  
```http
GET https://api.marketstack.com/v2/tickers/AAPL
? access_key=049b900a4109c9c608a0ca696e73f0c6
```

### Company Profile  
**GET** `/tickerinfo`  
Parameters: `access_key`, `ticker`  
**Example**  
```http
GET https://api.marketstack.com/v2/tickerinfo
? access_key=â€¦
& ticker=MSFT
```

---

## Bulk Ticker Discovery  

### All Supported Tickers  
**GET** `/tickerslist`  
Parameters: `access_key`, optional `search`, `exchange`, `limit`, `offset`  
**Example**  
```http
GET https://api.marketstack.com/v2/tickerslist
? access_key=â€¦
& limit=500
```

---

## Commodity Prices  

### Live Commodity Data  
**GET** `/commodities`  
Parameters: `access_key`, `commodity_name`  
**Example**  
```http
GET https://api.marketstack.com/v2/commodities
? access_key=â€¦
& commodity_name=gold
```

### Historical Commodity Data  
**GET** `/commoditieshistory`  
Parameters: `access_key`, `commodity_name`, `date_from`, `date_to`, `frequency`  
**Example**  
```http
GET https://api.marketstack.com/v2/commoditieshistory
? access_key=â€¦
& commodity_name=aluminum
& date_from=2024-01-01
& date_to=2025-01-01
& frequency=1month
```

---

## Stock Market Indices  

### List of Indices  
**GET** `/indexlist`  
**Example**  
```http
GET https://api.marketstack.com/v2/indexlist
? access_key=â€¦
```

### Index Details  
**GET** `/indexinfo`  
Parameters: `access_key`, `index`  
**Example**  
```http
GET https://api.marketstack.com/v2/indexinfo
? access_key=â€¦
& index=sp500
```

---

## Analyst Ratings  
**GET** `/companyratings`  
Parameters: `access_key`, `ticker`, optional `date_from`, `date_to`, `rated`  
**Example**  
```http
GET https://api.marketstack.com/v2/companyratings
? access_key=â€¦
& ticker=AAPL
& date_from=2025-01-01
& date_to=2025-09-01
& rated=buy
```

---

## Usage Patterns & Best Practices  
- **Batch Queries:** Fetch up to 100 symbols per request.  
- **Pagination:** Use `limit`/`offset` to iterate large result sets.  
- **Adjusted Prices:** Use `adj_*` fields for total-return calculations.  
- **Rate Limits:** Free plan = 5 requests/sec; upgrade for higher frequency.  
- **Error Handling:** Handle `429` with retries and exponential backoff.  

---

## TypeScript Integration Examples  

### Basic Setup
```typescript
import axios, { AxiosResponse } from 'axios';

const API_KEY = '049b900a4109c9c608a0ca696e73f0c6';
const BASE_URL = 'https://api.marketstack.com/v2';

// Create axios instance with default config
const marketstackAPI = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  params: {
    access_key: API_KEY,
  },
});
```

### End-of-Day Data Functions
```typescript
interface EODDataParams {
  symbols: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  sort?: 'ASC' | 'DESC';
}

async function fetchEOD(params: EODDataParams): Promise<EODData[]> {
  try {
    const response: AxiosResponse<EODResponse> = await marketstackAPI.get('/eod', {
      params: {
        symbols: params.symbols.join(','),
        date_from: params.dateFrom,
        date_to: params.dateTo,
        limit: params.limit || 100,
        offset: params.offset || 0,
        sort: params.sort || 'DESC',
      },
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching EOD data:', error);
    throw error;
  }
}

// Usage example
const eodData = await fetchEOD({
  symbols: ['AAPL', 'MSFT'],
  dateFrom: '2025-01-01',
  dateTo: '2025-09-08',
  limit: 100,
});
```

### Intraday Data Functions
```typescript
interface IntradayDataParams {
  symbols: string[];
  interval?: '1min' | '5min' | '10min' | '15min' | '30min' | '1hour' | '3hour' | '6hour' | '12hour' | '24hour';
  dateFrom?: string;
  dateTo?: string;
  afterHours?: boolean;
  limit?: number;
  offset?: number;
}

async function fetchIntraday(params: IntradayDataParams): Promise<IntradayData[]> {
  try {
    const response: AxiosResponse<IntradayResponse> = await marketstackAPI.get('/intraday', {
      params: {
        symbols: params.symbols.join(','),
        interval: params.interval || '1hour',
        date_from: params.dateFrom,
        date_to: params.dateTo,
        after_hours: params.afterHours,
        limit: params.limit || 100,
        offset: params.offset || 0,
      },
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching intraday data:', error);
    throw error;
  }
}

// Usage example
const intradayData = await fetchIntraday({
  symbols: ['AAPL'],
  interval: '5min',
  afterHours: true,
  limit: 50,
});
```

### Real-Time Stock Price
```typescript
async function fetchRealTimePrice(ticker: string, exchange?: string): Promise<StockPrice[]> {
  try {
    const response: AxiosResponse<StockPriceResponse> = await marketstackAPI.get('/stockprice', {
      params: {
        ticker,
        exchange,
      },
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching real-time price:', error);
    throw error;
  }
}

// Usage example
const msftPrice = await fetchRealTimePrice('MSFT', 'XNAS');
```

### Corporate Actions
```typescript
async function fetchDividends(symbols: string[], dateFrom?: string, dateTo?: string): Promise<DividendData[]> {
  try {
    const response: AxiosResponse<DividendResponse> = await marketstackAPI.get('/dividends', {
      params: {
        symbols: symbols.join(','),
        date_from: dateFrom,
        date_to: dateTo,
      },
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching dividends:', error);
    throw error;
  }
}

async function fetchSplits(symbols: string[], dateFrom?: string, dateTo?: string): Promise<SplitData[]> {
  try {
    const response: AxiosResponse<SplitResponse> = await marketstackAPI.get('/splits', {
      params: {
        symbols: symbols.join(','),
        date_from: dateFrom,
        date_to: dateTo,
      },
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching splits:', error);
    throw error;
  }
}

// Usage examples
const dividends = await fetchDividends(['MSFT'], '2025-01-01');
const splits = await fetchSplits(['AAPL'], '2024-01-01', '2025-01-01');
```

### Company Information
```typescript
async function fetchTickerInfo(ticker: string): Promise<TickerInfo> {
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

async function fetchTickerMetadata(symbol: string): Promise<TickerMetadata> {
  try {
    const response: AxiosResponse<TickerMetadata> = await marketstackAPI.get(`/tickers/${symbol}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ticker metadata:', error);
    throw error;
  }
}

// Usage examples
const msftInfo = await fetchTickerInfo('MSFT');
const aaplMetadata = await fetchTickerMetadata('AAPL');
```

### Portfolio Class Example
```typescript
class MarketstackPortfolioTracker {
  private apiKey: string;
  private baseURL: string;
  private api: any;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.marketstack.com/v2';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      params: { access_key: this.apiKey },
    });
  }

  async getPortfolioData(symbols: string[]): Promise<PortfolioData> {
    try {
      // Fetch current prices
      const currentPrices = await this.fetchLatestPrices(symbols);
      
      // Fetch historical data for performance calculation
      const historicalData = await this.fetchHistoricalData(symbols, '2024-01-01');
      
      // Fetch dividends for income calculation
      const dividends = await this.fetchDividends(symbols, '2024-01-01');
      
      return {
        currentPrices,
        historicalData,
        dividends,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      throw error;
    }
  }

  private async fetchLatestPrices(symbols: string[]): Promise<EODData[]> {
    const response = await this.api.get('/eod/latest', {
      params: { symbols: symbols.join(',') },
    });
    return response.data.data;
  }

  private async fetchHistoricalData(symbols: string[], dateFrom: string): Promise<EODData[]> {
    const response = await this.api.get('/eod', {
      params: {
        symbols: symbols.join(','),
        date_from: dateFrom,
        limit: 1000,
      },
    });
    return response.data.data;
  }

  private async fetchDividends(symbols: string[], dateFrom: string): Promise<DividendData[]> {
    const response = await this.api.get('/dividends', {
      params: {
        symbols: symbols.join(','),
        date_from: dateFrom,
      },
    });
    return response.data.data;
  }
}

// Usage
const portfolio = new MarketstackPortfolioTracker('049b900a4109c9c608a0ca696e73f0c6');
const data = await portfolio.getPortfolioData(['AAPL', 'MSFT', 'GOOGL']);
```

---

## Type Definitions

```typescript
interface Pagination {
  limit: number;
  offset: number;
  count: number;
  total: number;
}

interface EODData {
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

interface EODResponse {
  pagination: Pagination;
  data: EODData[];
}

interface IntradayData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  mid?: number;
  last?: number;
  last_size?: number;
  bid_price?: number;
  bid_size?: number;
  ask_price?: number;
  ask_size?: number;
  marketstack_last?: number;
  symbol: string;
  exchange: string;
}

interface IntradayResponse {
  pagination: Pagination;
  data: IntradayData[];
}

interface StockPrice {
  exchange_code: string;
  exchange_name: string;
  country: string;
  ticker: string;
  price: string;
  currency: string;
  trade_last: string;
}

interface StockPriceResponse {
  data: StockPrice[];
}

interface DividendData {
  date: string;
  dividend: number;
  payment_date: string;
  record_date: string;
  declaration_date: string;
  distr_freq: string;
  symbol: string;
}

interface DividendResponse {
  pagination: Pagination;
  data: DividendData[];
}

interface SplitData {
  date: string;
  split_factor: number;
  stock_split: string;
  symbol: string;
}

interface SplitResponse {
  pagination: Pagination;
  data: SplitData[];
}

interface TickerInfo {
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

interface KeyExecutive {
  name: string;
  salary: string;
  function: string;
  exercised: string;
  birth_year: string;
}

interface Address {
  city: string;
  street1: string;
  street2: string;
  postal_code: string;
  stateOrCountry: string;
  state_or_country_description: string;
}

interface TickerInfoResponse {
  data: TickerInfo;
}

interface TickerMetadata {
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

interface StockExchange {
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

interface PortfolioData {
  currentPrices: EODData[];
  historicalData: EODData[];
  dividends: DividendData[];
  lastUpdated: string;
}
```

---

Use this guide to implement robust portfolio tracking with TypeScript: retrieve prices, chart history, process corporate actions, and enhance dashboards with real-time data while maintaining type safety.