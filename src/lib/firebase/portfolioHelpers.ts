// Portfolio Analytics and Performance Calculation Helpers
// Complex operations for wealth tracking and portfolio management

import { Timestamp } from 'firebase/firestore';
import {
  Asset,
  Debt,
  Account,
  PortfolioAnalytics,
  HistoricalData,
  NetWorth,
  AssetAllocation,
  PortfolioPerformance,
  CashFlow,
  RiskMetrics,
  AssetValueSnapshot,
  DebtBalanceSnapshot,
  AccountBalanceSnapshot,
} from './types';

// ============================================================================
// NET WORTH CALCULATION FUNCTIONS
// ============================================================================

export const calculateNetWorth = (
  assets: Asset[],
  debts: Debt[],
  currency: string = 'USD'
): NetWorth => {
  const totalAssets = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalDebts = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
  const liquidAssets = assets
    .filter(asset => asset.type === 'cash' || asset.type === 'stock_ticker' || asset.type === 'crypto_ticker')
    .reduce((sum, asset) => sum + asset.currentValue, 0);

  return {
    total: totalAssets - totalDebts,
    liquid: liquidAssets - totalDebts,
    totalAssets,
    totalDebts,
    currency
  };
};

// ============================================================================
// ASSET ALLOCATION CALCULATION FUNCTIONS
// ============================================================================

export const calculateAssetAllocation = (
  assets: Asset[],
  accounts: Account[]
): AssetAllocation => {
  const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  
  if (totalValue === 0) {
    return {
      byType: {
        stocks: 0,
        crypto: 0,
        cash: 0,
        realEstate: 0,
        vehicles: 0,
        preciousMetals: 0,
        other: 0
      },
      byAccount: {},
      byCurrency: {}
    };
  }

  // Calculate by type
  const byType = {
    stocks: 0,
    crypto: 0,
    cash: 0,
    realEstate: 0,
    vehicles: 0,
    preciousMetals: 0,
    other: 0
  };

  assets.forEach(asset => {
    const percentage = (asset.currentValue / totalValue) * 100;
    
    switch (asset.type) {
      case 'stock_ticker':
        byType.stocks += percentage;
        break;
      case 'crypto_ticker':
      case 'crypto_exchange_wallet':
        byType.crypto += percentage;
        break;
      case 'cash':
        byType.cash += percentage;
        break;
      case 'home':
        byType.realEstate += percentage;
        break;
      case 'car':
        byType.vehicles += percentage;
        break;
      case 'precious_metals':
        byType.preciousMetals += percentage;
        break;
      default:
        byType.other += percentage;
    }
  });

  // Calculate by account
  const byAccount: Record<string, number> = {};
  accounts.forEach(account => {
    const accountValue = account.balances?.current || 0;
    if (accountValue > 0) {
      byAccount[account.id] = (accountValue / totalValue) * 100;
    }
  });

  // Calculate by currency
  const byCurrency: Record<string, number> = {};
  assets.forEach(asset => {
    const percentage = (asset.currentValue / totalValue) * 100;
    byCurrency[asset.currency] = (byCurrency[asset.currency] || 0) + percentage;
  });

  return { byType, byAccount, byCurrency };
};

// ============================================================================
// PERFORMANCE CALCULATION FUNCTIONS
// ============================================================================

