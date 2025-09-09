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
        userId: DEMO_USER_ID,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const sheetRef = doc(collection(db, 'assetSheets'));
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
      const sectionRef = doc(collection(db, 'assetSections'));
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
      collection(db, 'assetSheets'),
      where('userId', '==', DEMO_USER_ID)
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
    const batch = writeBatch(db);

    // Get all demo sheets
    const sheetsQuery = query(
      collection(db, 'assetSheets'),
      where('userId', '==', DEMO_USER_ID)
    );
    const sheetsSnapshot = await getDocs(sheetsQuery);
    
    for (const sheetDoc of sheetsSnapshot.docs) {
      batch.delete(sheetDoc.ref);
    }

    // Get all demo sections
    let sectionsSnapshot;
    const sheetIds = sheetsSnapshot.docs.map(doc => doc.id);
    if (sheetIds.length > 0) {
      const sectionsQuery = query(
        collection(db, 'assetSections'),
        where('sheetId', 'in', sheetIds)
      );
      sectionsSnapshot = await getDocs(sectionsQuery);
    } else {
      sectionsSnapshot = { docs: [] };
    }
    
    for (const sectionDoc of sectionsSnapshot.docs) {
      batch.delete(sectionDoc.ref);
    }

    // Get all demo assets
    let assetsSnapshot;
    const sectionIds = sectionsSnapshot.docs.map(doc => doc.id);
    if (sectionIds.length > 0) {
      const assetsQuery = query(
        collection(db, 'assets'),
        where('sectionId', 'in', sectionIds)
      );
      assetsSnapshot = await getDocs(assetsQuery);
    } else {
      assetsSnapshot = { docs: [] };
    }
    
    for (const assetDoc of assetsSnapshot.docs) {
      batch.delete(assetDoc.ref);
    }

    await batch.commit();
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
