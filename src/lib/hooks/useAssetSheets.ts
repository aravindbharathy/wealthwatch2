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

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const sheetsRef = collection(db, 'assetSheets');
      const q = query(
        sheetsRef,
        where('userId', '==', userId),
        orderBy('order', 'asc')
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          try {
            const sheetsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt as Timestamp,
              updatedAt: doc.data().updatedAt as Timestamp,
            })) as AssetSheet[];
            
            setSheets(sheetsData);
            setLoading(false);
            setError(null);
          } catch (err) {
            console.error('Error processing sheets data:', err);
            setError('Error processing data');
            setLoading(false);
          }
        },
        (err) => {
          console.error('Firebase error:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up Firebase listener:', err);
      setError('Error connecting to database');
      setLoading(false);
    }
  }, [userId]);

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
      return docRef.id;
    } catch (err) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update section');
      throw err;
    }
  };

  const deleteSection = async (sectionId: string) => {
    try {
      await deleteDoc(doc(db, 'assetSections', sectionId));
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

        const assetsQuery = query(
          assetsRef,
          where('sectionId', 'in', sectionIds)
        );
        
        const assetsSnapshot = await getDocs(assetsQuery);
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
