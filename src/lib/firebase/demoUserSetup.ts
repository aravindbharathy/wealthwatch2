// Demo User Setup for WealthWatch
// This module handles creating and managing a demo user with persistent sample data

import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  AssetSheet, 
  AssetSection, 
  Asset, 
  User,
  CreateAssetInput 
} from './types';
import { createSampleData } from './sampleAssets';

// Demo user constants
export const DEMO_USER_ID = 'demo-user-wealthwatch';
export const DEMO_USER_EMAIL = 'demo@wealthwatch.app';

// Flag to prevent multiple initializations
let isInitializing = false;

// Create demo user profile
export const createDemoUser = async (): Promise<void> => {
  try {
    const userRef = doc(db, 'users', DEMO_USER_ID);
    
    // Check if demo user already exists
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return;
    }
    
    const demoUser: Omit<User, 'id'> = {
      profile: {
        displayName: 'Demo User',
        email: DEMO_USER_EMAIL,
        photoURL: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      preferences: {
        defaultCurrency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        numberFormat: '1,234.56',
        notifications: {
          email: false,
          push: false,
          weeklyReports: false,
          priceAlerts: false,
        },
        riskTolerance: 'moderate',
      },
      settings: {
        theme: 'light',
        language: 'en',
        privacy: {
          shareAnalytics: false,
          sharePerformance: false,
        },
        dataRetention: 24,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(userRef, demoUser);
  } catch (error) {
    console.error('Error creating demo user:', error);
    throw error;
  }
};

// Seed demo data into the database
export const seedDemoData = async (): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const { sheets, sections, assets } = createSampleData();

    // Create asset sheets
    const sheetRefs: { [key: string]: any } = {};
    for (const sheet of sheets) {
      const sheetData = {
        ...sheet,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const sheetRef = doc(collection(db, `users/${DEMO_USER_ID}/sheets`));
      batch.set(sheetRef, sheetData);
      if (sheet.id) {
        sheetRefs[sheet.id] = sheetRef;
      }
    }

    // Create asset sections
    const sectionRefs: { [key: string]: any } = {};
    for (const section of sections) {
      const sectionData = {
        ...section,
        sheetId: section.sheetId ? (sheetRefs[section.sheetId]?.id || section.sheetId) : undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const sectionRef = doc(collection(db, `users/${DEMO_USER_ID}/sections`));
      batch.set(sectionRef, sectionData);
      if (section.id) {
        sectionRefs[section.id] = sectionRef;
      }
    }

    // Create assets
    for (const asset of assets) {
      const assetData = {
        ...asset,
        sectionId: asset.sectionId ? (sectionRefs[asset.sectionId]?.id || asset.sectionId) : undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const assetRef = doc(collection(db, 'assets'));
      batch.set(assetRef, assetData);
    }

    await batch.commit();
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
};

// Check if demo data already exists
export const checkDemoDataExists = async (): Promise<boolean> => {
  try {
    const sheetsQuery = query(
      collection(db, `users/${DEMO_USER_ID}/sheets`)
    );
    const sheetsSnapshot = await getDocs(sheetsQuery);
    return !sheetsSnapshot.empty;
  } catch (error) {
    console.error('Error checking demo data:', error);
    return false;
  }
};

// Initialize demo user and data
export const initializeDemoUser = async (): Promise<void> => {
  try {
    // Prevent multiple simultaneous initializations
    if (isInitializing) {
      return;
    }
    
    isInitializing = true;
    
    // Check if demo data already exists
    const dataExists = await checkDemoDataExists();
    
    if (!dataExists) {
      await createDemoUser();
      await seedDemoData();
    } else {
    }
  } catch (error) {
    console.error('❌ Error initializing demo user:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
};

// Clear demo data (for testing/reset purposes)
export const clearDemoData = async (): Promise<void> => {
  try {
    console.log('Starting to clear all demo user data...');
    
    // Clear all assets first
    const assetsQuery = query(
      collection(db, `users/${DEMO_USER_ID}/assets`)
    );
    const assetsSnapshot = await getDocs(assetsQuery);
    console.log(`Found ${assetsSnapshot.docs.length} assets to delete`);
    
    const batch1 = writeBatch(db);
    for (const assetDoc of assetsSnapshot.docs) {
      batch1.delete(assetDoc.ref);
    }
    if (assetsSnapshot.docs.length > 0) {
      await batch1.commit();
      console.log('Assets deleted successfully');
    }

    // Clear all sections
    const sectionsQuery = query(
      collection(db, `users/${DEMO_USER_ID}/sections`)
    );
    const sectionsSnapshot = await getDocs(sectionsQuery);
    console.log(`Found ${sectionsSnapshot.docs.length} sections to delete`);
    
    const batch2 = writeBatch(db);
    for (const sectionDoc of sectionsSnapshot.docs) {
      batch2.delete(sectionDoc.ref);
    }
    if (sectionsSnapshot.docs.length > 0) {
      await batch2.commit();
      console.log('Sections deleted successfully');
    }

    // Clear all sheets
    const sheetsQuery = query(
      collection(db, `users/${DEMO_USER_ID}/sheets`)
    );
    const sheetsSnapshot = await getDocs(sheetsQuery);
    console.log(`Found ${sheetsSnapshot.docs.length} sheets to delete`);
    
    const batch3 = writeBatch(db);
    for (const sheetDoc of sheetsSnapshot.docs) {
      batch3.delete(sheetDoc.ref);
    }
    if (sheetsSnapshot.docs.length > 0) {
      await batch3.commit();
      console.log('Sheets deleted successfully');
    }

    console.log('All demo user data cleared successfully!');
  } catch (error) {
    console.error('Error clearing demo data:', error);
    throw error;
  }
};

// Get demo user info
export const getDemoUserInfo = () => {
  return {
    uid: DEMO_USER_ID,
    email: DEMO_USER_EMAIL,
    displayName: 'Demo User',
    isDemo: true,
  };
};
