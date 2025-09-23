import { NextResponse } from 'next/server';
import { InstitutionProviderMapping } from '../../../../lib/firebase/types';

// Hardcoded institution provider mappings for now
// In production, this would be stored in a database
const institutionProviders: InstitutionProviderMapping[] = [
  {
    id: 'mapping_1',
    institutionId: 'ins_3',
    institutionName: 'Chase',
    preferredProvider: 'plaid',
    supportedProducts: ['investments', 'auth', 'transactions'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mapping_2',
    institutionId: 'ins_4',
    institutionName: 'Wells Fargo',
    preferredProvider: 'plaid',
    supportedProducts: ['investments', 'auth', 'transactions'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mapping_3',
    institutionId: 'ins_5',
    institutionName: 'Bank of America',
    preferredProvider: 'plaid',
    supportedProducts: ['investments', 'auth', 'transactions'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mapping_4',
    institutionId: 'ins_6',
    institutionName: 'Fidelity',
    preferredProvider: 'plaid',
    supportedProducts: ['investments', 'auth'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mapping_5',
    institutionId: 'ins_7',
    institutionName: 'Vanguard',
    preferredProvider: 'plaid',
    supportedProducts: ['investments', 'auth'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
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
