import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  User,
  Asset,
  Debt,
  Account,
  PortfolioAnalytics,
  Goal,
  HistoricalData,
  Category,
  Ticker,
  CreateAssetInput,
  CreateDebtInput,
  CreateAccountInput,
  CreateGoalInput,
  ApiResponse,
  PaginatedResponse,
} from "./types";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Generic Firestore functions
export const addDocument = (collectionName: string, data: any) =>
  addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

export const getDocuments = async (collectionName: string) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getDocument = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp()
  });

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Paginated query function
export const getPaginatedDocuments = async <T>(
  collectionName: string,
  pageSize: number = 20,
  lastDoc?: any,
  orderByField: string = 'createdAt',
  orderDirection: 'asc' | 'desc' = 'desc'
): Promise<PaginatedResponse<T>> => {
  let q = query(
    collection(db, collectionName),
    orderBy(orderByField, orderDirection),
    limit(pageSize + 1)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const querySnapshot = await getDocs(q);
  const docs = querySnapshot.docs;
  const hasMore = docs.length > pageSize;
  
  if (hasMore) {
    docs.pop(); // Remove the extra doc
  }

  const data = docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[];

  return {
    data,
    hasMore,
    lastDoc: hasMore ? docs[docs.length - 1] : undefined
  };
};

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// ============================================================================
// USER MANAGEMENT FUNCTIONS
// ============================================================================

export const createUser = async (userId: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = {
      profile: {
        displayName: userData.profile?.displayName || '',
        email: userData.profile?.email || '',
        photoURL: userData.profile?.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      preferences: {
        defaultCurrency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        numberFormat: '1,234.56',
        notifications: {
          email: true,
          push: true,
          weeklyReports: true,
          priceAlerts: true
        },
        riskTolerance: 'moderate' as const,
        ...userData.preferences
      },
      settings: {
        theme: 'light' as const,
        language: 'en',
        privacy: {
          shareAnalytics: false,
          sharePerformance: false
        },
        dataRetention: 24,
        ...userData.settings
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await updateDoc(userRef, userDoc);
    const createdUser = await getUser(userId);
    return createdUser;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getUser = async (userId: string): Promise<ApiResponse<User>> => {
  try {
    const userDoc = await getDocument('users', userId);
    if (!userDoc) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: userDoc as unknown as User };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<ApiResponse<User>> => {
  try {
    await updateDocument('users', userId, updates);
    const updatedUser = await getUser(userId);
    return updatedUser;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// ============================================================================
// ASSET MANAGEMENT FUNCTIONS
// ============================================================================

export const createAsset = async (userId: string, assetData: CreateAssetInput): Promise<ApiResponse<Asset>> => {
  try {
    // Calculate the next position for this section
    let nextPosition = 0;
    if (assetData.sectionId) {
      const sectionAssetsQuery = query(
        collection(db, `users/${userId}/assets`),
        where('sectionId', '==', assetData.sectionId)
      );
      const sectionAssetsSnapshot = await getDocs(sectionAssetsQuery);
      const sectionAssets = sectionAssetsSnapshot.docs.map(doc => doc.data());
      
      if (sectionAssets.length > 0) {
        const maxPosition = Math.max(...sectionAssets.map(asset => asset.position || 0));
        nextPosition = maxPosition + 1;
      }
    }

    const assetDoc = {
      ...assetData,
      position: assetData.position ?? nextPosition,
      avgCost: assetData.quantity > 0 ? assetData.costBasis / assetData.quantity : 0,
      valueByDate: [],
      transactions: [],
      totalReturn: assetData.currentValue - assetData.costBasis,
      accountMapping: {
        isLinked: false
      },
      cashFlow: [],
      metadata: {
        tags: [],
        customFields: {},
        ...assetData.metadata
      },
      performance: {
        totalReturnPercent: assetData.costBasis > 0 ? 
          ((assetData.currentValue - assetData.costBasis) / assetData.costBasis) * 100 : 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, `users/${userId}/assets`), assetDoc);
    const createdAsset = await getAsset(userId, docRef.id);
    return createdAsset;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getUserAssets = async (userId: string): Promise<ApiResponse<Asset[]>> => {
  try {
    const querySnapshot = await getDocs(collection(db, `users/${userId}/assets`));
    const assets = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as unknown as Asset[];
    
    // Sort by position, then by createdAt for assets without position
    const sortedAssets = assets.sort((a, b) => {
      const aPosition = a.position ?? Number.MAX_SAFE_INTEGER;
      const bPosition = b.position ?? Number.MAX_SAFE_INTEGER;
      
      if (aPosition !== bPosition) {
        return aPosition - bPosition;
      }
      
      // If positions are equal (or both undefined), sort by creation time
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return aTime - bTime;
    });
    
    return { success: true, data: sortedAssets };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getAsset = async (userId: string, assetId: string): Promise<ApiResponse<Asset>> => {
  try {
    const assetDoc = await getDocument(`users/${userId}/assets`, assetId);
    if (!assetDoc) {
      return { success: false, error: 'Asset not found' };
    }
    return { success: true, data: assetDoc as unknown as Asset };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const updateAsset = async (userId: string, assetId: string, updates: Partial<Asset>): Promise<ApiResponse<Asset>> => {
  try {
    await updateDocument(`users/${userId}/assets`, assetId, updates);
    const updatedAsset = await getAsset(userId, assetId);
    return updatedAsset;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const deleteAsset = async (userId: string, assetId: string): Promise<ApiResponse<void>> => {
  try {
    await deleteDocument(`users/${userId}/assets`, assetId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const reorderAssets = async (
  userId: string, 
  assetId: string, 
  newSectionId: string, 
  newIndex: number
): Promise<ApiResponse<void>> => {
  try {
    // Get the current asset to check if it's moving to a different section
    const currentAssetResult = await getAsset(userId, assetId);
    if (!currentAssetResult.success || !currentAssetResult.data) {
      return { success: false, error: 'Asset not found' };
    }

    const currentAsset = currentAssetResult.data;
    const isMovingToDifferentSection = currentAsset.sectionId !== newSectionId;
    

    // Get all assets in both sections before the transaction
    const targetSectionQuery = query(
      collection(db, `users/${userId}/assets`),
      where('sectionId', '==', newSectionId)
    );
    const targetSectionSnapshot = await getDocs(targetSectionQuery);
    
    // Sort assets by position to get the correct order
    const targetAssets = targetSectionSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Asset))
      .sort((a, b) => (a.position || 0) - (b.position || 0));


    // Get all assets in the old section if moving to a different section
    let oldSectionSnapshot = null;
    if (isMovingToDifferentSection) {
      const oldSectionQuery = query(
        collection(db, `users/${userId}/assets`),
        where('sectionId', '==', currentAsset.sectionId)
      );
      oldSectionSnapshot = await getDocs(oldSectionQuery);
    }

    // Use a transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
      // Handle cross-section moves
      if (isMovingToDifferentSection) {
        
        // 1. Update positions in the old section (shift down assets after the moved asset)
        if (oldSectionSnapshot) {
          oldSectionSnapshot.docs.forEach((doc) => {
            const asset = doc.data();
            if (asset.position > currentAsset.position) {
              transaction.update(doc.ref, { 
                position: asset.position - 1,
                updatedAt: serverTimestamp()
              });
            }
          });
        }

        // 2. Update positions in the target section (shift up assets at and after the new position)
        targetSectionSnapshot.docs.forEach((doc) => {
          const asset = doc.data();
          if (asset.position >= newIndex) {
            transaction.update(doc.ref, { 
              position: asset.position + 1,
              updatedAt: serverTimestamp()
            });
          }
        });

        // 3. Update the moved asset's sectionId and position
        const movedAssetDocRef = doc(db, `users/${userId}/assets`, assetId);
        transaction.update(movedAssetDocRef, {
          sectionId: newSectionId,
          position: newIndex,
          updatedAt: serverTimestamp()
        });

      } else {
        // Handle within-section moves
        
        const currentIndex = targetAssets.findIndex(asset => asset.id === assetId);
        
        if (currentIndex === -1) {
          return;
        }

        // Use arrayMove logic to determine new positions
        const reorderedAssets = [...targetAssets];
        const [movedAsset] = reorderedAssets.splice(currentIndex, 1);
        reorderedAssets.splice(newIndex, 0, movedAsset);


        // Update all assets with their new positions
        reorderedAssets.forEach((asset, index) => {
          const doc = targetSectionSnapshot.docs.find(d => d.id === asset.id);
          if (doc) {
            const oldPosition = asset.position;
            const newPosition = index;
            
            if (oldPosition !== newPosition) {
              
              transaction.update(doc.ref, {
                position: newPosition,
                updatedAt: serverTimestamp()
              });
            }
          }
        });
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// ============================================================================
// DEBT MANAGEMENT FUNCTIONS
// ============================================================================

export const createDebt = async (userId: string, debtData: CreateDebtInput): Promise<ApiResponse<Debt>> => {
  try {
    const debtDoc = {
      ...debtData,
      status: 'active' as const,
      paymentHistory: [],
      accountMapping: {
        isLinked: false
      },
      valueByDate: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, `users/${userId}/debts`), debtDoc);
    const createdDebt = await getDebt(userId, docRef.id);
    return createdDebt;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getUserDebts = async (userId: string): Promise<ApiResponse<Debt[]>> => {
  try {
    const querySnapshot = await getDocs(collection(db, `users/${userId}/debts`));
    const debts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as unknown as Debt[];
    return { success: true, data: debts };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getDebt = async (userId: string, debtId: string): Promise<ApiResponse<Debt>> => {
  try {
    const debtDoc = await getDocument(`users/${userId}/debts`, debtId);
    if (!debtDoc) {
      return { success: false, error: 'Debt not found' };
    }
    return { success: true, data: debtDoc as unknown as Debt };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const updateDebt = async (userId: string, debtId: string, updates: Partial<Debt>): Promise<ApiResponse<Debt>> => {
  try {
    await updateDocument(`users/${userId}/debts`, debtId, updates);
    const updatedDebt = await getDebt(userId, debtId);
    return updatedDebt;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const deleteDebt = async (userId: string, debtId: string): Promise<ApiResponse<void>> => {
  try {
    await deleteDocument(`users/${userId}/debts`, debtId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// ============================================================================
// ACCOUNT MANAGEMENT FUNCTIONS
// ============================================================================

export const createAccount = async (userId: string, accountData: CreateAccountInput): Promise<ApiResponse<Account>> => {
  try {
    const accountDoc = {
      ...accountData,
      holdings: [],
      transactions: [],
      performance: {
        totalReturnPercent: 0
      },
      valueByDate: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, `users/${userId}/accounts`), accountDoc);
    const createdAccount = await getAccount(userId, docRef.id);
    return createdAccount;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getUserAccounts = async (userId: string): Promise<ApiResponse<Account[]>> => {
  try {
    const querySnapshot = await getDocs(collection(db, `users/${userId}/accounts`));
    const accounts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as unknown as Account[];
    return { success: true, data: accounts };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getAccount = async (userId: string, accountId: string): Promise<ApiResponse<Account>> => {
  try {
    const accountDoc = await getDocument(`users/${userId}/accounts`, accountId);
    if (!accountDoc) {
      return { success: false, error: 'Account not found' };
    }
    return { success: true, data: accountDoc as unknown as Account };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const updateAccount = async (userId: string, accountId: string, updates: Partial<Account>): Promise<ApiResponse<Account>> => {
  try {
    await updateDocument(`users/${userId}/accounts`, accountId, updates);
    const updatedAccount = await getAccount(userId, accountId);
    return updatedAccount;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const deleteAccount = async (userId: string, accountId: string): Promise<ApiResponse<void>> => {
  try {
    await deleteDocument(`users/${userId}/accounts`, accountId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// ============================================================================
// GOAL MANAGEMENT FUNCTIONS
// ============================================================================

export const createGoal = async (userId: string, goalData: CreateGoalInput): Promise<ApiResponse<Goal>> => {
  try {
    const goalDoc = {
      ...goalData,
      currentAmount: 0,
      linkedAssets: goalData.linkedAssets || [],
      linkedAccounts: goalData.linkedAccounts || [],
      status: 'on_track' as const,
      progress: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, `users/${userId}/goals`), goalDoc);
    const createdGoal = await getGoal(userId, docRef.id);
    return createdGoal;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getUserGoals = async (userId: string): Promise<ApiResponse<Goal[]>> => {
  try {
    const querySnapshot = await getDocs(collection(db, `users/${userId}/goals`));
    const goals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as unknown as Goal[];
    return { success: true, data: goals };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getGoal = async (userId: string, goalId: string): Promise<ApiResponse<Goal>> => {
  try {
    const goalDoc = await getDocument(`users/${userId}/goals`, goalId);
    if (!goalDoc) {
      return { success: false, error: 'Goal not found' };
    }
    return { success: true, data: goalDoc as unknown as Goal };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const updateGoal = async (userId: string, goalId: string, updates: Partial<Goal>): Promise<ApiResponse<Goal>> => {
  try {
    await updateDocument(`users/${userId}/goals`, goalId, updates);
    const updatedGoal = await getGoal(userId, goalId);
    return updatedGoal;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const deleteGoal = async (userId: string, goalId: string): Promise<ApiResponse<void>> => {
  try {
    await deleteDocument(`users/${userId}/goals`, goalId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// ============================================================================
// PORTFOLIO ANALYTICS FUNCTIONS
// ============================================================================

export const createPortfolioAnalytics = async (userId: string, analyticsData: Omit<PortfolioAnalytics, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<PortfolioAnalytics>> => {
  try {
    const analyticsDoc = {
      ...analyticsData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, `users/${userId}/analytics`), analyticsDoc);
    const createdAnalytics = await getPortfolioAnalytics(userId);
    if (createdAnalytics.success && createdAnalytics.data && createdAnalytics.data.length > 0) {
      return { success: true, data: createdAnalytics.data[0] };
    }
    return { success: false, error: 'Failed to retrieve created analytics' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getPortfolioAnalytics = async (userId: string, date?: string): Promise<ApiResponse<PortfolioAnalytics[]>> => {
  try {
    let q = query(collection(db, `users/${userId}/analytics`), orderBy('date', 'desc'));
    
    if (date) {
      q = query(q, where('date', '==', Timestamp.fromDate(new Date(date))));
    }

    const querySnapshot = await getDocs(q);
    const analytics = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as unknown as PortfolioAnalytics[];
    return { success: true, data: analytics };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// ============================================================================
// HISTORICAL DATA FUNCTIONS
// ============================================================================

export const createHistoricalData = async (userId: string, historicalData: Omit<HistoricalData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<HistoricalData>> => {
  try {
    const historicalDoc = {
      ...historicalData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, `users/${userId}/history`), historicalDoc);
    const createdHistorical = await getHistoricalData(userId);
    if (createdHistorical.success && createdHistorical.data && createdHistorical.data.length > 0) {
      return { success: true, data: createdHistorical.data[0] };
    }
    return { success: false, error: 'Failed to retrieve created historical data' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getHistoricalData = async (userId: string, startDate?: Date, endDate?: Date): Promise<ApiResponse<HistoricalData[]>> => {
  try {
    let q = query(collection(db, `users/${userId}/history`), orderBy('date', 'desc'));
    
    if (startDate) {
      q = query(q, where('date', '>=', Timestamp.fromDate(startDate)));
    }
    
    if (endDate) {
      q = query(q, where('date', '<=', Timestamp.fromDate(endDate)));
    }

    const querySnapshot = await getDocs(q);
    const historicalData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as unknown as HistoricalData[];
    return { success: true, data: historicalData };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// ============================================================================
// CATEGORY MANAGEMENT FUNCTIONS
// ============================================================================

export const createCategory = async (userId: string, categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Category>> => {
  try {
    const categoryDoc = {
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, `users/${userId}/categories`), categoryDoc);
    const createdCategory = await getUserCategories(userId);
    if (createdCategory.success && createdCategory.data && createdCategory.data.length > 0) {
      return { success: true, data: createdCategory.data[0] };
    }
    return { success: false, error: 'Failed to retrieve created category' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getUserCategories = async (userId: string): Promise<ApiResponse<Category[]>> => {
  try {
    const querySnapshot = await getDocs(collection(db, `users/${userId}/categories`));
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as unknown as Category[];
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// ============================================================================
// TICKER REFERENCE FUNCTIONS (Global Collection)
// ============================================================================

export const createTicker = async (tickerData: Omit<Ticker, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Ticker>> => {
  try {
    const tickerDoc = {
      ...tickerData,
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'tickers'), tickerDoc);
    const createdTicker = await getTickers();
    if (createdTicker.success && createdTicker.data && createdTicker.data.length > 0) {
      return { success: true, data: createdTicker.data[0] };
    }
    return { success: false, error: 'Failed to retrieve created ticker' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getTickers = async (type?: string, symbol?: string): Promise<ApiResponse<Ticker[]>> => {
  try {
    let q = query(collection(db, 'tickers'), where('isActive', '==', true));
    
    if (type) {
      q = query(q, where('type', '==', type));
    }
    
    if (symbol) {
      q = query(q, where('symbol', '==', symbol.toUpperCase()));
    }

    const querySnapshot = await getDocs(q);
    const tickers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as unknown as Ticker[];
    return { success: true, data: tickers };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const searchTickers = async (searchTerm: string): Promise<ApiResponse<Ticker[]>> => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - consider using Algolia or similar for production
    const querySnapshot = await getDocs(collection(db, 'tickers'));
    const allTickers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as unknown as Ticker[];
    
    const filteredTickers = allTickers.filter(ticker => 
      ticker.isActive && (
        ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticker.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    
    return { success: true, data: filteredTickers };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