export const calculatePortfolioPerformance = (
  assets: Asset[],
  debts: Debt[],
  historicalData?: HistoricalData[]
): PortfolioPerformance => {
  const currentNetWorth = calculateNetWorth(assets, debts).total;
  
  // If no historical data, return zero performance
  if (!historicalData || historicalData.length === 0) {
    return {
      dayChange: 0,
      dayChangePercent: 0,
      weekChange: 0,
      weekChangePercent: 0,
      monthChange: 0,
      monthChangePercent: 0,
      yearChange: 0,
      yearChangePercent: 0,
      totalReturn: 0,
      totalReturnPercent: 0
    };
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const getHistoricalValue = (date: Date): number => {
    const closest = historicalData
      .filter(h => h.date.toDate() <= date)
      .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())[0];
    return closest?.netWorthSnapshot || 0;
  };

  const dayValue = getHistoricalValue(oneDayAgo);
  const weekValue = getHistoricalValue(oneWeekAgo);
  const monthValue = getHistoricalValue(oneMonthAgo);
  const yearValue = getHistoricalValue(oneYearAgo);

  const dayChange = currentNetWorth - dayValue;
  const weekChange = currentNetWorth - weekValue;
  const monthChange = currentNetWorth - monthValue;
  const yearChange = currentNetWorth - yearValue;

  const dayChangePercent = dayValue > 0 ? (dayChange / dayValue) * 100 : 0;
  const weekChangePercent = weekValue > 0 ? (weekChange / weekValue) * 100 : 0;
  const monthChangePercent = monthValue > 0 ? (monthChange / monthValue) * 100 : 0;
  const yearChangePercent = yearValue > 0 ? (yearChange / yearValue) * 100 : 0;

  // Calculate total return (from cost basis) - only include assets with cost basis
  const totalCostBasis = assets.reduce((sum, asset) => {
    return asset.costBasis && asset.costBasis > 0 ? sum + asset.costBasis : sum;
  }, 0);
  const totalReturn = currentNetWorth - totalCostBasis;
  const totalReturnPercent = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;

  return {
    dayChange,
    dayChangePercent,
    weekChange,
    weekChangePercent,
    monthChange,
    monthChangePercent,
    yearChange,
    yearChangePercent,
    totalReturn,
    totalReturnPercent
  };
};

// ============================================================================
// CASH FLOW CALCULATION FUNCTIONS
// ============================================================================

export const calculateCashFlow = (
  assets: Asset[],
  accounts: Account[],
  startDate?: Date,
  endDate?: Date
): CashFlow => {
  const now = new Date();
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
  const end = endDate || now;

  let totalCashIn = 0;
  let totalCashOut = 0;
  const sources: Array<{ source: string; amount: number; type: string }> = [];

  // Calculate from asset cash flows
  assets.forEach(asset => {
    if (asset.cashFlow) {
      asset.cashFlow.forEach(cf => {
        const cfDate = cf.date.toDate();
        if (cfDate >= start && cfDate <= end) {
          if (cf.type === 'cash_in') {
            totalCashIn += cf.amount;
            sources.push({
              source: asset.name,
              amount: cf.amount,
              type: 'asset_income'
            });
          } else {
            totalCashOut += cf.amount;
            sources.push({
              source: asset.name,
              amount: cf.amount,
              type: 'asset_expense'
            });
          }
        }
      });
    }
  });

  // Calculate from account transactions
  accounts.forEach(account => {
    if (account.transactions) {
      account.transactions.forEach(transaction => {
        const txDate = transaction.date.toDate();
        if (txDate >= start && txDate <= end) {
          if (transaction.type === 'credit' || transaction.cashIn) {
            const amount = transaction.cashIn || transaction.amount;
            totalCashIn += amount;
            sources.push({
              source: account.name,
              amount,
              type: 'account_credit'
            });
          } else if (transaction.type === 'debit' || transaction.cashOut) {
            const amount = transaction.cashOut || transaction.amount;
            totalCashOut += amount;
            sources.push({
              source: account.name,
              amount,
              type: 'account_debit'
            });
          }
        }
      });
    }
  });

  return {
    totalCashIn,
    totalCashOut,
    netCashFlow: totalCashIn - totalCashOut,
    sources
  };
};

// ============================================================================
// RISK METRICS CALCULATION FUNCTIONS
// ============================================================================

export const calculateRiskMetrics = (
  assets: Asset[],
  historicalData: HistoricalData[]
): RiskMetrics => {
  if (historicalData.length < 2) {
    return {};
  }

  // Calculate daily returns
  const returns = [];
  for (let i = 1; i < historicalData.length; i++) {
    const prevValue = historicalData[i - 1].netWorthSnapshot;
    const currentValue = historicalData[i].netWorthSnapshot;
    if (prevValue > 0) {
      returns.push((currentValue - prevValue) / prevValue);
    }
  }

  if (returns.length === 0) {
    return {};
  }

  // Calculate volatility (standard deviation of returns)
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);

  // Calculate Sharpe ratio (assuming risk-free rate of 2%)
  const riskFreeRate = 0.02 / 365; // Daily risk-free rate
  const excessReturn = mean - riskFreeRate;
  const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

  // Calculate beta (simplified - would need market data for accurate calculation)
  const beta = 1.0; // Placeholder - would need market benchmark data

  // Calculate diversification score (based on number of different asset types)
  const uniqueAssetTypes = new Set(assets.map(asset => asset.type)).size;
  const maxTypes = 7; // Maximum number of asset types in our schema
  const diversificationScore = Math.min((uniqueAssetTypes / maxTypes) * 100, 100);

  return {
    volatility: volatility * 100, // Convert to percentage
    sharpeRatio,
    beta,
    diversificationScore
  };
};

