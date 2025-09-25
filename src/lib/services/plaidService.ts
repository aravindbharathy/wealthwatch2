import { Account, Asset } from '../firebase/types';
import { Timestamp } from 'firebase/firestore';

// Plaid API response types
interface PlaidAccount {
  account_id: string;
  balances: {
    available?: number;
    current: number;
    iso_currency_code: string;
    limit?: number;
    unofficial_currency_code?: string;
  };
  mask?: string;
  name: string;
  official_name?: string;
  subtype?: string;
  type: string;
}

interface PlaidHolding {
  account_id: string;
  cost_basis: number;
  institution_price: number;
  institution_price_as_of: string;
  institution_price_datetime?: string;
  institution_value: number;
  iso_currency_code: string;
  quantity: number;
  security_id: string;
  unofficial_currency_code?: string;
}

interface PlaidSecurity {
  close_price?: number;
  close_price_as_of?: string;
  cusip?: string;
  institution_id?: string;
  institution_security_id?: string;
  is_cash_equivalent: boolean;
  isin?: string;
  iso_currency_code: string;
  name: string;
  proxy_security_id?: string;
  security_id: string;
  sedol?: string;
  ticker_symbol?: string;
  type: string;
  subtype?: string;
  unofficial_currency_code?: string;
  update_datetime?: string;
  market_identifier_code?: string;
  sector?: string;
  industry?: string;
  option_contract?: any;
  fixed_income?: any;
}

interface PlaidItem {
  available_products: string[];
  billed_products: string[];
  consent_expiration_time?: string;
  error?: any;
  institution_id: string;
  institution_name: string;
  item_id: string;
  update_type: string;
  webhook?: string;
  auth_method?: string;
}

interface PlaidHoldingsResponse {
  accounts: PlaidAccount[];
  holdings: PlaidHolding[];
  securities: PlaidSecurity[];
  item: PlaidItem;
  request_id: string;
}

