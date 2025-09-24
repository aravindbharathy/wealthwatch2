import { NextResponse } from 'next/server';
import { InstitutionProviderMapping } from '../../../../lib/firebase/types';
import { Timestamp } from 'firebase/firestore';

// Hardcoded institution provider mappings for now
// In production, this would be stored in a database
const institutionProviders: InstitutionProviderMapping[] = [
  {
    institutionId: 'ins_3',
    institutionName: 'Chase',
    preferredProvider: 'plaid',
    supportedProducts: ['investments', 'auth', 'transactions'],
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    institutionId: 'ins_4',
    institutionName: 'Wells Fargo',
    preferredProvider: 'plaid',
    supportedProducts: ['investments', 'auth', 'transactions'],
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    institutionId: 'ins_5',
    institutionName: 'Bank of America',
    preferredProvider: 'plaid',
    supportedProducts: ['investments', 'auth', 'transactions'],
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    institutionId: 'ins_6',
    institutionName: 'Fidelity',
    preferredProvider: 'plaid',
    supportedProducts: ['investments', 'auth'],
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    institutionId: 'ins_7',
    institutionName: 'Vanguard',
    preferredProvider: 'plaid',
    supportedProducts: ['investments', 'auth'],
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: institutionProviders,
      count: institutionProviders.length
    });
  } catch (error) {
    console.error('Institution providers error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch institution providers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
