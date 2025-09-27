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
  account: {
    type: 'account',
    label: 'Connected Accounts',
    description: 'Bank and brokerage accounts connected via Plaid',
    icon: '🔗',
    color: 'blue',
    requiresSymbol: false,
    requiresExchange: false,
    hasPriceUpdates: false,
    formComponent: 'BanksBrokeragesForm',
    category: 'financial',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD'],
    customFields: ['institution', 'providerAccountId', 'mask'],
    validationRules: {
      minValue: 0,
      requiredFields: ['name', 'institution', 'providerAccountId'],
      optionalFields: ['officialName', 'mask', 'description']
    }
  },
  equity: {
    type: 'equity',
    label: 'Equity',
    description: 'Individual stocks and equity securities',
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
  etf: {
    type: 'etf',
    label: 'ETF',
    description: 'Exchange-traded funds',
    icon: '📊',
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
  'mutual fund': {
    type: 'mutual fund',
    label: 'Mutual Fund',
    description: 'Mutual funds and investment funds',
    icon: '📈',
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
  'fixed income': {
    type: 'fixed income',
    label: 'Fixed Income',
    description: 'Bonds and fixed income securities',
    icon: '🏛️',
    color: 'green',
    requiresSymbol: true,
    requiresExchange: true,
    hasPriceUpdates: true,
    formComponent: 'StockTickerForm',
    category: 'financial',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'],
    customFields: ['sector', 'industry', 'maturity'],
    validationRules: {
      minValue: 0,
      requiredFields: ['name', 'symbol', 'exchange', 'quantity', 'costBasis'],
      optionalFields: ['currentPrice', 'sector', 'industry']
    }
  },
  derivative: {
    type: 'derivative',
    label: 'Derivative',
    description: 'Options, warrants, and other derivatives',
    icon: '⚡',
    color: 'purple',
    requiresSymbol: true,
    requiresExchange: true,
    hasPriceUpdates: true,
    formComponent: 'StockTickerForm',
    category: 'financial',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'],
    customFields: ['sector', 'industry', 'strike', 'expiration'],
    validationRules: {
      minValue: 0,
      requiredFields: ['name', 'symbol', 'exchange', 'quantity', 'costBasis'],
      optionalFields: ['currentPrice', 'sector', 'industry']
    }
  },
  cryptocurrency: {
    type: 'cryptocurrency',
    label: 'Cryptocurrency',
    description: 'Digital currencies and crypto assets',
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
  loan: {
    type: 'loan',
    label: 'Loan',
    description: 'Loans and loan receivables',
    icon: '🏦',
    color: 'red',
    requiresSymbol: false,
    requiresExchange: false,
    hasPriceUpdates: false,
    formComponent: 'ManualAssetForm',
    category: 'financial',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'],
    customFields: ['borrower', 'interestRate', 'maturity'],
    validationRules: {
      minValue: 0,
      requiredFields: ['name', 'currentValue', 'currency'],
      optionalFields: ['borrower', 'interestRate', 'maturity']
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
  other: {
    type: 'other',
    label: 'Other Assets',
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
  },
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
    types: ['account', 'equity', 'etf', 'mutual fund', 'fixed income', 'derivative', 'cryptocurrency', 'loan', 'cash'] as Asset['type'][]
  },
  digital: {
    label: 'Digital Assets',
    description: 'Cryptocurrencies and digital currencies',
    icon: '💻',
    types: ['cryptocurrency'] as Asset['type'][]
  },
  physical: {
    label: 'Physical Assets',
    description: 'Tangible assets and real estate',
    icon: '🏘️',
    types: [] as Asset['type'][]
  },
  generic: {
    label: 'Other Assets',
    description: 'Manual and custom assets',
    icon: '📋',
    types: ['other'] as Asset['type'][]
  }
} as const;

// Popular asset types for quick access
export const POPULAR_ASSET_TYPES: Asset['type'][] = [
  'account',
  'equity',
  'cash',
  'cryptocurrency',
  'other'
];

// Asset types that require symbol/exchange validation
export const SYMBOL_REQUIRED_TYPES: Asset['type'][] = [
  'equity',
  'etf',
  'mutual fund',
  'fixed income',
  'derivative',
  'cryptocurrency'
];

export const EXCHANGE_REQUIRED_TYPES: Asset['type'][] = [
  'equity',
  'etf',
  'mutual fund',
  'fixed income',
  'derivative',
  'cryptocurrency'
];

// Asset types that support price updates
export const PRICE_UPDATE_SUPPORTED_TYPES: Asset['type'][] = [
  'equity',
  'etf',
  'mutual fund',
  'fixed income',
  'derivative',
  'cryptocurrency'
];
