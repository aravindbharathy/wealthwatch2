// Seed Data Utilities for WealthWatch Investment Tracker
// Functions to populate the database with initial data and sample records

import { Timestamp } from 'firebase/firestore';
import {
  createTicker,
  createCategory,
  createUser,
  createAsset,
  createDebt,
  createAccount,
  createGoal,
} from './firebaseUtils';
import {
  Ticker,
  Category,
  User,
  CreateAssetInput,
  CreateDebtInput,
  CreateAccountInput,
  CreateGoalInput,
} from './types';

// ============================================================================
// SAMPLE TICKER DATA
// ============================================================================

export const sampleTickers: Omit<Ticker, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Major Stocks
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
    marketCap: 3000000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Technology',
    industry: 'Software',
    description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
    marketCap: 2800000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Technology',
    industry: 'Internet Content & Information',
    description: 'Alphabet Inc. provides online advertising services in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
    marketCap: 1800000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Consumer Discretionary',
    industry: 'Internet Retail',
    description: 'Amazon.com Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally.',
    marketCap: 1500000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Consumer Discretionary',
    industry: 'Auto Manufacturers',
    description: 'Tesla Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.',
    marketCap: 800000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Technology',
    industry: 'Internet Content & Information',
    description: 'Meta Platforms Inc. develops products that help people connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables worldwide.',
    marketCap: 700000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Technology',
    industry: 'Semiconductors',
    description: 'NVIDIA Corporation operates as a computing company in the United States, Taiwan, China, Hong Kong, and internationally.',
    marketCap: 1200000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'BRK.A',
    name: 'Berkshire Hathaway Inc.',
    type: 'stock',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Financial Services',
    industry: 'Insurance',
    description: 'Berkshire Hathaway Inc., through its subsidiaries, engages in the insurance, freight rail transportation, and utility businesses worldwide.',
    marketCap: 700000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    type: 'stock',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Financial Services',
    industry: 'Banks',
    description: 'JPMorgan Chase & Co. operates as a financial services company worldwide.',
    marketCap: 400000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'V',
    name: 'Visa Inc.',
    type: 'stock',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Financial Services',
    industry: 'Credit Services',
    description: 'Visa Inc. operates as a payments technology company worldwide.',
    marketCap: 500000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },

  // Cryptocurrencies
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    exchange: 'Global',
    currency: 'USD',
    sector: 'Cryptocurrency',
    industry: 'Digital Currency',
    description: 'Bitcoin is a decentralized digital currency without a central bank or single administrator.',
    marketCap: 600000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    type: 'crypto',
    exchange: 'Global',
    currency: 'USD',
    sector: 'Cryptocurrency',
    industry: 'Digital Currency',
    description: 'Ethereum is a decentralized platform that runs smart contracts.',
    marketCap: 200000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    type: 'crypto',
    exchange: 'Binance',
    currency: 'USD',
    sector: 'Cryptocurrency',
    industry: 'Digital Currency',
    description: 'Binance Coin is the cryptocurrency issued by Binance exchange.',
    marketCap: 50000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    type: 'crypto',
    exchange: 'Global',
    currency: 'USD',
    sector: 'Cryptocurrency',
    industry: 'Digital Currency',
    description: 'Cardano is a blockchain platform for changemakers, innovators, and visionaries.',
    marketCap: 20000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    type: 'crypto',
    exchange: 'Global',
    currency: 'USD',
    sector: 'Cryptocurrency',
    industry: 'Digital Currency',
    description: 'Solana is a high-performance blockchain supporting builders around the world.',
    marketCap: 15000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },

  // ETFs
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    type: 'etf',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Financial Services',
    industry: 'Asset Management',
    description: 'SPDR S&P 500 ETF Trust seeks to provide investment results that correspond generally to the price and yield performance of the S&P 500 Index.',
    marketCap: 400000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    type: 'etf',
    exchange: 'NASDAQ',
    currency: 'USD',
    sector: 'Financial Services',
    industry: 'Asset Management',
    description: 'Invesco QQQ Trust seeks to track the investment results of the NASDAQ-100 Index.',
    marketCap: 200000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  },
  {
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    type: 'etf',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Financial Services',
    industry: 'Asset Management',
    description: 'Vanguard Total Stock Market ETF seeks to track the performance of the CRSP US Total Market Index.',
    marketCap: 300000000000,
    lastUpdated: Timestamp.now(),
    isActive: true
  }
];

