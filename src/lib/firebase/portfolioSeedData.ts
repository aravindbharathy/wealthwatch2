import { Timestamp } from 'firebase/firestore';
import { PortfolioValueEntry } from './types';

/**
 * Generate sample portfolio value history for demo purposes
 */
export function generateSamplePortfolioHistory(
  userId: string,
  currentValue: number = 257258,
  monthsBack: number = 12
): PortfolioValueEntry[] {
  const entries: PortfolioValueEntry[] = [];
  const now = new Date();
  
  // Generate entries for the past months
  for (let i = monthsBack; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    
    // Simulate realistic portfolio growth with some volatility
    const baseValue = currentValue * 0.7; // Start at 70% of current value
    const growthFactor = (monthsBack - i) / monthsBack; // Linear growth factor
    const volatility = (Math.random() - 0.5) * 0.1; // ±5% random volatility
    
    const totalValue = baseValue + (currentValue - baseValue) * growthFactor + (baseValue * volatility);
    const totalInvested = totalValue * 0.8; // Assume 80% is invested amount
    const totalReturn = totalValue - totalInvested;
    const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    
    entries.push({
      date: Timestamp.fromDate(date),
      totalValue: Math.round(totalValue),
      totalInvested: Math.round(totalInvested),
      totalReturn: Math.round(totalReturn),
      totalReturnPercent: Math.round(totalReturnPercent * 10) / 10,
      assetCount: Math.floor(Math.random() * 5) + 8, // 8-12 assets
    });
  }
  
  return entries;
}

/**
 * Generate realistic portfolio history based on actual asset data
 */
export function generateRealisticPortfolioHistory(
  currentAssets: Array<{ currentValue: number; costBasis: number }>,
  monthsBack: number = 12
): PortfolioValueEntry[] {
  const entries: PortfolioValueEntry[] = [];
  const now = new Date();
  
  const currentTotalValue = currentAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const currentTotalInvested = currentAssets.reduce((sum, asset) => sum + asset.costBasis, 0);
  
  // Generate entries for the past months
  for (let i = monthsBack; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    
    // Simulate portfolio growth with market-like volatility
    const timeProgress = (monthsBack - i) / monthsBack;
    const baseGrowth = 0.15 * timeProgress; // 15% total growth over the period
    const volatility = (Math.random() - 0.5) * 0.08; // ±4% monthly volatility
    
    const growthFactor = 1 + baseGrowth + volatility;
    const totalValue = Math.round(currentTotalValue * (0.85 + 0.15 * growthFactor));
    const totalInvested = Math.round(currentTotalInvested * (0.9 + 0.1 * timeProgress));
    const totalReturn = totalValue - totalInvested;
    const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    
    entries.push({
      date: Timestamp.fromDate(date),
      totalValue,
      totalInvested,
      totalReturn,
      totalReturnPercent: Math.round(totalReturnPercent * 10) / 10,
      assetCount: currentAssets.length,
    });
  }
  
  return entries;
}