export class PlaidService {
  /**
   * Call Plaid API endpoints
   */
  private static async callPlaidAPI(endpoint: string, data: any) {
    const response = await fetch(`/api/plaid/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Plaid API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
    
    return response.json();
  }
  
  /**
   * Fetch investment holdings from Plaid
   */
  static async getHoldings(accessToken: string, accountIds?: string[]): Promise<PlaidHoldingsResponse> {
    const response = await this.callPlaidAPI('holdings', { 
      access_token: accessToken, 
      account_ids: accountIds 
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch holdings');
    }
    
    return response.data;
  }
  
  /**
   * Transform Plaid account data to our Account interface
   */
  static transformPlaidAccountToAccount(
    plaidAccount: PlaidAccount, 
    institutionName: string = 'Unknown Institution'
  ): Omit<Account, 'id' | 'createdAt' | 'updatedAt'> {
    const accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> = {
      name: plaidAccount.name,
      officialName: plaidAccount.official_name,
      type: this.mapPlaidAccountType(plaidAccount.type),
      subtype: plaidAccount.subtype,
      institution: institutionName,
      currency: plaidAccount.balances.iso_currency_code,
      providerAccountId: plaidAccount.account_id,
      mask: plaidAccount.mask,
      balances: {
        available: plaidAccount.balances.available,
        current: plaidAccount.balances.current,
        currencyCode: plaidAccount.balances.iso_currency_code,
        lastUpdated: Timestamp.now(),
      },
      connectionStatus: 'connected',
      provider: 'plaid',
      lastSyncAt: Timestamp.now(),
      syncErrors: [],
      holdingAssetIds: [],
      displayPreference: 'consolidated', // Default to showing consolidated account view
      performance: {
        totalReturnPercent: 0,
      },
      accountNumber: plaidAccount.mask,
      isActive: true,
      integrationInfo: {
        plaidAccountId: plaidAccount.account_id,
        provider: 'plaid',
        lastSync: Timestamp.now(),
      },
      transactions: [],
      valueByDate: [],
    };
    
    // Don't include costBasis field for Plaid accounts (Firebase doesn't accept undefined values)
    return accountData;
  }
  
  /**
   * Transform Plaid holding data to our Asset interface
   */
  static transformPlaidHoldingToAsset(
    holding: PlaidHolding, 
    security: PlaidSecurity, 
    accountId: string, 
    sectionId: string
  ): Omit<Asset, 'id' | 'createdAt' | 'updatedAt'> {
    const assetType = this.determineAssetType(security);
    const totalReturn = holding.institution_value - (holding.cost_basis * holding.quantity);
    const totalReturnPercent = holding.cost_basis > 0 
      ? (totalReturn / (holding.cost_basis * holding.quantity)) * 100 
      : 0;
    
    return {
      name: security.name,
      type: assetType,
      subType: security.subtype,
      symbol: security.ticker_symbol,
      exchange: security.market_identifier_code,
      currency: holding.iso_currency_code,
      quantity: holding.quantity,
      currentPrice: holding.institution_price,
      currentValue: holding.institution_value,
      costBasis: holding.cost_basis * holding.quantity,
      avgCost: holding.cost_basis,
      totalReturn,
      sectionId,
      position: 0, // Will be calculated when added to section
      accountMapping: {
        isLinked: true,
        accountId,
        providerAccountId: holding.account_id,
        providerSecurityId: holding.security_id,
      },
      valueByDate: [],
      transactions: [],
      cashFlow: [],
      metadata: {
        description: `${security.type} - ${security.name}`,
        tags: [security.sector, security.industry].filter(Boolean) as string[],
        customFields: {
          cusip: security.cusip,
          isin: security.isin,
          sedol: security.sedol,
          isCashEquivalent: security.is_cash_equivalent,
          institutionSecurityId: security.institution_security_id,
        },
      },
      performance: {
        totalReturnPercent,
      },
    };
  }
  
  /**
   * Map Plaid account types to our account types
   */
  private static mapPlaidAccountType(plaidType: string): Account['type'] {
    const typeMap: Record<string, Account['type']> = {
      'investment': 'investment',
      'credit': 'credit',
      'depository': 'depository',
      'loan': 'loan',
      'brokerage': 'brokerage',
      'other': 'other',
    };
    
    return typeMap[plaidType] || 'other';
  }
  
  /**
   * Determine asset type based on security data
   */
  private static determineAssetType(security: PlaidSecurity): Asset['type'] {
    if (security.is_cash_equivalent) {
      return 'cash';
    }
    
    switch (security.type) {
      case 'equity':
        return 'stock_ticker';
      case 'cryptocurrency':
        return 'crypto_ticker';
      case 'etf':
      case 'mutual fund':
        return 'stock_ticker';
      case 'fixed income':
        return 'generic_asset';
      case 'derivative':
        return 'generic_asset';
      default:
        return 'generic_asset';
    }
  }
  
  /**
   * Get institution name from Plaid item data
   */
  static getInstitutionName(item: PlaidItem): string {
    return item.institution_name || 'Unknown Institution';
  }
  
  /**
   * Validate Plaid response data
   */
  static validatePlaidResponse(data: any): boolean {
    return data && 
           Array.isArray(data.accounts) && 
           Array.isArray(data.holdings) && 
           Array.isArray(data.securities) &&
           data.item;
  }

  /**
   * Create a sandbox public token
   */
  static async createSandboxToken(
    institutionId: string = 'ins_109508', // Chase by default
    initialProducts: string[] = ['investments', 'auth'],
    userToken?: string
  ): Promise<{ public_token: string; request_id: string }> {
    const response = await this.callPlaidAPI('sandbox-token', {
      institution_id: institutionId,
      initial_products: initialProducts,
      user_token: userToken
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to create sandbox token');
    }
    
    return response.data;
  }

  /**
   * Exchange public token for access token
   */
  static async exchangePublicToken(publicToken: string): Promise<{
    access_token: string;
    item_id: string;
    request_id: string;
  }> {
    const response = await this.callPlaidAPI('exchange-token', {
      public_token: publicToken
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to exchange public token');
    }
    
    return response.data;
  }

  /**
   * Complete flow: Create sandbox token, exchange it, and fetch holdings
   */
  static async testSandboxFlow(
    institutionId: string = 'ins_109508',
    initialProducts: string[] = ['investments', 'auth']
  ): Promise<PlaidHoldingsResponse> {
    try {
      // Step 1: Create sandbox public token
      const { public_token } = await this.createSandboxToken(institutionId, initialProducts);
      
      // Step 2: Exchange for access token
      const { access_token } = await this.exchangePublicToken(public_token);
      
      // Step 3: Fetch holdings using the access token
      return await this.getHoldings(access_token);
    } catch (error) {
      throw new Error(`Sandbox flow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
