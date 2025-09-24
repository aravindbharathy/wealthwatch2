import { Account, Asset, CreateAssetInput } from '../firebase/types';
import { PlaidService } from './plaidService';
import { addDocument, updateDocument } from '../firebase/firebaseUtils';

export class AccountService {
  /**
   * Sync Plaid account and create both account and asset records
   */
  static async syncPlaidAccount(
    accessToken: string, 
    sectionId: string, 
    userId: string
  ): Promise<{ accounts: Account[], assets: Asset[] }> {
    try {
      // 1. Fetch holdings from Plaid
      const plaidData = await PlaidService.getHoldings(accessToken);
      
      if (!PlaidService.validatePlaidResponse(plaidData)) {
        throw new Error('Invalid Plaid response data');
      }
      
      const institutionName = PlaidService.getInstitutionName(plaidData.item);
      
      // 2. Transform and save accounts
      const accounts: Account[] = [];
      for (const plaidAccount of plaidData.accounts) {
        const accountData = PlaidService.transformPlaidAccountToAccount(
          plaidAccount, 
          sectionId, 
          institutionName
        );
        
        const savedAccount = await addDocument('accounts', accountData, userId);
        accounts.push({ ...accountData, id: savedAccount.id } as Account);
      }
      
      // 3. Transform and save holdings as assets
      const assets: Asset[] = [];
      for (const holding of plaidData.holdings) {
        const security = plaidData.securities.find(s => s.security_id === holding.security_id);
        if (security) {
          const accountId = accounts.find(a => a.providerAccountId === holding.account_id)?.id;
          if (accountId) {
            const assetData = PlaidService.transformPlaidHoldingToAsset(
              holding, 
              security, 
              accountId, 
              sectionId
            );
            
            const savedAsset = await addDocument('assets', assetData, userId);
            const savedAssetWithId = { ...assetData, id: savedAsset.id } as Asset;
            assets.push(savedAssetWithId);
            
            // Update account's holding references
            const account = accounts.find(a => a.id === accountId);
            if (account) {
              account.holdingAssetIds.push(savedAsset.id);
              // Update the account document with the new holding reference
              await updateDocument('accounts', accountId, { holdingAssetIds: account.holdingAssetIds }, userId);
            }
          }
        }
      }
      
      return { accounts, assets };
    } catch (error) {
      console.error('Account sync error:', error);
      throw new Error(`Failed to sync Plaid account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Refresh a specific account's data
   */
  static async refreshAccount(accountId: string, userId: string): Promise<void> {
    // Implementation for refreshing account data
    // This would fetch fresh data from Plaid and update the account
    console.log(`Refreshing account ${accountId} for user ${userId}`);
  }
  
  /**
   * Disconnect an account
   */
  static async disconnectAccount(accountId: string, userId: string): Promise<void> {
    // Implementation for disconnecting an account
    // This would remove the connection and optionally delete related data
    console.log(`Disconnecting account ${accountId} for user ${userId}`);
  }
}