// ============================================================================
// SAMPLE CATEGORY DATA
// ============================================================================

export const sampleCategories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Asset Categories
  {
    name: 'Stocks',
    type: 'asset',
    color: '#3B82F6',
    icon: '📈',
    isActive: true
  },
  {
    name: 'Cryptocurrency',
    type: 'asset',
    color: '#F59E0B',
    icon: '₿',
    isActive: true
  },
  {
    name: 'Real Estate',
    type: 'asset',
    color: '#10B981',
    icon: '🏠',
    isActive: true
  },
  {
    name: 'Vehicles',
    type: 'asset',
    color: '#6B7280',
    icon: '🚗',
    isActive: true
  },
  {
    name: 'Cash & Equivalents',
    type: 'asset',
    color: '#059669',
    icon: '💰',
    isActive: true
  },
  {
    name: 'Precious Metals',
    type: 'asset',
    color: '#D97706',
    icon: '🥇',
    isActive: true
  },
  {
    name: 'Collectibles',
    type: 'asset',
    color: '#7C3AED',
    icon: '🎨',
    isActive: true
  },

  // Debt Categories
  {
    name: 'Credit Cards',
    type: 'debt',
    color: '#EF4444',
    icon: '💳',
    isActive: true
  },
  {
    name: 'Mortgages',
    type: 'debt',
    color: '#DC2626',
    icon: '🏠',
    isActive: true
  },
  {
    name: 'Auto Loans',
    type: 'debt',
    color: '#B91C1C',
    icon: '🚗',
    isActive: true
  },
  {
    name: 'Student Loans',
    type: 'debt',
    color: '#991B1B',
    icon: '🎓',
    isActive: true
  },
  {
    name: 'Personal Loans',
    type: 'debt',
    color: '#7F1D1D',
    icon: '💸',
    isActive: true
  },

  // Goal Categories
  {
    name: 'Retirement',
    type: 'goal',
    color: '#1D4ED8',
    icon: '🏛️',
    isActive: true
  },
  {
    name: 'Home Purchase',
    type: 'goal',
    color: '#1E40AF',
    icon: '🏡',
    isActive: true
  },
  {
    name: 'Education',
    type: 'goal',
    color: '#1E3A8A',
    icon: '🎓',
    isActive: true
  },
  {
    name: 'Travel',
    type: 'goal',
    color: '#312E81',
    icon: '✈️',
    isActive: true
  },
  {
    name: 'Emergency Fund',
    type: 'goal',
    color: '#581C87',
    icon: '🚨',
    isActive: true
  }
];

// ============================================================================
// SAMPLE USER DATA
// ============================================================================

export const createSampleUser = (userId: string): Partial<User> => ({
  profile: {
    displayName: 'Sample User',
    email: 'sample@wealthwatch.com',
    photoURL: '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  preferences: {
    defaultCurrency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: '1,234.56',
    notifications: {
      email: true,
      push: true,
      weeklyReports: true,
      priceAlerts: true
    },
    riskTolerance: 'moderate'
  },
  settings: {
    theme: 'light',
    language: 'en',
    privacy: {
      shareAnalytics: false,
      sharePerformance: false
    },
    dataRetention: 24
  }
});

// ============================================================================
// SAMPLE ASSET DATA
// ============================================================================

