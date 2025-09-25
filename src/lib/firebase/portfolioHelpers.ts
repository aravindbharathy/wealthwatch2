// Portfolio Analytics and Performance Calculation Helpers
// Complex operations for wealth tracking and portfolio management

import { Timestamp, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
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

// ============================================================================
// SECTION SUMMARY CALCULATION FUNCTIONS
// ============================================================================

export const calculateSectionSummary = (
  assets: Asset[], 
  isPlaidData: boolean = false
): {
  totalInvested: number;
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
} => {
  // For Plaid data, cost basis is not available at account level, so set to 0
  const totalInvested = isPlaidData ? 0 : assets.reduce((sum, asset) => {
    return asset.costBasis !== undefined && asset.costBasis > 0 ? sum + asset.costBasis : sum;
  }, 0);
  
  const totalValue = assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
  
  // Calculate IRR only for assets that have meaningful cost basis data
  let totalReturnForIRR = 0;
  let totalInvestedForIRR = 0;
  
  if (!isPlaidData) {
    assets.forEach(asset => {
      if (asset.costBasis !== undefined && asset.costBasis > 0) {
        totalInvestedForIRR += asset.costBasis;
        totalReturnForIRR += (asset.currentValue || 0) - asset.costBasis;
      }
    });
  }
  
  // Use the IRR calculation only for assets with cost basis
  const totalReturnPercent = totalInvestedForIRR > 0 ? (totalReturnForIRR / totalInvestedForIRR) * 100 : 0;
  
  // Total return includes all assets (for display purposes)
  const totalReturn = totalValue - totalInvested;
  
  return {
    totalInvested,
    totalValue,
    totalReturn,
    totalReturnPercent,
  };
};

// Utility function to recalculate section summary from database
export const recalculateSectionSummary = async (
  sectionId: string, 
  userId: string
): Promise<void> => {
  try {
    // Get all assets for this section
    const assetsRef = collection(db, `users/${userId}/assets`);
    const assetsQuery = query(assetsRef, where('sectionId', '==', sectionId));
    const assetsSnapshot = await getDocs(assetsQuery);
    
    const assets = assetsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Asset[];
    
    // Check if this is Plaid data by looking for Plaid-specific account mapping
    const isPlaidData = assets.some(asset => 
      asset.accountMapping?.isLinked === true
    );
    
    // Calculate new summary (cost basis will be 0 for Plaid data)
    const summary = calculateSectionSummary(assets, isPlaidData);
    
    // Update section with new summary
    const sectionRef = doc(db, `users/${userId}/sections`, sectionId);
    await updateDoc(sectionRef, {
      summary,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error recalculating section summary:', error);
    throw error;
  }
};