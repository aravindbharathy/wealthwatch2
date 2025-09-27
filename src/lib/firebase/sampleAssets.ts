// Sample data for testing the Assets page
import { AssetSheet, AssetSection, Asset } from './types';
import { Timestamp } from 'firebase/firestore';


export const sampleAssetSheets: Omit<AssetSheet, 'id'>[] = [
  {
    name: 'Investment Portfolio',
    userId: 'sample-user',
    sections: [],
    isActive: true,
    order: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: 'Retirement Account',
    userId: 'sample-user',
    sections: [],
    isActive: true,
    order: 1,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

export const sampleAssetSections: Omit<AssetSection, 'id' | 'sheetId'>[] = [
  {
    name: 'Robinhood Joint Account',
    assets: [],
    isExpanded: true,
    order: 0,
    summary: {
      totalInvested: 65619,
      totalValue: 85731,
      totalReturn: 20112,
      totalReturnPercent: 30.6,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: 'Section 2',
    assets: [],
    isExpanded: false,
    order: 1,
    summary: {
      totalInvested: 300,
      totalValue: 300,
      totalReturn: 0,
      totalReturnPercent: 0,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

export const sampleAssets: Omit<Asset, 'id'>[] = [
  {
    name: 'Dollar General Corp',
    type: 'equity',
    symbol: 'DG',
    exchange: 'NYSE',
    currency: 'USD',
    quantity: 525,
    currentPrice: 104.49,
    currentValue: 54857,
    costBasis: 39239,
    avgCost: 74.74,
    valueByDate: [],
    transactions: [],
    totalReturn: 15618,
    accountMapping: { isLinked: false },
    cashFlow: [],
    metadata: {
      description: 'Dollar General Corporation stock',
      tags: ['retail', 'consumer-staples'],
      customFields: {},
    },
    performance: {
      dayChange: -1250,
      dayChangePercent: -2.2,
      totalReturnPercent: 39.8,
    },
    sectionId: 'section-1',
    position: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: 'Danaos Corporation',
    type: 'equity',
    symbol: 'DAC',
    exchange: 'NYSE',
    currency: 'USD',
    quantity: 180,
    currentPrice: 96.32,
    currentValue: 17337,
    costBasis: 15329,
    avgCost: 85.16,
    valueByDate: [],
    transactions: [],
    totalReturn: 2008,
    accountMapping: { isLinked: false },
    cashFlow: [],
    metadata: {
      description: 'Danaos Corporation shipping stock',
      tags: ['shipping', 'transportation'],
      customFields: {},
    },
    performance: {
      dayChange: 450,
      dayChangePercent: 2.7,
      totalReturnPercent: 13.1,
    },
    sectionId: 'section-1',
    position: 1,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: 'Torm Plc Shs Cl A',
    type: 'equity',
    symbol: 'TRMD',
    exchange: 'NASDAQ',
    currency: 'USD',
    quantity: 571,
    currentPrice: 22.97,
    currentValue: 13115,
    costBasis: 11050,
    avgCost: 19.35,
    valueByDate: [],
    transactions: [],
    totalReturn: 2065,
    accountMapping: { isLinked: false },
    cashFlow: [],
    metadata: {
      description: 'Torm PLC Class A shares',
      tags: ['shipping', 'oil-tanker'],
      customFields: {},
    },
    performance: {
      dayChange: -320,
      dayChangePercent: -2.4,
      totalReturnPercent: 18.7,
    },
    sectionId: 'section-1',
    position: 2,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: 'Cash',
    type: 'cash',
    currency: 'USD',
    quantity: 1,
    currentPrice: 420,
    currentValue: 420,
    costBasis: 420,
    avgCost: 420,
    valueByDate: [],
    transactions: [],
    totalReturn: 0,
    accountMapping: { isLinked: false },
    cashFlow: [],
    metadata: {
      description: 'Cash balance',
      tags: ['cash', 'liquid'],
      customFields: {},
    },
    performance: {
      dayChange: 0,
      dayChangePercent: 0,
      totalReturnPercent: 0,
    },
    sectionId: 'section-1',
    position: 3,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: 'asasas',
    type: 'other',
    currency: 'USD',
    quantity: 1,
    currentPrice: 300,
    currentValue: 300,
    costBasis: 300,
    avgCost: 300,
    valueByDate: [],
    transactions: [],
    totalReturn: 0,
    accountMapping: { isLinked: false },
    cashFlow: [],
    metadata: {
      description: 'Sample asset',
      tags: ['sample'],
      customFields: {},
    },
    performance: {
      dayChange: 0,
      dayChangePercent: 0,
      totalReturnPercent: 0,
    },
    sectionId: 'section-2',
    position: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

// Helper function to create sample data with proper IDs
export const createSampleData = () => {
  const timestamp = Date.now();
  const sheets = sampleAssetSheets.map((sheet, index) => ({
    ...sheet,
    id: `sheet-${timestamp}-${index + 1}`,
  }));

  const sections = sampleAssetSections.map((section, index) => ({
    ...section,
    id: `section-${timestamp}-${index + 1}`,
    sheetId: sheets[0].id, // Assign all sections to the first sheet
  }));

  const assets = sampleAssets.map((asset, index) => ({
    ...asset,
    id: `asset-${timestamp}-${index + 1}`,
    sectionId: sections[0].id, // Assign all assets to the first section
    position: index, // Add position for ordering
  }));

  return { sheets, sections, assets };
};
