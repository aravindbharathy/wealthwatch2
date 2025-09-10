// User preferences management
import { User } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase/firebase';

export interface UserPreferences {
  preferredCurrency: string;
  dateFormat: string;
  numberFormat: string;
  timezone: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  preferredCurrency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  numberFormat: 'en-US',
  timezone: 'UTC',
};

// Get user preferences from Firebase
export async function getUserPreferences(userId?: string): Promise<UserPreferences> {
  if (!userId) {
    // Fallback to localStorage for demo purposes
    return getLocalPreferences();
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        preferredCurrency: userData.preferences?.defaultCurrency || 'USD',
        dateFormat: userData.preferences?.dateFormat || 'MM/DD/YYYY',
        numberFormat: userData.preferences?.numberFormat || 'en-US',
        timezone: 'UTC', // Not stored in current schema
      };
    }
  } catch (error) {
    console.warn('Error loading user preferences from Firebase:', error);
  }

  return DEFAULT_PREFERENCES;
}

// Save user preferences to Firebase
export async function saveUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Map our preferences to Firebase schema
    if (preferences.preferredCurrency) {
      updateData['preferences.defaultCurrency'] = preferences.preferredCurrency;
    }
    if (preferences.dateFormat) {
      updateData['preferences.dateFormat'] = preferences.dateFormat;
    }
    if (preferences.numberFormat) {
      updateData['preferences.numberFormat'] = preferences.numberFormat;
    }

    await updateDoc(userRef, updateData);
    return true;
  } catch (error) {
    console.error('Error saving user preferences to Firebase:', error);
    return false;
  }
}

// Fallback to localStorage for demo purposes
function getLocalPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Error loading user preferences from localStorage:', error);
  }

  return DEFAULT_PREFERENCES;
}

// Save to localStorage as fallback
function saveLocalPreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = getLocalPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem('userPreferences', JSON.stringify(updated));
  } catch (error) {
    console.warn('Error saving user preferences to localStorage:', error);
  }
}

// Get preferred currency (with fallback)
export async function getPreferredCurrency(userId?: string): Promise<string> {
  const preferences = await getUserPreferences(userId);
  return preferences.preferredCurrency;
}

// Set preferred currency (with fallback)
export async function setPreferredCurrency(currency: string, userId?: string): Promise<boolean> {
  if (userId) {
    const success = await saveUserPreferences(userId, { preferredCurrency: currency });
    if (success) {
      // Also save to localStorage as backup
      saveLocalPreferences({ preferredCurrency: currency });
      return true;
    }
  }
  
  // Fallback to localStorage
  saveLocalPreferences({ preferredCurrency: currency });
  return true;
}
