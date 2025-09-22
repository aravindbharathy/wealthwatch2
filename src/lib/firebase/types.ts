// Firebase Database Types for WealthWatch Investment Tracker
// Based on the comprehensive database architecture

import { Timestamp } from 'firebase/firestore';

// Base interface for all documents
export interface BaseDocument {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 1. Users Collection Types
export interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserPreferences {
  defaultCurrency: string; // USD, EUR, etc.
  dateFormat: string; // e.g. 'MM/DD/YYYY'
  numberFormat: string; // e.g. '1,234.56'
  notifications: {
    email: boolean;
    push: boolean;
    weeklyReports: boolean;
    priceAlerts: boolean;
  };
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

export interface UserSettings {
  theme: 'light' | 'dark';
  language: string;
  privacy: {
    shareAnalytics: boolean;
    sharePerformance: boolean;
  };
  dataRetention: number; // in months
}

export interface User extends BaseDocument {
  profile: UserProfile;
  preferences: UserPreferences;
  settings: UserSettings;
}

// 2. Assets Collection Types
export interface AssetTransaction {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'split' | 'adjustment' | 'transfer';
  quantity: number;
  price: number;
  totalAmount: number;
  date: Timestamp;
  fees?: number;
  notes?: string;
}

export interface AssetValueEntry {
  date: Timestamp;
  value: number;
  price?: number;
  quantity: number;
}

export interface AssetCashFlow {
  type: 'cash_in' | 'cash_out';
  amount: number;
  date: Timestamp;
  description: string;
}

export interface AssetAccountMapping {
  isLinked: boolean;
  accountId?: string;
  externalId?: string;
}

export interface AssetMetadata {
  description?: string;
  tags: string[];
  location?: string; // For physical assets
  model?: string; // e.g., for vehicles
  year?: number; // For vehicles or real estate
  address?: string; // For real estate
  customFields: Record<string, any>;
}

export interface AssetPerformance {
  dayChange?: number;
  dayChangePercent?: number;
  weekChange?: number;
  weekChangePercent?: number;
  monthChange?: number;
  monthChangePercent?: number;
  yearChange?: number;
  yearChangePercent?: number;
  totalReturnPercent: number;
}

export interface Asset extends BaseDocument {
  id: string;
  name: string;
  type: 'stock_ticker' | 'cash' | 'crypto_ticker' | 'crypto_exchange_wallet' | 'home' | 'car' | 'precious_metals' | 'banks_brokerages' | 'generic_asset';
  subType?: string; // For finer categorization
  symbol?: string; // e.g., 'AAPL', 'BTC'
  exchange?: string; // e.g., 'NASDAQ', 'Binance'
  currency: string;
  quantity: number;
  currentPrice?: number;
  currentValue: number;
  costBasis: number;
  avgCost?: number;
  valueByDate: AssetValueEntry[];
  transactions?: AssetTransaction[];
  totalReturn: number;
  accountMapping: AssetAccountMapping;
  cashFlow?: AssetCashFlow[];
  metadata: AssetMetadata;
  performance: AssetPerformance;
  sectionId?: string; // Reference to the section this asset belongs to
  position: number; // Position within the section for ordering
}

// 3. Debts Collection Types
export interface DebtPayment {
  id: string;
  amount: number;
  date: Timestamp;
  type: 'payment' | 'interest' | 'fee' | 'penalty';
  principalPortion?: number;
  interestPortion?: number;
  description: string;
}

export interface DebtTerms {
  termLength?: number; // if finite, in months
  paymentFrequency: string; // e.g., 'monthly'
  fixedRate: boolean;
  maturityDate?: Date;
}

export interface DebtValueEntry {
  date: Timestamp;
  balance: number;
}

export interface DebtAccountMapping {
  isLinked: boolean;
  accountId?: string;
  externalId?: string;
}

export interface Debt extends BaseDocument {
  id: string;
  name: string;
  type: 'credit_card' | 'mortgage' | 'auto_loan' | 'student_loan' | 'personal_loan' | 'line_of_credit';
  principal: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: Date;
  accountNumber?: string;
  institution: string;
  currency: string;
  status: 'active' | 'paid_off' | 'defaulted' | 'frozen';
  terms: DebtTerms;
  paymentHistory: DebtPayment[];
  accountMapping: DebtAccountMapping;
  valueByDate: DebtValueEntry[];
}

// 4. Accounts Collection Types
export interface AccountHoldings {
  assetId?: string;
  debtId?: string;
  type: 'asset' | 'debt';
  quantity?: number;
  currentValue: number;
  lastUpdated: Timestamp;
}

export interface AccountTransaction {
  id: string;
  amount: number;
  type: 'debit' | 'credit' | 'transfer';
  description: string;
  category?: string;
  subcategory?: string;
  date: Timestamp;
  balance: number;
  cashIn?: number;
  cashOut?: number;
  linkedAssetId?: string;
}

export interface AccountBalances {
  current: number;
  available?: number;
  pending?: number;
  lastUpdated: Timestamp;
}

export interface AccountIntegrationInfo {
  plaidAccountId?: string;
  plaidItemId?: string;
  provider: 'plaid' | 'yodlee' | 'manual';
  lastSync: Timestamp;
  syncErrors?: string[];
}

export interface AccountValueEntry {
  date: Timestamp;
  balance: number;
  totalValue?: number;
  cashFlow?: number;
}

export interface AccountPerformance {
  dayChange?: number;
  dayChangePercent?: number;
  weekChange?: number;
  weekChangePercent?: number;
  monthChange?: number;
  monthChangePercent?: number;
  yearChange?: number;
  yearChangePercent?: number;
  totalReturn?: number;
  totalReturnPercent?: number;
}

export interface Account extends BaseDocument {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'brokerage' | 'retirement' | 'credit_card' | 'investment' | 'loan';
  institution: string;
  accountNumber?: string;
  currency: string;
  balances: AccountBalances;
  holdings?: AccountHoldings[];
  isActive: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'manual';
  integrationInfo?: AccountIntegrationInfo;
  transactions?: AccountTransaction[];
  performance: AccountPerformance;
  valueByDate?: AccountValueEntry[];
}

// 5. Portfolio Analytics Collection Types
export interface NetWorth {
  total: number;
  liquid: number;
  totalAssets: number;
  totalDebts: number;
  currency: string;
}

export interface AssetAllocation {
  byType: {
    stocks: number;
    crypto: number;
    cash: number;
    realEstate: number;
    vehicles: number;
    preciousMetals: number;
    other: number;
  };
  byAccount: Record<string, number>; // {accountId: percent, ...}
  byCurrency: Record<string, number>; // {currencyCode: percent, ...}
}

export interface PortfolioPerformance {
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  yearChange: number;
  yearChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export interface CashFlowSource {
  source: string;
  amount: number;
  type: string;
}

export interface CashFlow {
  totalCashIn: number;
  totalCashOut: number;
  netCashFlow: number;
  sources: CashFlowSource[];
}

export interface RiskMetrics {
  volatility?: number;
  sharpeRatio?: number;
  beta?: number;
  diversificationScore?: number;
}

export interface PortfolioAnalytics extends BaseDocument {
  date: Timestamp;
  netWorth: NetWorth;
  assetAllocation: AssetAllocation;
  performance: PortfolioPerformance;
  cashFlow: CashFlow;
  riskMetrics: RiskMetrics;
}

// 6. Goals Collection Types
export interface Goal extends BaseDocument {
  id: string;
  name: string;
  type: 'retirement' | 'home' | 'education' | 'travel' | 'emergency' | 'other';
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: 'high' | 'medium' | 'low';
  linkedAssets: string[]; // Array of assetIds
  linkedAccounts: string[]; // Array of accountIds
  monthlyContribution: number;
  status: 'on_track' | 'behind' | 'ahead' | 'completed';
  progress: number; // Percent to goal
  projectedCompletion?: Date;
}

// 7. Historical Data Collection Types
export interface AssetValueSnapshot {
  assetId: string;
  value: number;
  quantity: number;
}

export interface DebtBalanceSnapshot {
  debtId: string;
  balance: number;
}

export interface AccountBalanceSnapshot {
  accountId: string;
  balance: number;
}

export interface HistoricalData extends BaseDocument {
  date: Timestamp;
  netWorthSnapshot: number;
  assetValues: AssetValueSnapshot[];
  debtBalances: DebtBalanceSnapshot[];
  accountBalances: AccountBalanceSnapshot[];
}

// 8. Categories Collection Types
export interface Category extends BaseDocument {
  name: string;
  type: 'asset' | 'transaction' | 'goal' | 'debt';
  parent?: string; // Category hierarchy
  color?: string;
  icon?: string;
  isActive: boolean;
}

// 9. Stock/Crypto Tickers Reference Collection Types
export interface Ticker extends BaseDocument {
  symbol: string; // e.g. 'AAPL'
  name: string;
  type: 'stock' | 'crypto' | 'etf' | 'mutual_fund';
  exchange: string;
  currency: string;
  sector?: string;
  industry?: string;
  description?: string;
  marketCap?: number;
  lastUpdated: Timestamp;
  isActive: boolean;
}

// Utility types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: any;
  total?: number;
}

// Form input types for creating/updating records
export interface CreateAssetInput {
  name: string;
  type: Asset['type'];
  subType?: string;
  symbol?: string;
  exchange?: string;
  currency: string;
  quantity: number;
  currentPrice?: number;
  currentValue: number;
  costBasis: number;
  sectionId: string;
  position?: number; // Optional - will be calculated automatically if not provided
  metadata: Partial<AssetMetadata>;
}

export interface CreateDebtInput {
  name: string;
  type: Debt['type'];
  principal: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: Date;
  institution: string;
  currency: string;
  terms: DebtTerms;
}

export interface CreateAccountInput {
  name: string;
  type: Account['type'];
  institution: string;
  currency: string;
  balances: AccountBalances;
  isActive: boolean;
  connectionStatus: Account['connectionStatus'];
}

export interface CreateGoalInput {
  name: string;
  type: Goal['type'];
  targetAmount: number;
  targetDate: Date;
  priority: Goal['priority'];
  monthlyContribution: number;
  linkedAssets?: string[];
  linkedAccounts?: string[];
}

// Asset Sheet Management Types
export interface AssetSheet extends BaseDocument {
  id: string;
  name: string;
  userId: string;
  sections: AssetSection[];
  isActive: boolean;
  order: number;
}

export interface AssetSection extends BaseDocument {
  id: string;
  name: string;
  sheetId: string;
  assets: Asset[];
  isExpanded: boolean;
  order: number;
  summary: {
    totalInvested: number;
    totalValue: number;
    totalReturn: number;
    totalReturnPercent: number;
  };
}

export interface AssetSummary {
  totalInvested: number;
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  categories: {
    [key: string]: {
      name: string;
      value: number;
      invested: number;
      return: number;
      returnPercent: number;
    };
  };
}

export interface CreateAssetSheetInput {
  name: string;
  userId: string;
}

export interface CreateAssetSectionInput {
  name: string;
  sheetId: string;
  order: number;
}

export interface UpdateAssetSectionInput {
  name?: string;
  isExpanded?: boolean;
  order?: number;
}

// Portfolio Value Tracking Types
export interface PortfolioValueEntry {
  date: Timestamp;
  totalValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPercent: number;
  assetCount: number;
}

export interface PortfolioValueHistory {
  userId: string;
  entries: PortfolioValueEntry[];
  lastUpdated: Timestamp;
  createdAt: Timestamp;
}

export interface PortfolioSummary {
  currentValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  periodChange: number;
  periodChangePercent: number;
  periodStartDate: Timestamp;
  periodEndDate: Timestamp;
  assetCount: number;
  lastUpdated: Timestamp;
}

export interface TimeRange {
  label: string;
  value: string;
  months: number;
}