export const createSampleAssets = (userId: string): CreateAssetInput[] => [
  {
    name: 'Apple Inc. (AAPL)',
    type: 'stock_ticker',
    symbol: 'AAPL',
    exchange: 'NASDAQ',
    currency: 'USD',
    quantity: 10,
    currentPrice: 175.50,
    currentValue: 1755.00,
    costBasis: 1500.00,
    metadata: {
      tags: ['technology', 'large-cap'],
      customFields: {}
    }
  },
  {
    name: 'Bitcoin',
    type: 'crypto_ticker',
    symbol: 'BTC',
    exchange: 'Global',
    currency: 'USD',
    quantity: 0.5,
    currentPrice: 45000.00,
    currentValue: 22500.00,
    costBasis: 20000.00,
    metadata: {
      tags: ['cryptocurrency', 'digital-gold'],
      customFields: {}
    }
  },
  {
    name: 'Emergency Fund',
    type: 'cash',
    currency: 'USD',
    quantity: 1,
    currentValue: 10000.00,
    costBasis: 10000.00,
    metadata: {
      tags: ['emergency', 'liquid'],
      customFields: {}
    }
  },
  {
    name: 'Primary Residence',
    type: 'home',
    currency: 'USD',
    quantity: 1,
    currentValue: 500000.00,
    costBasis: 450000.00,
    metadata: {
      tags: ['real-estate', 'primary-residence'],
      address: '123 Main St, Anytown, USA',
      customFields: {}
    }
  },
  {
    name: '2020 Honda Civic',
    type: 'car',
    currency: 'USD',
    quantity: 1,
    currentValue: 25000.00,
    costBasis: 28000.00,
    metadata: {
      tags: ['vehicle', 'transportation'],
      model: 'Civic',
      year: 2020,
      customFields: {}
    }
  }
];

// ============================================================================
// SAMPLE DEBT DATA
// ============================================================================

export const createSampleDebts = (userId: string): CreateDebtInput[] => [
  {
    name: 'Chase Freedom Credit Card',
    type: 'credit_card',
    principal: 5000.00,
    currentBalance: 2500.00,
    interestRate: 18.99,
    minimumPayment: 75.00,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    institution: 'Chase Bank',
    currency: 'USD',
    terms: {
      paymentFrequency: 'monthly',
      fixedRate: false
    }
  },
  {
    name: 'Primary Mortgage',
    type: 'mortgage',
    principal: 400000.00,
    currentBalance: 350000.00,
    interestRate: 3.5,
    minimumPayment: 1800.00,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    institution: 'Wells Fargo',
    currency: 'USD',
    terms: {
      termLength: 360, // 30 years
      paymentFrequency: 'monthly',
      fixedRate: true
    }
  },
  {
    name: 'Auto Loan',
    type: 'auto_loan',
    principal: 30000.00,
    currentBalance: 15000.00,
    interestRate: 4.5,
    minimumPayment: 450.00,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    institution: 'Bank of America',
    currency: 'USD',
    terms: {
      termLength: 60, // 5 years
      paymentFrequency: 'monthly',
      fixedRate: true
    }
  }
];

// ============================================================================
// SAMPLE ACCOUNT DATA
// ============================================================================

export const createSampleAccounts = (userId: string): CreateAccountInput[] => [
  {
    name: 'Chase Checking',
    type: 'checking',
    institution: 'Chase Bank',
    currency: 'USD',
    balances: {
      current: 5000.00,
      available: 5000.00,
      pending: 0.00,
      lastUpdated: Timestamp.now()
    },
    isActive: true,
    connectionStatus: 'manual'
  },
  {
    name: 'Chase Savings',
    type: 'savings',
    institution: 'Chase Bank',
    currency: 'USD',
    balances: {
      current: 15000.00,
      available: 15000.00,
      pending: 0.00,
      lastUpdated: Timestamp.now()
    },
    isActive: true,
    connectionStatus: 'manual'
  },
  {
    name: 'Fidelity 401(k)',
    type: 'retirement',
    institution: 'Fidelity Investments',
    currency: 'USD',
    balances: {
      current: 75000.00,
      available: 0.00,
      pending: 0.00,
      lastUpdated: Timestamp.now()
    },
    isActive: true,
    connectionStatus: 'manual'
  },
  {
    name: 'Robinhood Brokerage',
    type: 'brokerage',
    institution: 'Robinhood',
    currency: 'USD',
    balances: {
      current: 25000.00,
      available: 5000.00,
      pending: 0.00,
      lastUpdated: Timestamp.now()
    },
    isActive: true,
    connectionStatus: 'manual'
  }
];

// ============================================================================
// SAMPLE GOAL DATA
// ============================================================================

