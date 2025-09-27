"use client";

import { useState, useEffect, useCallback } from 'react';
import { Account, Asset } from '../firebase/types';

// Development logging flag
const DEBUG_LOGGING = process.env.NODE_ENV === 'development';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

export interface AccountDisplayPreferences {
  [accountId: string]: 'consolidated' | 'holdings';
}

export function useAccountDisplayPreferences(userId: string) {
  const [preferences, setPreferences] = useState<AccountDisplayPreferences>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load account display preferences
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);


        // Get all accounts to load their display preferences
        const accountsRef = collection(db, `users/${userId}/accounts`);
        const accountsSnapshot = await getDocs(accountsRef);
        
        
        const prefs: AccountDisplayPreferences = {};
        accountsSnapshot.forEach((doc) => {
          const account = doc.data() as Account;
          const preference = account.displayPreference || 'consolidated';
          prefs[doc.id] = preference;
          
        });

        setPreferences(prefs);
        setLoading(false);
      } catch (err) {
        if (DEBUG_LOGGING) {
          console.error('Error loading account display preferences:', err);
        }
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  // Update account display preference
  const updatePreference = async (accountId: string, preference: 'consolidated' | 'holdings') => {
    try {
      
      // Update in Firebase
      const accountRef = doc(db, `users/${userId}/accounts`, accountId);
      await updateDoc(accountRef, { displayPreference: preference });
      

      // Update local state
      setPreferences(prev => ({
        ...prev,
        [accountId]: preference
      }));
    } catch (err) {
      if (DEBUG_LOGGING) {
        console.error('❌ Error updating account display preference:', err);
      }
      throw err;
    }
  };

  // Filter assets based on account display preferences
  const filterAssetsByPreference = useCallback((assets: Asset[], accounts: Account[]): Asset[] => {
    // Early return if no assets
    if (!assets.length) return [];
    
    const accountMap = new Map(accounts.map(account => [account.id, account]));
    
    // Deduplicate assets by ID to prevent duplicate processing
    const uniqueAssets = assets.filter((asset, index, self) => 
      asset && asset.id && self.findIndex(a => a.id === asset.id) === index
    );
    
    const filtered = uniqueAssets.filter(asset => {
      // If asset is not linked to any account, always show it
      if (!asset.accountMapping?.isLinked || !asset.accountMapping.accountId) {
        return true;
      }

      const account = accountMap.get(asset.accountMapping.accountId);
      if (!account) {
        return true; // Show if account not found
      }

      const preference = preferences[account.id] || 'consolidated';
      
      // If account preference is 'holdings', show individual holdings
      // If account preference is 'consolidated', hide individual holdings (account summary will be shown separately)
      if (preference === 'holdings') {
        return true; // Show all holdings when preference is 'holdings'
      } else {
        return false; // Hide individual holdings when preference is 'consolidated'
      }
    });
    
    return filtered;
  }, [preferences]);

  // Get account summaries for consolidated view
  const getAccountSummaries = useCallback((accounts: Account[], targetSheetId?: string): Asset[] => {
    
    const summaries = accounts
      .filter(account => {
        const preference = preferences[account.id] || 'consolidated';
        return preference === 'consolidated';
      })
      .map(account => {
        // Determine which section this account summary should appear in
        const summaryPosition = account.summaryPosition;
        let targetSectionId = '';
        let position = 0;
        
        if (summaryPosition && (!targetSheetId || summaryPosition.sheetId === targetSheetId)) {
          targetSectionId = summaryPosition.sectionId;
          position = summaryPosition.position;
        }
        return {
          id: `account-summary-${account.id}`,
          name: account.name,
          type: 'account' as const,
          subType: 'plaid' as const,
          currentValue: account.balances.current,
          currency: account.currency,
          quantity: 1,
          costBasis: account.costBasis, // Use account's costBasis field (undefined for Plaid accounts)
          sectionId: targetSectionId, // Set the target section
          totalReturn: 0, // Account summaries don't have returns
          position: position, // Use the stored position
          createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any, // Default creation date
          updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any, // Default update date
          metadata: {
            description: `${account.officialName || account.name} - ${account.institution}`,
            tags: ['plaid', 'connected', 'auto-synced', account.type, account.subtype || ''],
            customFields: {
              accountId: account.id,
              providerAccountId: account.providerAccountId,
              institutionName: account.institution,
              provider: 'plaid',
              accountType: account.type,
              accountSubtype: account.subtype,
              availableBalance: account.balances.available,
              isAccountSummary: true, // Flag to identify account summaries
              mappedType: 'account', // Our mapped type
              mappedSubType: 'plaid', // Our mapped subtype
            },
          },
          performance: account.performance,
          valueByDate: [],
          transactions: [],
          cashFlow: [],
          accountMapping: {
            isLinked: false, // Account summaries are not linked assets
            accountId: account.id,
          },
        } as Asset;
      })
      .filter(summary => summary.sectionId); // Only include summaries that have a valid section
    
    // Sort summaries by their position within their respective sections
    return summaries.sort((a, b) => {
      if (a.sectionId !== b.sectionId) {
        return 0; // Don't sort across sections here, let the section sorting handle it
      }
      return a.position - b.position;
    });
  }, [preferences]);

  // Get holdings for a specific account (for holdings view)
  const getAccountHoldings = useCallback((assets: Asset[], accountId: string): Asset[] => {
    return assets.filter(asset => 
      asset.accountMapping?.isLinked && 
      asset.accountMapping.accountId === accountId
    );
  }, []);

  return {
    preferences,
    loading,
    error,
    updatePreference,
    filterAssetsByPreference,
    getAccountSummaries,
    getAccountHoldings
  };
}
