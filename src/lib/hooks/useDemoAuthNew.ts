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
    uid: DEMO_USER_ID,
    email: demoInfo.email,
    displayName: demoInfo.displayName,
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    phoneNumber: null,
    providerId: 'demo',
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
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
      claims: {}
    }),
    reload: async () => {},
    toJSON: () => ({})
  } as User;
};

export const useDemoAuthNew = () => {
  const [demoUser, setDemoUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize demo user data
  const initializeDemo = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      await initializeDemoUser();
      
      // Always create and set the demo user object, regardless of whether data exists
      const user = createDemoUserObject();
      setDemoUser(user);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize demo user';
      setError(errorMessage);
      console.error('Error initializing demo user:', err);
      throw err; // Re-throw the error so it's caught by the calling function
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Sign in as demo user - NEW OFFLINE MODE
  const signInAsDemo = useCallback(async () => {
    
    // Bypass Firebase initialization and go straight to localStorage
    localStorage.setItem('demo-user-signed-in', 'true');
    
    // Verify localStorage was set correctly
    const verifyLocalStorage = localStorage.getItem('demo-user-signed-in');
    if (verifyLocalStorage !== 'true') {
      console.error('❌ NEW localStorage verification failed!');
      return; // Exit early if localStorage failed
    }
    
    
    // Force immediate page reload
    window.location.reload();
  }, [demoUser, isInitializing, error]);

  // Sign out demo user
  const signOutDemo = useCallback(() => {
    setDemoUser(null);
    setError(null);
    localStorage.removeItem('demo-user-signed-in');
  }, []);

  // Restore demo user session from localStorage
  useEffect(() => {
    const isDemoSignedIn = localStorage.getItem('demo-user-signed-in') === 'true';
    
    if (isDemoSignedIn) {
      const user = createDemoUserObject();
      setDemoUser(user);
    } else {
    }
  }, []); // Run only once on mount

  return {
    demoUser,
    isInitializing,
    error,
    signInAsDemo,
    signOutDemo,
    initializeDemo
  };
};