export const createSampleGoals = (userId: string): CreateGoalInput[] => [
  {
    name: 'Retirement Fund',
    type: 'retirement',
    targetAmount: 1000000.00,
    targetDate: new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000), // 30 years from now
    priority: 'high',
    monthlyContribution: 1000.00
  },
  {
    name: 'Emergency Fund',
    type: 'emergency',
    targetAmount: 25000.00,
    targetDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years from now
    priority: 'high',
    monthlyContribution: 500.00
  },
  {
    name: 'Vacation Fund',
    type: 'travel',
    targetAmount: 5000.00,
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    priority: 'medium',
    monthlyContribution: 200.00
  },
  {
    name: 'Home Renovation',
    type: 'home',
    targetAmount: 30000.00,
    targetDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), // 3 years from now
    priority: 'medium',
    monthlyContribution: 800.00
  }
];

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

export const seedTickers = async (): Promise<void> => {
  for (const ticker of sampleTickers) {
    try {
      const result = await createTicker(ticker);
      if (result.success) {
      } else {
        console.error(`Failed to create ticker ${ticker.symbol}:`, result.error);
      }
    } catch (error) {
      console.error(`Error creating ticker ${ticker.symbol}:`, error);
    }
  }
};

export const seedCategories = async (userId: string): Promise<void> => {
  for (const category of sampleCategories) {
    try {
      const result = await createCategory(userId, category);
      if (result.success) {
      } else {
        console.error(`Failed to create category ${category.name}:`, result.error);
      }
    } catch (error) {
      console.error(`Error creating category ${category.name}:`, error);
    }
  }
  console.log('Category seeding completed.');
};

export const seedUserData = async (userId: string): Promise<void> => {
  console.log('Seeding user data...');
  
  // Create user profile
  const userData = createSampleUser(userId);
  const userResult = await createUser(userId, userData);
  if (userResult.success) {
    console.log('✓ Created user profile');
  } else {
    console.error('✗ Failed to create user profile:', userResult.error);
  }

  // Create sample assets
  const assets = createSampleAssets(userId);
  for (const asset of assets) {
    try {
      const result = await createAsset(userId, asset);
      if (result.success) {
        console.log(`✓ Created asset: ${asset.name}`);
      } else {
        console.error(`✗ Failed to create asset ${asset.name}:`, result.error);
      }
    } catch (error) {
      console.error(`✗ Error creating asset ${asset.name}:`, error);
    }
  }

  // Create sample debts
  const debts = createSampleDebts(userId);
  for (const debt of debts) {
    try {
      const result = await createDebt(userId, debt);
      if (result.success) {
        console.log(`✓ Created debt: ${debt.name}`);
      } else {
        console.error(`✗ Failed to create debt ${debt.name}:`, result.error);
      }
    } catch (error) {
      console.error(`✗ Error creating debt ${debt.name}:`, error);
    }
  }

  // Create sample accounts
  const accounts = createSampleAccounts(userId);
  for (const account of accounts) {
    try {
      const result = await createAccount(userId, account);
      if (result.success) {
        console.log(`✓ Created account: ${account.name}`);
      } else {
        console.error(`✗ Failed to create account ${account.name}:`, result.error);
      }
    } catch (error) {
      console.error(`✗ Error creating account ${account.name}:`, error);
    }
  }

  // Create sample goals
  const goals = createSampleGoals(userId);
  for (const goal of goals) {
    try {
      const result = await createGoal(userId, goal);
      if (result.success) {
        console.log(`✓ Created goal: ${goal.name}`);
      } else {
        console.error(`✗ Failed to create goal ${goal.name}:`, result.error);
      }
    } catch (error) {
      console.error(`✗ Error creating goal ${goal.name}:`, error);
    }
  }

  console.log('User data seeding completed.');
};

export const seedAllData = async (userId: string): Promise<void> => {
  console.log('Starting database seeding...');
  
  try {
    await seedTickers();
    await seedCategories(userId);
    await seedUserData(userId);
    console.log('✓ Database seeding completed successfully!');
  } catch (error) {
    console.error('✗ Database seeding failed:', error);
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const clearAllData = async (userId: string): Promise<void> => {
  console.log('Clearing all user data...');
  // Note: This would require implementing delete functions for all collections
  // For now, this is a placeholder
  console.log('Data clearing not implemented yet.');
};

export const resetToSampleData = async (userId: string): Promise<void> => {
  console.log('Resetting to sample data...');
  await clearAllData(userId);
  await seedAllData(userId);
  console.log('✓ Reset to sample data completed.');
};
