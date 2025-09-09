"use client";


import { useState, useEffect } from 'react';
import { 
  AssetSheet, 
  CreateAssetSheetInput, 
  AssetSection, 
  CreateAssetSectionInput,
  UpdateAssetSectionInput,
  AssetSummary 
} from '../firebase/types';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

export function useAssetSheets(userId: string) {
  const [sheets, setSheets] = useState<AssetSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to load sections for a specific sheet
  const loadSectionsForSheet = async (sheetId: string): Promise<AssetSection[]> => {
    try {
      const sectionsRef = collection(db, 'assetSections');
      const q = query(
        sectionsRef,
        where('sheetId', '==', sheetId)
        // Removed orderBy to avoid index requirement - will sort on client side
      );
      
      const snapshot = await getDocs(q);
      
      const sections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
        updatedAt: doc.data().updatedAt as Timestamp,
      })) as AssetSection[];
      
      // Sort by order on the client side
      const sortedSections = sections.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      return sortedSections;
    } catch (err) {
      console.error('Error loading sections for sheet:', err);
      return [];
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadSheetsWithSections = async () => {
      try {
        
        // Get sheets
        const sheetsRef = collection(db, 'assetSheets');
        const sheetsQuery = query(
          sheetsRef,
          where('userId', '==', userId)
        );
        
        const sheetsSnapshot = await getDocs(sheetsQuery);
        const sheetsData = sheetsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt as Timestamp,
          updatedAt: doc.data().updatedAt as Timestamp,
        })) as AssetSheet[];
        
        // Sort by order on the client side
        const sortedSheets = sheetsData.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Load sections for each sheet
        const sheetsWithSections = await Promise.all(
          sortedSheets.map(async (sheet) => {
            const sections = await loadSectionsForSheet(sheet.id);
            return {
              ...sheet,
              sections: sections
            };
          })
        );
        
        
        if (isMounted) {
          setSheets(sheetsWithSections);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading sheets and sections:', err);
        if (isMounted) {
          setError('Error loading data');
          setLoading(false);
        }
      }
    };

    // Initial load
    loadSheetsWithSections();

    // Set up real-time listeners for both sheets and sections
    const sheetsRef = collection(db, 'assetSheets');
    const sheetsQuery = query(
      sheetsRef,
      where('userId', '==', userId)
    );

    const sectionsRef = collection(db, 'assetSections');
    // Note: We don't actually use this query, it was just for setup
    // const sectionsQuery = query(
    //   sectionsRef,
    //   where('sheetId', 'in', []) // Removed to avoid empty array error
    // );

    let sheetsUnsubscribe: (() => void) | null = null;
    let sectionsUnsubscribe: (() => void) | null = null;

    const setupListeners = () => {
      // Listen to sheets changes
      sheetsUnsubscribe = onSnapshot(sheetsQuery, 
        async (snapshot) => {
          await loadSheetsWithSections();
        },
        (err) => {
          console.error('Firebase sheets error:', err);
          if (isMounted) {
            setError(err.message);
            setLoading(false);
          }
        }
      );
    };

    setupListeners();

    return () => {
      isMounted = false;
      if (sheetsUnsubscribe) sheetsUnsubscribe();
      if (sectionsUnsubscribe) sectionsUnsubscribe();
    };
  }, [userId, refreshTrigger]);

  const createSheet = async (input: CreateAssetSheetInput) => {
    try {
      const newSheet: Omit<AssetSheet, 'id'> = {
        ...input,
        sections: [],
        isActive: true,
        order: sheets.length,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'assetSheets'), newSheet);
      return docRef.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sheet');
      throw err;
    }
  };

  const updateSheet = async (sheetId: string, updates: Partial<AssetSheet>) => {
    try {
      const sheetRef = doc(db, 'assetSheets', sheetId);
      await updateDoc(sheetRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sheet');
      throw err;
    }
  };

  const deleteSheet = async (sheetId: string) => {
    try {
      await deleteDoc(doc(db, 'assetSheets', sheetId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sheet');
      throw err;
    }
  };

  const createSection = async (input: CreateAssetSectionInput) => {
    try {
      const newSection: Omit<AssetSection, 'id'> = {
        ...input,
        assets: [],
        isExpanded: true,
        summary: {
          totalInvested: 0,
          totalValue: 0,
          totalReturn: 0,
          totalReturnPercent: 0,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'assetSections'), newSection);
      
      // Force a refresh of the sheets data to show the new section immediately
      setRefreshTrigger(prev => prev + 1);
      
      return docRef.id;
    } catch (err) {
      console.error('❌ Error creating section:', err);
      setError(err instanceof Error ? err.message : 'Failed to create section');
      throw err;
    }
  };

  const updateSection = async (sectionId: string, updates: UpdateAssetSectionInput) => {
    try {
      const sectionRef = doc(db, 'assetSections', sectionId);
      await updateDoc(sectionRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      
      // Trigger refresh to show updated section
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update section');
      throw err;
    }
  };

  const deleteSection = async (sectionId: string) => {
    try {
      await deleteDoc(doc(db, 'assetSections', sectionId));
      
      // Trigger refresh to show section removal
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete section');
      throw err;
    }
  };

  return {
    sheets,
    loading,
    error,
    createSheet,
    updateSheet,
    deleteSheet,
    createSection,
    updateSection,
    deleteSection,
  };
}

export function useAssetSummary(sheetId: string) {
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sheetId) {
      setLoading(false);
      return;
    }

    const calculateSummary = async () => {
      try {
        setLoading(true);
        
        // Get all sections for this sheet
        const sectionsRef = collection(db, 'assetSections');
        const sectionsQuery = query(
          sectionsRef,
          where('sheetId', '==', sheetId)
        );
        
        const sectionsSnapshot = await getDocs(sectionsQuery);
        const sections = sectionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AssetSection[];

        // Get all assets for these sections
        const assetsRef = collection(db, 'assets');
        const sectionIds = sections.map(s => s.id);
        
        if (sectionIds.length === 0) {
          setSummary({
            totalInvested: 0,
            totalValue: 0,
            totalReturn: 0,
            totalReturnPercent: 0,
            dayChange: 0,
            dayChangePercent: 0,
            categories: {},
          });
          setLoading(false);
          return;
        }

        let assetsSnapshot;
        if (sectionIds.length > 0) {
          const assetsQuery = query(
            assetsRef,
            where('sectionId', 'in', sectionIds)
          );
          assetsSnapshot = await getDocs(assetsQuery);
        } else {
          // If no sections, return empty snapshot
          assetsSnapshot = { docs: [] };
        }
        const assets = assetsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate summary
        let totalInvested = 0;
        let totalValue = 0;
        let dayChange = 0;
        const categories: { [key: string]: any } = {};

        assets.forEach((asset: any) => {
          totalInvested += asset.costBasis || 0;
          totalValue += asset.currentValue || 0;
          dayChange += (asset.performance?.dayChange || 0);

          const category = asset.type || 'other';
          if (!categories[category]) {
            categories[category] = {
              name: category,
              value: 0,
              invested: 0,
              return: 0,
              returnPercent: 0,
            };
          }
          
          categories[category].value += asset.currentValue || 0;
          categories[category].invested += asset.costBasis || 0;
        });

        const totalReturn = totalValue - totalInvested;
        const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
        const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

        // Calculate category returns
        Object.keys(categories).forEach(key => {
          const cat = categories[key];
          cat.return = cat.value - cat.invested;
          cat.returnPercent = cat.invested > 0 ? (cat.return / cat.invested) * 100 : 0;
        });

        setSummary({
          totalInvested,
          totalValue,
          totalReturn,
          totalReturnPercent,
          dayChange,
          dayChangePercent,
          categories,
        });
        setLoading(false);
      } catch (err) {
        console.error('Error calculating summary:', err);
        setSummary({
          totalInvested: 0,
          totalValue: 0,
          totalReturn: 0,
          totalReturnPercent: 0,
          dayChange: 0,
          dayChangePercent: 0,
          categories: {},
        });
        setLoading(false);
      }
    };

    calculateSummary();
  }, [sheetId]);

  return { summary, loading };
}
