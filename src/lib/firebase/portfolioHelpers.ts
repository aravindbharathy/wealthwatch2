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
  const totalAssets = assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
  const totalDebts = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
  const liquidAssets = assets
    .filter(asset => asset.type === 'cash' || asset.type === 'stock_ticker' || asset.type === 'crypto_ticker')
    .reduce((sum, asset) => sum + (asset.currentValue || 0), 0);

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
  const totalValue = assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
  
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
    const percentage = ((asset.currentValue || 0) / totalValue) * 100;
    
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
    const percentage = ((asset.currentValue || 0) / totalValue) * 100;
    byCurrency[asset.currency] = (byCurrency[asset.currency] || 0) + percentage;
  });

  return { byType, byAccount, byCurrency };
};