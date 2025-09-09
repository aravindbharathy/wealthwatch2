// Demo User Utilities for testing and debugging
import { 
  initializeDemoUser, 
  clearDemoData, 
  checkDemoDataExists,
  DEMO_USER_ID 
} from './demoUserSetup';

// Test function to verify demo user setup
export const testDemoUserSetup = async (): Promise<void> => {
  try {
    
    // Check if demo data exists
    const dataExists = await checkDemoDataExists();
    
    if (!dataExists) {
      await initializeDemoUser();
    } else {
    }
    
  } catch (error) {
    console.error('❌ Demo user test failed:', error);
    throw error;
  }
};

// Reset demo data (useful for testing)
export const resetDemoData = async (): Promise<void> => {
  try {
    await clearDemoData();
    await initializeDemoUser();
  } catch (error) {
    console.error('❌ Demo data reset failed:', error);
    throw error;
  }
};

// Get demo user status
export const getDemoUserStatus = async (): Promise<{
  dataExists: boolean;
  userId: string;
}> => {
  try {
    const dataExists = await checkDemoDataExists();
    return {
      dataExists,
      userId: DEMO_USER_ID,
    };
  } catch (error) {
    console.error('❌ Failed to get demo user status:', error);
    throw error;
  }
};

// Test Firebase connection
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    const { db } = await import('./firebase');
    const { collection, getDocs } = await import('firebase/firestore');
    
    // Try to read from a collection
    const testCollection = collection(db, 'test');
    await getDocs(testCollection);
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};

// Make functions available globally for testing (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).demoUserUtils = {
    testDemoUserSetup,
    resetDemoData,
    getDemoUserStatus,
    testFirebaseConnection,
    clearDemoData: async () => {
      try {
        await clearDemoData();
      } catch (error) {
        console.error('❌ Failed to clear demo data:', error);
      }
    },
    forceDemoUserSignIn: async () => {
      try {
        await testDemoUserSetup();
        localStorage.setItem('demo-user-signed-in', 'true');
      } catch (error) {
        console.error('❌ Failed to sign in as demo user:', error);
      }
    },
    testDemoUserState: () => {
      const isDemoSignedIn = localStorage.getItem('demo-user-signed-in') === 'true';
    },
    manualDemoSignIn: async () => {
      try {
        await testDemoUserSetup();
        localStorage.setItem('demo-user-signed-in', 'true');
        window.location.reload();
      } catch (error) {
        console.error('❌ Manual demo user sign-in failed:', error);
      }
    },
    testPageReload: () => {
      console.log('🧪 Testing page reload...');
      console.log('🔄 Reloading page in 2 seconds...');
      setTimeout(() => {
        console.log('⚡️ Executing test page reload...');
        window.location.reload();
      }, 2000);
    },
    forcePageReload: () => {
      console.log('⚡️ Force reloading page immediately...');
      window.location.reload();
    },
    testDemoUserState: () => {
      const isDemoSignedIn = localStorage.getItem('demo-user-signed-in') === 'true';
    },
    forceDemoUserState: () => {
      console.log('🚀 Force setting demo user state...');
      localStorage.setItem('demo-user-signed-in', 'true');
      console.log('✅ localStorage set to demo-user-signed-in: true');
      console.log('🔄 Reloading page...');
      window.location.reload();
    },
    checkAndRestoreDemoUser: () => {
      console.log('🔍 Checking and restoring demo user...');
      const isDemoSignedIn = localStorage.getItem('demo-user-signed-in') === 'true';
      console.log('Raw localStorage value:', localStorage.getItem('demo-user-signed-in'));
      
      if (isDemoSignedIn) {
        console.log('✅ Demo user should be restored on page refresh');
        console.log('💡 Try refreshing the page now');
      } else {
        console.log('❌ No demo user session found in localStorage');
        console.log('💡 Try signing in as demo user first');
      }
    },
    testLocalStorage: () => {
      console.log('🧪 Testing localStorage functionality...');
      const testKey = 'test-demo-user';
      const testValue = 'test-value';
      
      try {
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        console.log('✅ localStorage test successful:', { set: testValue, retrieved });
        localStorage.removeItem(testKey);
      } catch (error) {
        console.error('❌ localStorage test failed:', error);
      }
    },
    forceOfflineDemo: () => {
      console.log('🚀 Force setting offline demo mode...');
      try {
        localStorage.setItem('demo-user-signed-in', 'true');
        console.log('✅ localStorage set to demo-user-signed-in: true');
        console.log('🔄 Reloading page...');
        window.location.reload();
      } catch (error) {
        console.error('❌ Failed to set offline demo:', error);
      }
    },
    testDirectLocalStorage: () => {
      console.log('🧪 Testing direct localStorage setting...');
      try {
        console.log('🔄 Setting demo-user-signed-in to true...');
        localStorage.setItem('demo-user-signed-in', 'true');
        console.log('✅ localStorage set');
        
        console.log('🔍 Verifying...');
        const value = localStorage.getItem('demo-user-signed-in');
        console.log('Retrieved value:', value);
        
        if (value === 'true') {
          console.log('✅ Direct localStorage test successful!');
          console.log('🔄 Reloading page to test restoration...');
          window.location.reload();
        } else {
          console.error('❌ Direct localStorage test failed!');
        }
      } catch (error) {
        console.error('❌ Direct localStorage test error:', error);
      }
    },
    testNewCode: () => {
      console.log('🔥 TESTING NEW CODE - This should appear if new code is loaded!');
      console.log('🔄 Setting demo-user-signed-in to true...');
      localStorage.setItem('demo-user-signed-in', 'true');
      console.log('✅ localStorage set');
      console.log('🔄 Reloading page...');
      window.location.reload();
    },
  };
  
  console.log('🔧 Demo user utilities available at window.demoUserUtils');
  console.log('💡 Try: demoUserUtils.testFirebaseConnection() to test Firebase');
  console.log('💡 Try: demoUserUtils.forceDemoUserSignIn() to sign in as demo user');
  console.log('💡 Try: demoUserUtils.manualDemoSignIn() to manually sign in as demo user');
  console.log('💡 Try: demoUserUtils.forceOfflineDemo() to force offline demo mode (bypasses Firebase)');
  console.log('💡 Try: demoUserUtils.testNewCode() to test if new code is loaded');
  console.log('💡 Try: demoUserUtils.testDirectLocalStorage() to test direct localStorage setting');
  console.log('💡 Try: demoUserUtils.testPageReload() to test page reload functionality');
  console.log('💡 Try: demoUserUtils.forcePageReload() to force immediate page reload');
  console.log('💡 Try: demoUserUtils.forceDemoUserState() to force demo user state and reload');
  console.log('💡 Try: demoUserUtils.checkAndRestoreDemoUser() to check localStorage and restore demo user');
  console.log('💡 Try: demoUserUtils.testLocalStorage() to test localStorage functionality');
  console.log('💡 Try: demoUserUtils.testDemoUserState() to check demo user state');
  console.log('💡 Try: demoUserUtils.clearDemoData() to reset demo data');
}
