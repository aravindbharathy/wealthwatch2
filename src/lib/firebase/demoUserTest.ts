// Demo User Test Utilities
import { 
  initializeDemoUser, 
  checkDemoDataExists,
  DEMO_USER_ID 
} from './demoUserSetup';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Test if demo user is properly set up
export const testDemoUserSetup = async (): Promise<{
  success: boolean;
  userExists: boolean;
  dataExists: boolean;
  error?: string;
}> => {
  try {
    
    // Check if demo user document exists
    const userRef = doc(db, 'users', DEMO_USER_ID);
    const userDoc = await getDoc(userRef);
    const userExists = userDoc.exists();
    
    // Check if demo data exists
    const dataExists = await checkDemoDataExists();
    
    
    if (!userExists || !dataExists) {
      await initializeDemoUser();
      
      // Re-check after initialization
      const userDocAfter = await getDoc(userRef);
      const dataExistsAfter = await checkDemoDataExists();
      
      return {
        success: true,
        userExists: userDocAfter.exists(),
        dataExists: dataExistsAfter,
      };
    }
    
    return {
      success: true,
      userExists,
      dataExists,
    };
  } catch (error) {
    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Demo user test failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    return {
      success: false,
      userExists: false,
      dataExists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Make available globally for testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testDemoUserSetup = testDemoUserSetup;
}
