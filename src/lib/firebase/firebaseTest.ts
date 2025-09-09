// Firebase Connection Test
import { db } from './firebase';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';

// Test Firebase connection by creating a simple document
export const testFirebaseConnection = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    
    // Test 1: Try to read from a collection
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    
    // Test 2: Try to write a document
    const testDoc = doc(db, 'test', 'connection-test');
    await setDoc(testDoc, {
      timestamp: new Date().toISOString(),
      test: true
    });
    
    return { success: true };
  } catch (error) {
    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Firebase connection test failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Test demo user creation specifically
export const testDemoUserCreation = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    
    const testUserId = 'test-demo-user';
    const userRef = doc(db, 'users', testUserId);
    
    await setDoc(userRef, {
      test: true,
      timestamp: new Date().toISOString()
    });
    
    
    // Clean up
    // Note: In a real app, you'd want to delete this test document
    
    return { success: true };
  } catch (error) {
    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Demo user creation test failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Make available globally for testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).firebaseTest = {
    testConnection: testFirebaseConnection,
    testDemoUserCreation: testDemoUserCreation,
  };
}
