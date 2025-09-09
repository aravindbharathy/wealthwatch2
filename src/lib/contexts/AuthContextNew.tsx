"use client";

import React, { createContext, useEffect, useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";
import { User } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { DEMO_USER_ID, initializeDemoUser } from "../firebase/demoUserSetup";


interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInAsDemo: () => Promise<void>;
  isDemoUser: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  signInAsDemo: async () => {},
  isDemoUser: false,
});

// Demo user object that mimics Firebase User
const createDemoUserObject = (): User => {
  return {
    uid: DEMO_USER_ID,
    email: 'demo@wealthwatch.com',
    displayName: 'Demo User',
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
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

export function AuthProviderNew({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Restore demo user session from localStorage
  useEffect(() => {
    const isDemoSignedIn = localStorage.getItem('demo-user-signed-in') === 'true';
    
    if (isDemoSignedIn) {
      const demoUser = createDemoUserObject();
      setUser(demoUser);
      setIsDemoMode(true);
      
      // Initialize demo user data in Firebase
      initializeDemoUser().then(() => {
        setLoading(false);
      }).catch((error) => {
        console.error('Error initializing demo user data:', error);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsDemoMode(false);
        setLoading(false);
      } else {
        // Only set user to null if we're not in demo mode
        // This prevents overriding the demo user state
        if (!isDemoMode) {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signInAsDemo = async () => {
    try {
      const demoUser = createDemoUserObject();
      setUser(demoUser);
      setIsDemoMode(true);
      
      // Initialize demo user data in Firebase
      await initializeDemoUser();
      
      // Set localStorage to persist the demo user session
      localStorage.setItem('demo-user-signed-in', 'true');
    } catch (error) {
      console.error('Error signing in as demo user:', error);
    }
  };

  const signOut = async () => {
    if (isDemoMode) {
      setUser(null);
      setIsDemoMode(false);
      localStorage.removeItem('demo-user-signed-in');
    } else {
      try {
        await firebaseSignOut(auth);
      } catch (error) {
        console.error("Error signing out", error);
      }
    }
  };

  const isDemoUser = isDemoMode && user?.uid === DEMO_USER_ID;

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    signInAsDemo,
    isDemoUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthNew = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthNew must be used within an AuthProviderNew');
  }
  return context;
};
