import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';

const DEMO_USER_ID = 'demo-user-123';

/**
 * Clear all Plaid-imported assets and accounts for testing purposes
 */
export async function clearPlaidData(userId: string = DEMO_USER_ID) {
  try {
    console.log('🧹 Starting to clear Plaid data...');
    
    // 1. First, get all Plaid accounts to identify their account IDs
    const accountsRef = collection(db, `users/${userId}/accounts`);
    const accountsSnapshot = await getDocs(accountsRef);
    
    const plaidAccountIds: string[] = [];
    const plaidAccountAssets: string[] = [];
    
    // Identify Plaid accounts
    accountsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.provider === 'plaid' || 
          data.integrationInfo?.provider === 'plaid' ||
          data.metadata?.customFields?.provider === 'plaid' ||
          data.providerAccountId || // Plaid accounts have providerAccountId
          data.integrationInfo?.plaidAccountId) { // Plaid accounts have plaidAccountId
        plaidAccountIds.push(doc.id);
        plaidAccountAssets.push(doc.id); // Account assets have the same ID as the account
        console.log(`🏦 Found Plaid account: ${doc.id}`, {
          provider: data.provider,
          integrationInfo: data.integrationInfo,
          providerAccountId: data.providerAccountId
        });
      }
    });
    
    console.log(`🏦 Found ${plaidAccountIds.length} Plaid accounts to delete`);
    
    // 2. Get all assets and identify Plaid-related ones
    const assetsRef = collection(db, `users/${userId}/assets`);
    const assetsSnapshot = await getDocs(assetsRef);
    
    const plaidAssets: string[] = [];
    const plaidHoldings: string[] = [];
    
    assetsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Check if it's a Plaid account asset (type: 'account')
      if (data.type === 'account' && 
          (data.metadata?.customFields?.provider === 'plaid' ||
           data.metadata?.tags?.includes('plaid'))) {
        plaidAssets.push(doc.id);
        console.log(`📊 Found Plaid account asset: ${doc.id}`);
      }
      
      // Check if it's a Plaid holding (linked to a Plaid account)
      if (data.accountMapping?.isLinked && 
          data.accountMapping?.accountId && 
          plaidAccountIds.includes(data.accountMapping.accountId)) {
        plaidHoldings.push(doc.id);
        console.log(`📈 Found Plaid holding: ${doc.id} linked to account ${data.accountMapping.accountId}`);
      }
      
      // Check if it's a Plaid-imported asset (has plaid metadata)
      if (data.metadata?.customFields?.provider === 'plaid' || 
          data.metadata?.tags?.includes('plaid') ||
          data.metadata?.customFields?.provider === 'plaid') {
        plaidAssets.push(doc.id);
        console.log(`📊 Found Plaid asset: ${doc.id}`);
      }
    });
    
    console.log(`📊 Found ${plaidAssets.length} Plaid account assets and ${plaidHoldings.length} Plaid holdings to delete`);
    
    // 3. Delete all Plaid-related assets
    const allAssetsToDelete = Array.from(new Set([...plaidAssets, ...plaidHoldings])); // Remove duplicates
    
    for (const assetId of allAssetsToDelete) {
      await deleteDoc(doc(db, `users/${userId}/assets`, assetId));
      console.log(`🗑️ Deleted Plaid asset: ${assetId}`);
    }
    
    // 4. Delete Plaid accounts
    for (const accountId of plaidAccountIds) {
      await deleteDoc(doc(db, `users/${userId}/accounts`, accountId));
      console.log(`🗑️ Deleted Plaid account: ${accountId}`);
    }
    
    const totalDeleted = allAssetsToDelete.length + plaidAccountIds.length;
    console.log(`✅ Successfully cleared ${totalDeleted} Plaid items`);
    
    return {
      success: true,
      deletedAssets: allAssetsToDelete.length,
      deletedAccounts: plaidAccountIds.length,
      deletedHoldings: plaidHoldings.length,
      totalDeleted
    };
    
  } catch (error) {
    console.error('❌ Error clearing Plaid data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clear all assets that have accountMapping.isLinked set to true
 */
export async function clearLinkedAssets(userId: string = DEMO_USER_ID) {
  try {
    console.log('🔗 Starting to clear linked assets...');
    
    // Get all assets
    const assetsRef = collection(db, `users/${userId}/assets`);
    const assetsSnapshot = await getDocs(assetsRef);
    
    const linkedAssets: string[] = [];
    
    // Identify linked assets
    assetsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Check if asset has accountMapping.isLinked set to true
      if (data.accountMapping?.isLinked === true) {
        linkedAssets.push(doc.id);
      }
    });
    
    console.log(`🔗 Found ${linkedAssets.length} linked assets to delete`);
    
    // Delete linked assets
    for (const assetId of linkedAssets) {
      await deleteDoc(doc(db, `users/${userId}/assets`, assetId));
      console.log(`🗑️ Deleted linked asset: ${assetId}`);
    }
    
    console.log(`✅ Successfully cleared ${linkedAssets.length} linked assets`);
    
    return {
      success: true,
      deletedLinkedAssets: linkedAssets.length,
      totalDeleted: linkedAssets.length
    };
    
  } catch (error) {
    console.error('❌ Error clearing linked assets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clear ALL assets for a user (nuclear option)
 */
export async function clearAllAssets(userId: string = DEMO_USER_ID) {
  try {
    console.log('🗑️ Starting to clear ALL assets...');
    
    // Get all assets
    const assetsRef = collection(db, `users/${userId}/assets`);
    const assetsSnapshot = await getDocs(assetsRef);
    
    const allAssets: string[] = [];
    
    // Collect all asset IDs
    assetsSnapshot.forEach((doc) => {
      allAssets.push(doc.id);
    });
    
    console.log(`🗑️ Found ${allAssets.length} total assets to delete`);
    
    // Delete all assets
    for (const assetId of allAssets) {
      await deleteDoc(doc(db, `users/${userId}/assets`, assetId));
      console.log(`🗑️ Deleted asset: ${assetId}`);
    }
    
    console.log(`✅ Successfully cleared ALL ${allAssets.length} assets`);
    
    return {
      success: true,
      deletedAssets: allAssets.length,
      totalDeleted: allAssets.length
    };
    
  } catch (error) {
    console.error('❌ Error clearing all assets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).clearPlaidData = clearPlaidData;
  (window as any).clearLinkedAssets = clearLinkedAssets;
  (window as any).clearAllAssets = clearAllAssets;
}
