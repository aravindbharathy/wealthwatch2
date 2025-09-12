import { useState, useEffect, useCallback } from 'react';
import { 
  getPortfolioValueHistory, 
  updatePortfolioValue, 
  getLatestPortfolioValue 
} from '@/lib/firebase/portfolioUtils';
import { PortfolioValueEntry } from '@/lib/firebase/types';

interface UsePortfolioValueReturn {
  portfolioHistory: PortfolioValueEntry[];
  loading: boolean;
  error: string | null;
  refreshPortfolioValue: () => Promise<void>;
  latestValue: PortfolioValueEntry | null;
}

export function usePortfolioValue(userId: string): UsePortfolioValueReturn {
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioValueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestValue, setLatestValue] = useState<PortfolioValueEntry | null>(null);

  const loadPortfolioHistory = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const history = await getPortfolioValueHistory(userId);
      setPortfolioHistory(history);
      
      if (history.length > 0) {
        setLatestValue(history[history.length - 1]);
      }
    } catch (err) {
      console.error('Error loading portfolio history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load portfolio history');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshPortfolioValue = useCallback(async () => {
    if (!userId) return;

    try {
      setError(null);
      await updatePortfolioValue(userId);
      await loadPortfolioHistory();
    } catch (err) {
      console.error('Error refreshing portfolio value:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh portfolio value');
    }
  }, [userId, loadPortfolioHistory]);

  useEffect(() => {
    loadPortfolioHistory();
  }, [loadPortfolioHistory]);

  return {
    portfolioHistory,
    loading,
    error,
    refreshPortfolioValue,
    latestValue,
  };
}
