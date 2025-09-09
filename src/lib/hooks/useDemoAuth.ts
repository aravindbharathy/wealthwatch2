"use client";

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  initializeDemoUser, 
  getDemoUserInfo, 
  DEMO_USER_ID 
} from '../firebase/demoUserSetup';


// Demo user object that mimics Firebase User
const createDemoUserObject = (): User => {
  const demoInfo = getDemoUserInfo();
  
  return {
    uid: demoInfo.uid,
    email: demoInfo.email,
    displayName: demoInfo.displayName,
    emailVerified: true,
    isAnonymous: false,
    phoneNumber: null,
    photoURL: null,
    providerId: 'demo',
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
    refreshToken: 'demo-refresh-token',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'demo-id-token',
    getIdTokenResult: async () => ({
      token: 'demo-id-token',
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      signInProvider: 'demo',
      signInSecondFactor: null,
      claims: {},
    }),
    reload: async () => {},
    toJSON: () => ({}),
  } as User;
};

export function useDemoAuth() {
  const [demoUser, setDemoUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  // Check if demo user was previously signed in
  useEffect(() => {
    const isDemoSignedIn = localStorage.getItem('demo-user-signed-in') === 'true';
    
    if (isDemoSignedIn && !demoUser) {
      const user = createDemoUserObject();
      setDemoUser(user);
    } else {
    }
  }, []); // Remove demoUser dependency to prevent circular dependency

  // Initialize demo user and data
  const initializeDemo = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);
      
      await initializeDemoUser();
      
      // Always create and set the demo user object, regardless of whether data exists
      const user = createDemoUserObject();
      setDemoUser(user);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize demo user';
      setError(errorMessage);
      console.error('❌ Error initializing demo user:', err);
      console.error('❌ Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      throw err; // Re-throw the error so it's caught by the calling function
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Sign in as demo user
  const signInAsDemo = useCallback(async () => {
    
    // Bypass Firebase initialization and go straight to localStorage
    localStorage.setItem('demo-user-signed-in', 'true');
    
    // Verify localStorage was set correctly
    const verifyLocalStorage = localStorage.getItem('demo-user-signed-in');
    console.log('🔍 Verifying localStorage:', verifyLocalStorage);
    if (verifyLocalStorage !== 'true') {
      console.error('❌ localStorage verification failed!');
      return; // Exit early if localStorage failed
    }
    
    console.log('✅ Demo user sign-in complete (offline mode)');
    console.log('🔄 Refreshing page...');
    
    // Force immediate page reload
    console.log('⚡️ Executing immediate page reload...');
    window.location.reload();
    
    // Original Firebase-based approach (commented out for now)
    /*
    try {
      console.log('🚀 Starting initializeDemo...');
      await initializeDemo();
      console.log('✅ initializeDemo completed');
      
      // Set localStorage immediately, even if Firebase fails
      console.log('🔄 Setting localStorage...');
      localStorage.setItem('demo-user-signed-in', 'true');
      
      // Verify localStorage was set correctly
      const verifyLocalStorage = localStorage.getItem('demo-user-signed-in');
      console.log('🔍 Verifying localStorage:', verifyLocalStorage);
      if (verifyLocalStorage !== 'true') {
        console.error('❌ localStorage verification failed!');
        return; // Exit early if localStorage failed
      }
      
      console.log('✅ Demo user sign-in complete');
      console.log('🔄 Refreshing page...');
      
      // Force immediate page reload
      console.log('⚡️ Executing immediate page reload...');
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Demo user sign-in failed:', error);
      console.error('❌ Error details:', error);
      
      // Even if Firebase fails, try to set localStorage for offline demo
      console.log('🔄 Firebase failed, but trying to set localStorage for offline demo...');
      try {
        localStorage.setItem('demo-user-signed-in', 'true');
        console.log('✅ localStorage set despite Firebase error');
        console.log('🔄 Refreshing page...');
        window.location.reload();
      } catch (localStorageError) {
        console.error('❌ localStorage also failed:', localStorageError);
        alert('Demo user sign-in failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
    */
  }, [initializeDemo, demoUser, isInitializing, error]);

  // Sign out demo user
  const signOutDemo = useCallback(() => {
    setDemoUser(null);
    setError(null);
    localStorage.removeItem('demo-user-signed-in');
    console.log('👋 Demo user signed out');
  }, []);

  // Check if current user is demo user
  const isDemoUser = useCallback((user: User | null) => {
    return user?.uid === DEMO_USER_ID;
  }, []);

  return {
    demoUser,
    isInitializing,
    error,
    signInAsDemo,
    signOutDemo,
    isDemoUser,
    initializeDemo,
  };
}
