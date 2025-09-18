"use client";

import { useState, useEffect } from 'react';
import { Asset, Debt, AssetSheet, AssetSection } from '../firebase/types';
import { 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

export interface ConsolidatedAsset {
  id: string;
  name: string;
  symbol?: string;
  exchange?: string;
  type: string;
  currentValue: number;
  costBasis: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange?: number;
  dayChangePercent?: number;
  quantity: number;
  currency: string;
  sheetName: string;
  sectionName: string;
  // For grouping
  groupKey: string; // Combination of symbol + type for grouping
}

export interface ConsolidatedDebt {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
  principal: number;
  interestRate: number;
  institution: string;
  currency: string;
}

export interface ConsolidatedSummary {
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export function useConsolidatedAssets(userId: string) {
  const [consolidatedAssets, setConsolidatedAssets] = useState<ConsolidatedAsset[]>([]);
  const [consolidatedDebts, setConsolidatedDebts] = useState<ConsolidatedDebt[]>([]);
  const [summary, setSummary] = useState<ConsolidatedSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadConsolidatedData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all sheets
        const sheetsRef = collection(db, `users/${userId}/sheets`);
        const sheetsSnapshot = await getDocs(sheetsRef);
        const sheets = sheetsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AssetSheet[];

        // Get all sections
        const sectionsRef = collection(db, `users/${userId}/sections`);
        const sectionsSnapshot = await getDocs(sectionsRef);
        const sections = sectionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AssetSection[];

        // Get all assets
        const assetsRef = collection(db, `users/${userId}/assets`);
        const assetsSnapshot = await getDocs(assetsRef);
        const assets = assetsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Asset[];


        // Get all debts
        const debtsRef = collection(db, `users/${userId}/debts`);
        const debtsSnapshot = await getDocs(debtsRef);
        const debts = debtsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Debt[];

        // Create lookup maps
        const sheetMap = new Map(sheets.map(sheet => [sheet.id, sheet.name]));
        const sectionMap = new Map(sections.map(section => [section.id, section.name]));

        // Process assets
        const processedAssets: ConsolidatedAsset[] = assets.map(asset => {
          // Find the section to get the correct sheet name
          const section = sections.find(s => s.id === asset.sectionId);
          const sheetName = section ? sheetMap.get(section.sheetId) || 'Unknown Sheet' : 'Unknown Sheet';
          const sectionName = sectionMap.get(asset.sectionId || '') || 'Unknown Section';
          
          // Create group key for consolidation
          const groupKey = asset.symbol ? `${asset.symbol}_${asset.type}` : `${asset.name}_${asset.type}`;
          
          // Helper function to safely parse numbers
          const safeNumber = (value: any, defaultValue: number = 0): number => {
            if (value === null || value === undefined || isNaN(value)) {
              return defaultValue;
            }
            return Number(value);
          };

          const processedAsset = {
            id: asset.id,
            name: asset.name || 'Unknown Asset',
            symbol: asset.symbol,
            exchange: asset.exchange,
            type: asset.type || 'generic_asset',
            currentValue: safeNumber(asset.currentValue, 0),
            costBasis: safeNumber(asset.costBasis, 0),
            totalReturn: safeNumber(asset.totalReturn, 0),
            totalReturnPercent: safeNumber(asset.performance?.totalReturnPercent, 0),
            dayChange: safeNumber(asset.performance?.dayChange, 0),
            dayChangePercent: safeNumber(asset.performance?.dayChangePercent, 0),
            quantity: safeNumber(asset.quantity, 0),
            currency: asset.currency || 'USD',
            sheetName,
            sectionName,
            groupKey
          };


          return processedAsset;
        });

        // Group and consolidate assets by symbol and type
        const groupedAssets = new Map<string, ConsolidatedAsset>();
        
        processedAssets.forEach(asset => {
          const key = asset.groupKey;
          if (groupedAssets.has(key)) {
            const existing = groupedAssets.get(key)!;
            existing.currentValue += asset.currentValue;
            existing.costBasis += asset.costBasis;
            existing.totalReturn += asset.totalReturn;
            existing.quantity += asset.quantity;
            // Update return percentage based on new totals
            existing.totalReturnPercent = existing.costBasis > 0 ? 
              (existing.totalReturn / existing.costBasis) * 100 : 0;
            // Combine day changes
            existing.dayChange = (existing.dayChange || 0) + (asset.dayChange || 0);
            // Update day change percentage
            existing.dayChangePercent = existing.currentValue > 0 ? 
              (existing.dayChange / existing.currentValue) * 100 : 0;
            // Update sheet/section info to show multiple locations
            if (!existing.sheetName.includes(asset.sheetName)) {
              existing.sheetName += `, ${asset.sheetName}`;
            }
            if (!existing.sectionName.includes(asset.sectionName)) {
              existing.sectionName += `, ${asset.sectionName}`;
            }
          } else {
            groupedAssets.set(key, { ...asset });
          }
        });

        const finalAssets = Array.from(groupedAssets.values())
          .sort((a, b) => b.currentValue - a.currentValue);


        // Process debts with safe number handling
        const processedDebts: ConsolidatedDebt[] = debts.map(debt => {
          const safeNumber = (value: any, defaultValue: number = 0): number => {
            if (value === null || value === undefined || isNaN(value)) {
              return defaultValue;
            }
            return Number(value);
          };

          return {
            id: debt.id,
            name: debt.name || 'Unknown Debt',
            type: debt.type || 'personal_loan',
            currentBalance: safeNumber(debt.currentBalance, 0),
            principal: safeNumber(debt.principal, 0),
            interestRate: safeNumber(debt.interestRate, 0),
            institution: debt.institution || 'Unknown Institution',
            currency: debt.currency || 'USD'
          };
        });

        // Calculate summary with safe number handling
        const totalAssets = finalAssets.reduce((sum, asset) => {
          const value = Number(asset.currentValue) || 0;
          return sum + (isNaN(value) ? 0 : value);
        }, 0);
        
        const totalDebts = processedDebts.reduce((sum, debt) => {
          const value = Number(debt.currentBalance) || 0;
          return sum + (isNaN(value) ? 0 : value);
        }, 0);
        
        const netWorth = totalAssets - totalDebts;
        
        const totalReturn = finalAssets.reduce((sum, asset) => {
          const value = Number(asset.totalReturn) || 0;
          return sum + (isNaN(value) ? 0 : value);
        }, 0);
        
        const totalReturnPercent = totalAssets > 0 ? (totalReturn / totalAssets) * 100 : 0;
        
        const dayChange = finalAssets.reduce((sum, asset) => {
          const value = Number(asset.dayChange) || 0;
          return sum + (isNaN(value) ? 0 : value);
        }, 0);
        
        const dayChangePercent = totalAssets > 0 ? (dayChange / totalAssets) * 100 : 0;


        setConsolidatedAssets(finalAssets);
        setConsolidatedDebts(processedDebts);
        setSummary({
          totalAssets,
          totalDebts,
          netWorth,
          totalReturn,
          totalReturnPercent,
          dayChange,
          dayChangePercent
        });

        setLoading(false);
      } catch (err) {
        console.error('Error loading consolidated data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    };

    loadConsolidatedData();
  }, [userId]);

  return {
    consolidatedAssets,
    consolidatedDebts,
    summary,
    loading,
    error
  };
}
