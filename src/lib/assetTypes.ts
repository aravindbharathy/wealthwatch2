import { Asset } from './firebase/types';

export interface AssetTypeConfig {
  type: Asset['type'];
  label: string;
  description: string;
  icon: string;
  color: string;
  requiresSymbol: boolean;
  requiresExchange: boolean;
  hasPriceUpdates: boolean;
  formComponent: string;
  category: 'financial' | 'physical' | 'digital' | 'generic';
  supportedCurrencies: string[];
  customFields?: string[];
  validationRules?: {
    minValue?: number;
    maxValue?: number;
    requiredFields: string[];
    optionalFields: string[];
  };
}

export const ASSET_TYPES: Record<Asset['type'], AssetTypeConfig> = {
  stock_ticker: {
    type: 'stock_ticker',
    label: 'Stock Tickers',
    description: 'Individual stocks, ETFs, and mutual funds',
    icon: '🐂',
    color: 'blue',
    requiresSymbol: true,
    requiresExchange: true,
    hasPriceUpdates: true,
    formComponent: 'StockTickerForm',
    category: 'financial',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'],
    customFields: ['sector', 'industry', 'marketCap'],
    validationRules: {
      minValue: 0,
      requiredFields: ['name', 'symbol', 'exchange', 'quantity', 'costBasis'],
      optionalFields: ['currentPrice', 'sector', 'industry']
    }
  },
  cash: {
    type: 'cash',
    label: 'Cash',
    description: 'Cash and cash equivalents',
    icon: '💰',
    color: 'green',
    requiresSymbol: false,
    requiresExchange: false,
    hasPriceUpdates: false,
    formComponent: 'CashForm',
    category: 'financial',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL', 'MXN'],
    customFields: ['accountType', 'institution'],
    validationRules: {
      minValue: 0,
      requiredFields: ['name', 'currentValue', 'currency'],
      optionalFields: ['accountType', 'institution', 'description']
    }
  },
  crypto_ticker: {
    type: 'crypto_ticker',
    label: 'Crypto Tickers',
    description: 'Individual cryptocurrencies',
    icon: '🐕',
    color: 'orange',
    requiresSymbol: true,
    requiresExchange: true,
    hasPriceUpdates: true,
    formComponent: 'CryptoForm',
    category: 'digital',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'BTC', 'ETH'],
    customFields: ['walletAddress', 'blockchain'],
    validationRules: {
      minValue: 0,
      requiredFields: ['name', 'symbol', 'exchange', 'quantity', 'costBasis'],
      optionalFields: ['walletAddress', 'blockchain']
    }
  },
  crypto_exchange_wallet: {
    type: 'crypto_exchange_wallet',
    label: 'Crypto Exchanges & Wallets',
    description: 'Crypto exchange accounts and wallets',
    icon: '🦊',
    color: 'purple',
    requiresSymbol: false,
    requiresExchange: true,
    hasPriceUpdates: false,
    formComponent: 'CryptoExchangeForm',
    category: 'digital',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'BTC', 'ETH'],
    customFields: ['exchangeType', 'accountId'],
    validationRules: {
      minValue: 0,
      requiredFields: ['name', 'exchange', 'currentValue', 'currency'],
      optionalFields: ['exchangeType', 'accountId', 'description']
    }
  },
  home: {
    type: 'home',
    label: 'Homes',
    description: 'Real estate properties',
    icon: '🏠',
    color: 'red',
    requiresSymbol: false,
    requiresExchange: false,
    hasPriceUpdates: false,
    formComponent: 'HomeForm',
    category: 'physical',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'],
    customFields: ['address', 'yearBuilt', 'squareFeet', 'propertyType'],
    validationRules: {
      minValue: 0,
      requiredFields: ['name', 'currentValue', 'currency'],
      optionalFields: ['address', 'yearBuilt', 'squareFeet', 'propertyType', 'purchasePrice']
    }
  },
  car: {
    type: 'car',
    label: 'Cars',
    description: 'Vehicles and automobiles',
    icon: '🚗',
    color: 'indigo',
    requiresSymbol: false,
    requiresExchange: false,
    hasPriceUpdates: false,
    formComponent: 'CarForm',
    category: 'physical',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'],
    customFields: ['make', 'model', 'year', 'vin', 'mileage', 'condition'],
    validationRules: {
      minValue: 0,
      requiredFields: ['name', 'currentValue', 'currency'],
      optionalFields: ['make', 'model', 'year', 'vin', 'mileage', 'condition', 'purchasePrice']
    }
  },
  precious_metals: {
    type: 'precious_metals',
    label: 'Precious Metals',
    description: 'Gold, silver, and other precious metals',
    icon: '🥇',
    color: 'yellow',
    requiresSymbol: false,
    requiresExchange: false,
    hasPriceUpdates: true,
    formComponent: 'PreciousMetalsForm',
    category: 'physical',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'],
    customFields: ['metalType', 'purity', 'weight', 'storageLocation'],
    validationRules: {
      minValue: 0,
      requiredFields: ['name', 'currentValue', 'currency'],
      optionalFields: ['metalType', 'purity', 'weight', 'storageLocation', 'purchasePrice']
    }
  },
  generic_asset: {
    type: 'generic_asset',
    label: 'Manual Assets',
    description: 'Any other asset type',
    icon: '📦',
    color: 'gray',
    requiresSymbol: false,
    requiresExchange: false,
    hasPriceUpdates: false,
    formComponent: 'ManualAssetForm',
    category: 'generic',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL', 'MXN'],
    customFields: ['category', 'tags'],
    validationRules: {
      minValue: 0,
      requiredFields: ['name', 'currentValue', 'currency'],
      optionalFields: ['category', 'tags', 'description']
    }
  }
};

