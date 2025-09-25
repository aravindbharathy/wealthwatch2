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
  writeBatch,
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
      const sectionsRef = collection(db, `users/${userId}/sections`);
      const q = query(
        sectionsRef,
        where('sheetId', '==', sheetId)
        // Removed orderBy to avoid index requirement - will sort on client side
      );
      
      const snapshot = await getDocs(q);
      
      const sections = snapshot.docs.map(doc => {
        const data = doc.data();
        // Remove the internal id field to avoid conflicts
        const { id: internalId, ...dataWithoutInternalId } = data;
        return {
          id: doc.id, // Always use Firestore document ID as the primary ID
          ...dataWithoutInternalId,
          createdAt: data.createdAt as Timestamp,
          updatedAt: data.updatedAt as Timestamp,
        };
      }) as AssetSection[];
      
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
      // Clear data when no user is provided (e.g., after signout)
      setSheets([]);
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadSheetsWithSections = async () => {
      try {
        
        // Get sheets
        const sheetsRef = collection(db, `users/${userId}/sheets`);
        const sheetsQuery = query(sheetsRef);
        
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
    const sheetsRef = collection(db, `users/${userId}/sheets`);
    const sheetsQuery = query(sheetsRef);

    const sectionsRef = collection(db, `users/${userId}/sections`);
    // Note: We don't actually use this query, it was just for setup
    // const sectionsQuery = query(
    //   sectionsRef,
    //   where('sheetId', 'in', []) // Removed to avoid empty array error
    // );

    let sheetsUnsubscribe: (() => void) | null = null;

    const setupListeners = () => {
      // Listen to sheets changes - only reload if there are actual changes
      sheetsUnsubscribe = onSnapshot(sheetsQuery, 
        async (snapshot) => {
          // Only reload if there are actual changes to sheets
          const hasSheetChanges = snapshot.docChanges().some(change => 
            change.type === 'added' || change.type === 'removed' || change.type === 'modified'
          );
          
          if (hasSheetChanges) {
            await loadSheetsWithSections();
          }
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

      const docRef = await addDoc(collection(db, `users/${userId}/sheets`), newSheet);
      return docRef.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sheet');
      throw err;
    }
  };

  const updateSheet = async (sheetId: string, updates: Partial<AssetSheet>) => {
    try {
      // Optimistically update local state
      setSheets(prevSheets => 
        prevSheets.map(sheet => 
          sheet.id === sheetId 
            ? { ...sheet, ...updates, updatedAt: Timestamp.now() }
            : sheet
        )
      );

      const sheetRef = doc(db, `users/${userId}/sheets`, sheetId);
      await updateDoc(sheetRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      // Revert optimistic update on error
      setSheets(prevSheets => 
        prevSheets.map(sheet => 
          sheet.id === sheetId 
            ? { ...sheet, updatedAt: Timestamp.now() }
            : sheet
        )
      );
      setError(err instanceof Error ? err.message : 'Failed to update sheet');
      throw err;
    }
  };

  const deleteSheet = async (sheetId: string) => {
    try {
      await deleteDoc(doc(db, `users/${userId}/sheets`, sheetId));
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
        isFromAccount: input.isFromAccount || false,
        summary: {
          totalInvested: 0,
          totalValue: 0,
          totalReturn: 0,
          totalReturnPercent: 0,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, `users/${userId}/sections`), newSection);
      
      // Update local state immediately to prevent flickering
      const createdSection: AssetSection = {
        id: docRef.id,
        ...newSection,
        createdAt: newSection.createdAt,
        updatedAt: newSection.updatedAt,
      };
      
      setSheets(prevSheets => 
        prevSheets.map(sheet => 
          sheet.id === input.sheetId 
            ? { ...sheet, sections: [...(sheet.sections || []), createdSection] }
            : sheet
        )
      );
      
      return docRef.id;
    } catch (err) {
      console.error('❌ Error creating section:', err);
      setError(err instanceof Error ? err.message : 'Failed to create section');
      throw err;
    }
  };

  const updateSection = async (sectionId: string, updates: UpdateAssetSectionInput) => {
    try {
      const sectionRef = doc(db, `users/${userId}/sections`, sectionId);
      await updateDoc(sectionRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      
      // Update local state immediately to prevent flickering
      setSheets(prevSheets => 
        prevSheets.map(sheet => ({
          ...sheet,
          sections: sheet.sections.map(section => 
            section.id === sectionId 
              ? { ...section, ...updates }
              : section
          )
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update section');
      throw err;
    }
  };

  const deleteSection = async (sectionId: string) => {
    try {
      // First, delete all assets in this section
      const assetsQuery = query(
        collection(db, `users/${userId}/assets`),
        where('sectionId', '==', sectionId)
      );
      const assetsSnapshot = await getDocs(assetsQuery);
      
      // Delete all assets in batch
      const batch = writeBatch(db);
      assetsSnapshot.docs.forEach((assetDoc) => {
        batch.delete(assetDoc.ref);
      });
      await batch.commit();
      
      // Then delete the section itself
      await deleteDoc(doc(db, `users/${userId}/sections`, sectionId));
      
      // Update local state immediately to prevent flickering
      setSheets(prevSheets => 
        prevSheets.map(sheet => ({
          ...sheet,
          sections: sheet.sections.filter(section => section.id !== sectionId)
        }))
      );
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

export function useAssetSummary(sheetId: string, userId: string) {
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to prevent initial loading flicker
  const [lastSheetId, setLastSheetId] = useState<string>('');
  const [summaryCache, setSummaryCache] = useState<{ [sheetId: string]: AssetSummary }>({});

  useEffect(() => {
    if (!sheetId) {
      // Clear summary when no sheetId is provided (e.g., after signout)
      setSummary(null);
      setLoading(false);
      setLastSheetId('');
      return;
    }

    // If we have a cached summary for this sheet, use it immediately
    if (summaryCache[sheetId]) {
      setSummary(summaryCache[sheetId]);
      setLoading(false);
      setLastSheetId(sheetId);
      return;
    }

    // If we already have a summary for this sheet, don't reload
    if (summary && lastSheetId === sheetId) {
      setLoading(false);
      return;
    }

    const calculateSummary = async () => {
      try {
        // Only show loading if we don't have any summary at all (first load)
        if (!summary && Object.keys(summaryCache).length === 0) {
          setLoading(true);
        }
        
        // Get all sections for this sheet
        const sectionsRef = collection(db, `users/${userId}/sections`);
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
        const assetsRef = collection(db, `users/${userId}/assets`);
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
        const validSectionIds = sectionIds.filter(id => id && id.trim() !== '');
        if (validSectionIds.length > 0 && validSectionIds.length <= 10) { // Firestore 'in' limit is 10
          const assetsQuery = query(
            assetsRef,
            where('sectionId', 'in', validSectionIds)
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

        const newSummary = {
          totalInvested,
          totalValue,
          totalReturn,
          totalReturnPercent,
          dayChange,
          dayChangePercent,
          categories,
        };
        
        setSummary(newSummary);
        setSummaryCache(prev => ({ ...prev, [sheetId]: newSummary }));
        setLastSheetId(sheetId);
        setLoading(false);
      } catch (err) {
        console.error('Error calculating summary:', err);
        const errorSummary = {
          totalInvested: 0,
          totalValue: 0,
          totalReturn: 0,
          totalReturnPercent: 0,
          dayChange: 0,
          dayChangePercent: 0,
          categories: {},
        };
        
        setSummary(errorSummary);
        setSummaryCache(prev => ({ ...prev, [sheetId]: errorSummary }));
        setLastSheetId(sheetId);
        setLoading(false);
      }
    };

    calculateSummary();
  }, [sheetId, userId, summary, lastSheetId, summaryCache]);

  return { summary, loading };
}
