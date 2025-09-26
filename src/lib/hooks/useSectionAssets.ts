"use client";


import { useState, useEffect } from 'react';
import { Asset, CreateAssetInput } from '../firebase/types';
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
import { calculateSectionSummary } from '../firebase/portfolioHelpers';

export function useSectionAssets(sectionId: string, userId: string) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sectionId || !userId) {
      setLoading(false);
      return;
    }

    try {
      const assetsRef = collection(db, `users/${userId}/assets`);
      const q = query(
        assetsRef,
        where('sectionId', '==', sectionId)
        // Removed orderBy to avoid index requirement - will sort on client side
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          try {
            const assetsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt as Timestamp,
              updatedAt: doc.data().updatedAt as Timestamp,
            })) as Asset[];
            
            // Sort by position on the client side
            const sortedAssets = assetsData.sort((a, b) => {
              const aPosition = a.position || 0;
              const bPosition = b.position || 0;
              return aPosition - bPosition;
            });
            
            setAssets(sortedAssets);
            setLoading(false);
            setError(null);
          } catch (err) {
            console.error('Error processing assets data:', err);
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
  }, [sectionId, userId]);

  // Helper function to update section summary
  const updateSectionSummary = async (assets: Asset[]) => {
    try {
      // Calculate summary - the function will automatically handle cost basis > 0 condition
      const summary = calculateSectionSummary(assets);
      const sectionRef = doc(db, `users/${userId}/sections`, sectionId);
      await updateDoc(sectionRef, {
        summary,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Error updating section summary:', err);
    }
  };

  const createAsset = async (input: CreateAssetInput & { sectionId: string }) => {
    try {
      // Calculate the next position (last position + 1)
      const nextPosition = assets.length > 0 ? Math.max(...assets.map(a => a.position || 0)) + 1 : 0;
      
      const newAsset: Omit<Asset, 'id'> = {
        ...input,
        position: input.position !== undefined ? input.position : nextPosition,
        valueByDate: [],
        transactions: [],
        totalReturn: input.currentValue - input.costBasis,
        accountMapping: { isLinked: false },
        cashFlow: [],
        metadata: {
          tags: [],
          customFields: {},
          ...input.metadata,
        },
        performance: {
          totalReturnPercent: input.costBasis > 0 ? 
            ((input.currentValue - input.costBasis) / input.costBasis) * 100 : 0,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, `users/${userId}/assets`), newAsset);
      
      // Update section summary after creating asset
      const updatedAssets = [...assets, { ...newAsset, id: docRef.id }];
      await updateSectionSummary(updatedAssets);
      
      return docRef.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
      throw err;
    }
  };

  const updateAsset = async (assetId: string, updates: Partial<Asset>) => {
    try {
      const assetRef = doc(db, `users/${userId}/assets`, assetId);
      await updateDoc(assetRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      
      // Update section summary after updating asset
      const updatedAssets = assets.map(asset => 
        asset.id === assetId ? { ...asset, ...updates } : asset
      );
      await updateSectionSummary(updatedAssets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update asset');
      throw err;
    }
  };

  const deleteAsset = async (assetId: string) => {
    try {
      await deleteDoc(doc(db, `users/${userId}/assets`, assetId));
      
      // Update section summary after deleting asset
      const updatedAssets = assets.filter(asset => asset.id !== assetId);
      await updateSectionSummary(updatedAssets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset');
      throw err;
    }
  };

  const reorderAssets = async (assetIds: string[]) => {
    try {
      const updatePromises = assetIds.map((assetId, index) => {
        const assetRef = doc(db, `users/${userId}/assets`, assetId);
        return updateDoc(assetRef, {
          position: index,
          updatedAt: Timestamp.now(),
        });
      });
      
      await Promise.all(updatePromises);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder assets');
      throw err;
    }
  };

  return {
    assets,
    loading,
    error,
    createAsset,
    updateAsset,
    deleteAsset,
    reorderAssets,
  };
}
