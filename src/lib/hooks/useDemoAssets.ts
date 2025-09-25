"use client";

import { useState, useEffect } from 'react';
import { AssetSheet, AssetSection, Asset, AssetSummary } from '../firebase/types';
import { createSampleData } from '../firebase/sampleAssets';


// Cache for demo data to prevent duplicate creation
let cachedDemoSheets: AssetSheet[] | null = null;

// Demo mode hook that provides sample data without Firebase
export function useDemoAssetSheets() {
  const [sheets, setSheets] = useState<AssetSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use cached data if available
    if (cachedDemoSheets) {
      setSheets(cachedDemoSheets);
      setLoading(false);
      return;
    }

    // Simulate loading delay
    const timer = setTimeout(() => {
      try {
        const { sheets: sampleSheets } = createSampleData();
        // Cache the data to prevent duplicate creation
        cachedDemoSheets = sampleSheets;
        setSheets(sampleSheets);
        setLoading(false);
        setError(null);
      } catch (err) {
        setError('Error loading demo data');
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const createSheet = async (input: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const newSheet: AssetSheet = {
      id: `sheet-${Date.now()}`,
      name: input.name,
      userId: input.userId,
      sections: [],
      isActive: true,
      order: sheets.length,
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    };
    setSheets(prev => [...prev, newSheet]);
    return newSheet.id;
  };

  const updateSheet = async (sheetId: string, updates: any) => {
    setSheets(prev => prev.map(sheet => 
      sheet.id === sheetId ? { ...sheet, ...updates } : sheet
    ));
  };

  const deleteSheet = async (sheetId: string) => {
    setSheets(prev => prev.filter(sheet => sheet.id !== sheetId));
  };

  const createSection = async (input: any) => {
    const newSection: AssetSection = {
      id: `section-${Date.now()}`,
      name: input.name,
      sheetId: input.sheetId,
      assets: [],
      isExpanded: true,
      order: input.order,
      isFromAccount: input.isFromAccount || false,
      summary: {
        totalInvested: 0,
        totalValue: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
      },
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    };
    
    setSheets(prev => prev.map(sheet => 
      sheet.id === input.sheetId 
        ? { ...sheet, sections: [...sheet.sections, newSection] }
        : sheet
    ));
    return newSection.id;
  };

  const updateSection = async (sectionId: string, updates: any) => {
    setSheets(prev => prev.map(sheet => ({
      ...sheet,
      sections: sheet.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    })));
  };

  const deleteSection = async (sectionId: string) => {
    // Remove assets from the cached demo assets
    if (cachedDemoAssets) {
      cachedDemoAssets = cachedDemoAssets.filter(asset => asset.sectionId !== sectionId);
    }
    
    // Remove the section from sheets
    setSheets(prev => prev.map(sheet => ({
      ...sheet,
      sections: sheet.sections.filter(section => section.id !== sectionId)
    })));
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

export function useDemoAssetSummary(sheetId: string) {
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sheetId) {
      setLoading(false);
      return;
    }

    // Simulate loading delay
    const timer = setTimeout(() => {
      // Calculate demo summary
      const demoSummary: AssetSummary = {
        totalInvested: 1259000,
        totalValue: 2588000,
        totalReturn: 1329000,
        totalReturnPercent: 105.5,
        dayChange: 25000,
        dayChangePercent: 1.0,
        categories: {
          'stock_ticker': {
            name: 'Stocks',
            value: 2000000,
            invested: 1000000,
            return: 1000000,
            returnPercent: 100.0,
          },
          'real_estate': {
            name: 'Real Estate',
            value: 500000,
            invested: 200000,
            return: 300000,
            returnPercent: 150.0,
          },
          'cash': {
            name: 'Cash',
            value: 88000,
            invested: 59000,
            return: 29000,
            returnPercent: 49.2,
          },
        },
      };
      
      setSummary(demoSummary);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [sheetId]);

  return { summary, loading };
}

// Cache for demo assets to prevent duplicate creation
let cachedDemoAssets: Asset[] | null = null;

export function useDemoSectionAssets(sectionId: string) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sectionId) {
      setLoading(false);
      return;
    }

    // Use cached data if available
    if (cachedDemoAssets) {
      const sectionAssets = cachedDemoAssets.filter(asset => asset.sectionId === sectionId);
      setAssets(sectionAssets);
      setLoading(false);
      return;
    }

    // Simulate loading delay
    const timer = setTimeout(() => {
      try {
        const { assets: sampleAssets } = createSampleData();
        // Cache the data to prevent duplicate creation
        cachedDemoAssets = sampleAssets;
        // Filter assets for this section and sort by position
        const sectionAssets = sampleAssets
          .filter(asset => asset.sectionId === sectionId)
          .sort((a, b) => {
            const aPosition = a.position || 0;
            const bPosition = b.position || 0;
            return aPosition - bPosition;
          });
        setAssets(sectionAssets);
        setLoading(false);
        setError(null);
      } catch (err) {
        setError('Error loading demo assets');
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [sectionId]);

  const createAsset = async (input: any) => {
    // Calculate the next position for this section
    const nextPosition = assets.length > 0 ? Math.max(...assets.map(a => a.position || 0)) + 1 : 0;
    
    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      name: input.name,
      type: input.type,
      symbol: input.symbol,
      exchange: input.exchange,
      currency: input.currency,
      quantity: input.quantity,
      currentPrice: input.currentPrice,
      currentValue: input.currentValue,
      costBasis: input.costBasis,
      avgCost: input.costBasis / input.quantity,
      valueByDate: [],
      transactions: [],
      totalReturn: input.currentValue - input.costBasis,
      accountMapping: { isLinked: false },
      cashFlow: [],
      metadata: input.metadata || { tags: [], customFields: {} },
      performance: {
        totalReturnPercent: input.costBasis > 0 ? 
          ((input.currentValue - input.costBasis) / input.costBasis) * 100 : 0,
      },
      sectionId: input.sectionId,
      position: input.position !== undefined ? input.position : nextPosition,
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    };
    
    setAssets(prev => [...prev, newAsset]);
    return newAsset.id;
  };

  const updateAsset = async (assetId: string, updates: any) => {
    setAssets(prev => prev.map(asset => 
      asset.id === assetId ? { ...asset, ...updates } : asset
    ));
  };

  const deleteAsset = async (assetId: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== assetId));
  };

  const reorderAssets = async (assetIds: string[]) => {
    // Demo implementation - just log the reorder
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
