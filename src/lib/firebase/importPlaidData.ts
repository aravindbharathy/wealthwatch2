import { AccountService } from '@/lib/services/accountService';
import { addDocument } from './firebaseUtils';
import { Asset } from './types';

const DEMO_USER_ID = 'demo-user-123';

/**
 * Import Plaid data from the mock JSON file for testing
 */
export async function importPlaidData(userId: string = DEMO_USER_ID) {
  try {
    console.log('📥 Starting to import Plaid data...');
    
    // Import the mock Plaid data
    const plaidData = await import('@/lib/mockData/plaidHoldings.json');
    
    // Create a mock access token (in real implementation, this would come from Plaid Link)
    const mockAccessToken = 'access-sandbox-mock-token-for-testing';
    
    // Use the AccountService to sync the Plaid data
    const result = await AccountService.syncPlaidAccount(
      mockAccessToken,
      'default-section', // You might want to get the actual section ID
      userId
    );
    
    console.log(`✅ Successfully imported Plaid data:`);
    console.log(`- Accounts: ${result.accounts.length}`);
    console.log(`- Assets: ${result.assets.length}`);
    
    return {
      success: true,
      accounts: result.accounts.length,
      assets: result.assets.length,
      total: result.accounts.length + result.assets.length
    };
    
  } catch (error) {
    console.error('❌ Error importing Plaid data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).importPlaidData = importPlaidData;
}