// Helper functions
export const getAssetTypeConfig = (type: Asset['type']): AssetTypeConfig => {
  return ASSET_TYPES[type];
};

export const getAssetTypesByCategory = (category: AssetTypeConfig['category']): AssetTypeConfig[] => {
  return Object.values(ASSET_TYPES).filter(config => config.category === category);
};

export const getAssetTypeIcon = (type: Asset['type']): string => {
  return ASSET_TYPES[type]?.icon || '📦';
};

export const getAssetTypeColor = (type: Asset['type']): string => {
  return ASSET_TYPES[type]?.color || 'gray';
};

export const isAssetTypeSupported = (type: string): type is Asset['type'] => {
  return type in ASSET_TYPES;
};

// Asset type categories for organization
export const ASSET_CATEGORIES = {
  financial: {
    label: 'Financial Assets',
    description: 'Traditional financial instruments',
    icon: '💼',
    types: ['stock_ticker', 'cash'] as Asset['type'][]
  },
  digital: {
    label: 'Digital Assets',
    description: 'Cryptocurrencies and digital currencies',
    icon: '💻',
    types: ['crypto_ticker', 'crypto_exchange_wallet'] as Asset['type'][]
  },
  physical: {
    label: 'Physical Assets',
    description: 'Tangible assets and real estate',
    icon: '🏘️',
    types: ['home', 'car', 'precious_metals'] as Asset['type'][]
  },
  generic: {
    label: 'Other Assets',
    description: 'Manual and custom assets',
    icon: '📋',
    types: ['generic_asset'] as Asset['type'][]
  }
} as const;

// Popular asset types for quick access
export const POPULAR_ASSET_TYPES: Asset['type'][] = [
  'stock_ticker',
  'cash',
  'crypto_ticker',
  'home',
  'car',
  'generic_asset'
];

// Asset types that require symbol/exchange validation
export const SYMBOL_REQUIRED_TYPES: Asset['type'][] = [
  'stock_ticker',
  'crypto_ticker'
];

export const EXCHANGE_REQUIRED_TYPES: Asset['type'][] = [
  'stock_ticker',
  'crypto_ticker',
  'crypto_exchange_wallet'
];

// Asset types that support price updates
export const PRICE_UPDATE_SUPPORTED_TYPES: Asset['type'][] = [
  'stock_ticker',
  'crypto_ticker',
  'precious_metals'
];