// ============================================================================
// PORTFOLIO ANALYTICS GENERATION
// ============================================================================

export const generatePortfolioAnalytics = (
  userId: string,
  assets: Asset[],
  debts: Debt[],
  accounts: Account[],
  historicalData?: HistoricalData[],
  date?: Date
): Omit<PortfolioAnalytics, 'id' | 'createdAt' | 'updatedAt'> => {
  const analyticsDate = date || new Date();
  
  const netWorth = calculateNetWorth(assets, debts);
  const assetAllocation = calculateAssetAllocation(assets, accounts);
  const performance = calculatePortfolioPerformance(assets, debts, historicalData);
  const cashFlow = calculateCashFlow(assets, accounts);
  const riskMetrics = calculateRiskMetrics(assets, historicalData || []);

  return {
    date: Timestamp.fromDate(analyticsDate),
    netWorth,
    assetAllocation,
    performance,
    cashFlow,
    riskMetrics
  };
};

// ============================================================================
// HISTORICAL DATA GENERATION
// ============================================================================

export const generateHistoricalData = (
  userId: string,
  assets: Asset[],
  debts: Debt[],
  accounts: Account[],
  date?: Date
): Omit<HistoricalData, 'id' | 'createdAt' | 'updatedAt'> => {
  const snapshotDate = date || new Date();
  const netWorth = calculateNetWorth(assets, debts);

  const assetValues: AssetValueSnapshot[] = assets.map(asset => ({
    assetId: asset.id || '',
    value: asset.currentValue,
    quantity: asset.quantity
  }));

  const debtBalances: DebtBalanceSnapshot[] = debts.map(debt => ({
    debtId: debt.id || '',
    balance: debt.currentBalance
  }));

  const accountBalances: AccountBalanceSnapshot[] = accounts.map(account => ({
    accountId: account.id || '',
    balance: account.balances.current
  }));

  return {
    date: Timestamp.fromDate(snapshotDate),
    netWorthSnapshot: netWorth.total,
    assetValues,
    debtBalances,
    accountBalances
  };
};

// ============================================================================
// GOAL PROGRESS CALCULATION
// ============================================================================

export const calculateGoalProgress = (
  goal: any, // Goal type from our schema
  assets: Asset[],
  accounts: Account[]
): { currentAmount: number; progress: number; status: string; projectedCompletion?: Date } => {
  let currentAmount = 0;

  // Calculate from linked assets
  goal.linkedAssets?.forEach((assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      currentAmount += asset.currentValue;
    }
  });

  // Calculate from linked accounts
  goal.linkedAccounts?.forEach((accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      currentAmount += account.balances.current;
    }
  });

  const progress = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;
  
  let status = 'on_track';
  if (progress >= 100) {
    status = 'completed';
  } else if (progress < 50) {
    status = 'behind';
  } else if (progress > 80) {
    status = 'ahead';
  }

  // Calculate projected completion date
  let projectedCompletion: Date | undefined;
  if (goal.monthlyContribution > 0 && progress < 100) {
    const remainingAmount = goal.targetAmount - currentAmount;
    const monthsToComplete = Math.ceil(remainingAmount / goal.monthlyContribution);
    projectedCompletion = new Date();
    projectedCompletion.setMonth(projectedCompletion.getMonth() + monthsToComplete);
  }

  return {
    currentAmount,
    progress,
    status,
    projectedCompletion
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

export const getAssetTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'stock_ticker': '📈',
    'crypto_ticker': '₿',
    'crypto_exchange_wallet': '₿',
    'cash': '💰',
    'home': '🏠',
    'car': '🚗',
    'precious_metals': '🥇',
    'generic_asset': '📦'
  };
  return icons[type] || '📦';
};

export const getDebtTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'credit_card': '💳',
    'mortgage': '🏠',
    'auto_loan': '🚗',
    'student_loan': '🎓',
    'personal_loan': '💸',
    'line_of_credit': '📊'
  };
  return icons[type] || '💸';
};

export const getAccountTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'checking': '🏦',
    'savings': '💰',
    'brokerage': '📈',
    'retirement': '🏛️',
    'credit_card': '💳',
    'investment': '📊',
    'loan': '💸'
  };
  return icons[type] || '🏦';
};
