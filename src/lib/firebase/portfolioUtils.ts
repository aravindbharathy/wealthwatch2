import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { PortfolioValueEntry, PortfolioValueHistory, PortfolioSummary, Asset } from './types';

/**
 * Calculate current portfolio value from all user assets
 */
export async function calculatePortfolioValue(userId: string): Promise<{
  totalValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPercent: number;
  assetCount: number;
}> {
  try {
    const assetsRef = collection(db, `users/${userId}/assets`);
    const assetsSnapshot = await getDocs(assetsRef);
    
    let totalValue = 0;
    let totalInvested = 0;
    let assetCount = 0;
    
    assetsSnapshot.forEach((doc) => {
      const asset = doc.data() as Asset;
      totalValue += asset.currentValue || 0;
      // Only include assets with cost basis in return calculations
      if (asset.costBasis && asset.costBasis > 0) {
        totalInvested += asset.costBasis;
      }
      assetCount++;
    });
    
    const totalReturn = totalValue - totalInvested;
    const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    
    return {
      totalValue,
      totalInvested,
      totalReturn,
      totalReturnPercent,
      assetCount,
    };
  } catch (error) {
    console.error('Error calculating portfolio value:', error);
    throw error;
  }
}

/**
 * Store a new portfolio value entry
 */
export async function storePortfolioValueEntry(
  userId: string, 
  entry: Omit<PortfolioValueEntry, 'date'> & { date?: Date }
): Promise<void> {
  try {
    const portfolioRef = doc(db, `users/${userId}/portfolio`, 'history');
    const portfolioDoc = await getDoc(portfolioRef);
    
    const newEntry: PortfolioValueEntry = {
      ...entry,
      date: entry.date ? Timestamp.fromDate(entry.date) : Timestamp.now(),
    };
    
    if (portfolioDoc.exists()) {
      const existingData = portfolioDoc.data() as PortfolioValueHistory;
      const updatedEntries = [...existingData.entries, newEntry];
      
      // Keep only the last 365 entries to prevent document from growing too large
      const trimmedEntries = updatedEntries.slice(-365);
      
      await updateDoc(portfolioRef, {
        entries: trimmedEntries,
        lastUpdated: Timestamp.now(),
      });
    } else {
      const newPortfolioHistory: PortfolioValueHistory = {
        userId,
        entries: [newEntry],
        lastUpdated: Timestamp.now(),
        createdAt: Timestamp.now(),
      };
      
      await setDoc(portfolioRef, newPortfolioHistory);
    }
  } catch (error) {
    console.error('Error storing portfolio value entry:', error);
    throw error;
  }
}

/**
 * Get portfolio value history for a user
 */
export async function getPortfolioValueHistory(userId: string): Promise<PortfolioValueEntry[]> {
  try {
    const portfolioRef = doc(db, `users/${userId}/portfolio`, 'history');
    const portfolioDoc = await getDoc(portfolioRef);
    
    if (portfolioDoc.exists()) {
      const data = portfolioDoc.data() as PortfolioValueHistory;
      return data.entries.sort((a, b) => a.date.toMillis() - b.date.toMillis());
    }
    
    return [];
  } catch (error) {
    console.error('Error getting portfolio value history:', error);
    throw error;
  }
}

/**
 * Get portfolio summary for a specific time period
 */
export async function getPortfolioSummary(
  userId: string, 
  periodMonths: number = 6
): Promise<PortfolioSummary | null> {
  try {
    const history = await getPortfolioValueHistory(userId);
    
    if (history.length === 0) {
      return null;
    }
    
    const now = new Date();
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - periodMonths);
    
    const periodEntries = history.filter(entry => 
      entry.date.toDate() >= periodStart
    );
    
    if (periodEntries.length === 0) {
      return null;
    }
    
    const latest = history[history.length - 1];
    const periodStartEntry = periodEntries[0];
    const previousDay = history[history.length - 2];
    
    const dayChange = previousDay ? latest.totalValue - previousDay.totalValue : 0;
    const dayChangePercent = previousDay && previousDay.totalValue > 0 
      ? (dayChange / previousDay.totalValue) * 100 
      : 0;
    
    const periodChange = latest.totalValue - periodStartEntry.totalValue;
    const periodChangePercent = periodStartEntry.totalValue > 0 
      ? (periodChange / periodStartEntry.totalValue) * 100 
      : 0;
    
    return {
      currentValue: latest.totalValue,
      totalInvested: latest.totalInvested,
      totalReturn: latest.totalReturn,
      totalReturnPercent: latest.totalReturnPercent,
      dayChange,
      dayChangePercent,
      periodChange,
      periodChangePercent,
      periodStartDate: periodStartEntry.date,
      periodEndDate: latest.date,
      assetCount: latest.assetCount,
      lastUpdated: latest.date,
    };
  } catch (error) {
    console.error('Error getting portfolio summary:', error);
    throw error;
  }
}

/**
 * Update portfolio value (called when assets change)
 */
export async function updatePortfolioValue(userId: string): Promise<void> {
  try {
    const portfolioData = await calculatePortfolioValue(userId);
    await storePortfolioValueEntry(userId, portfolioData);
  } catch (error) {
    console.error('Error updating portfolio value:', error);
    throw error;
  }
}

/**
 * Initialize portfolio tracking for a new user
 */
export async function initializePortfolioTracking(userId: string): Promise<void> {
  try {
    const portfolioData = await calculatePortfolioValue(userId);
    await storePortfolioValueEntry(userId, portfolioData);
  } catch (error) {
    console.error('Error initializing portfolio tracking:', error);
    throw error;
  }
}

/**
 * Get the latest portfolio value entry
 */
export async function getLatestPortfolioValue(userId: string): Promise<PortfolioValueEntry | null> {
  try {
    const history = await getPortfolioValueHistory(userId);
    return history.length > 0 ? history[history.length - 1] : null;
  } catch (error) {
    console.error('Error getting latest portfolio value:', error);
    throw error;
  }
}

/**
 * Initialize portfolio tracking with sample data for demo purposes
 */
export async function initializePortfolioWithSampleData(userId: string): Promise<void> {
  try {
    const { generateSamplePortfolioHistory } = await import('./portfolioSeedData');
    const sampleHistory = generateSamplePortfolioHistory(userId);
    
    const portfolioRef = doc(db, `users/${userId}/portfolio`, 'history');
    const portfolioHistory = {
      userId,
      entries: sampleHistory,
      lastUpdated: Timestamp.now(),
      createdAt: Timestamp.now(),
    };
    
    await setDoc(portfolioRef, portfolioHistory);
  } catch (error) {
    console.error('Error initializing portfolio with sample data:', error);
    throw error;
  }
}
