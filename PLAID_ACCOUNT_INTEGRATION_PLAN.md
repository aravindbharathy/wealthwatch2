# Plaid Account Integration Implementation Plan

## Overview
This document outlines the comprehensive plan for implementing Plaid account connections in the WealthWatch application. The implementation will allow users to connect their bank and brokerage accounts through Plaid and automatically sync their holdings.

## Architecture Overview

### Core Concept
- **Account as Asset**: Accounts are treated as special assets that can hold other assets (holdings)
- **Provider Mapping**: Different institutions may require different providers (Plaid, Yodlee, etc.)
- **Section Integration**: Accounts appear as line items within existing sections
- **Automatic Sync**: Holdings are automatically created as linked assets

### Key Components
1. **Database Schema Extensions**: New Account entity and enhanced Asset linking
2. **Plaid API Integration**: Holdings and account data fetching
3. **Service Layer**: Account management and data transformation
4. **UI Components**: Account connection forms and display
5. **Provider Mapping**: Institution-to-provider mapping system

## Implementation Phases

### Phase 1: Foundation (Week 1) ✅
- [x] Update type definitions in `types.ts`
- [x] Create Plaid API routes
- [x] Implement PlaidService class
- [x] Add account asset type to assetTypes.ts

### Phase 2: Core Features (Week 2)
- [ ] Create AccountService for account management
- [ ] Build AccountForm component
- [ ] Update AssetTable to display accounts
- [ ] Add account validation

### Phase 3: Integration (Week 3)
- [ ] Integrate with existing asset management flow
- [ ] Add account sync refresh functionality
- [ ] Implement error handling and retry logic
- [ ] Add loading states and progress indicators

### Phase 4: Enhancement (Week 4)
- [ ] Add institution provider mapping
- [ ] Implement automatic refresh scheduling
- [ ] Add account disconnection flow
- [ ] Create account management dashboard

## Database Schema

### Account Entity
```typescript
export interface Account extends BaseDocument {
  id: string;
  name: string;
  officialName?: string;
  type: 'investment' | 'credit' | 'depository' | 'loan' | 'brokerage' | 'other';
  subtype?: string;
  institution: string;
  currency: string;
  providerAccountId: string; // Plaid account_id
  providerItemId?: string; // Plaid item_id
  mask?: string;
  balances: {
    available?: number;
    current: number;
    currencyCode: string;
    lastUpdated: Timestamp;
  };
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'manual';
  provider: 'plaid' | 'yodlee' | 'manual';
  lastSyncAt?: Timestamp;
  syncErrors?: string[];
  holdingAssetIds: string[];
  sectionId: string;
  position: number;
  performance: AccountPerformance;
}
```

### Enhanced Asset Linking
```typescript
export interface Asset extends BaseDocument {
  // ... existing fields ...
  accountMapping: {
    isLinked: boolean;
    accountId?: string;
    providerAccountId?: string;
    providerSecurityId?: string;
    externalId?: string;
  };
}
```

## API Endpoints

### Plaid Holdings API
- **Endpoint**: `/api/plaid/holdings`
- **Method**: POST
- **Purpose**: Fetch investment holdings from Plaid
- **Credentials**: 
  - Client ID: `6882a32845ca640021c5c2ce`
  - Secret: `f483717dbc3113cd81746a6ce511c3`
  - Environment: `sandbox`

### Institution Provider Mapping
- **Endpoint**: `/api/institutions/providers`
- **Method**: GET
- **Purpose**: Get institution-to-provider mappings

## Service Layer

### PlaidService
- `getHoldings(accessToken, accountIds?)`: Fetch holdings from Plaid
- `transformPlaidAccountToAccount(plaidAccount, sectionId)`: Transform Plaid account data
- `transformPlaidHoldingToAsset(holding, security, accountId, sectionId)`: Transform holdings to assets

### AccountService
- `syncPlaidAccount(accessToken, sectionId, userId)`: Complete account sync process
- `refreshAccount(accountId, userId)`: Refresh specific account
- `disconnectAccount(accountId, userId)`: Disconnect account

## UI Components

### AccountForm
- Access token input
- Sync button with loading states
- Error handling and display
- Success feedback

### Account Display
- Special rendering in AssetTable
- Account summary with holdings count
- Connection status indicators
- Sync status and last updated time

## Testing Strategy

### Test Data
- Use existing `holdings-get.json` sandbox data
- Mock access tokens for different scenarios
- Test error conditions

### Test Cases
1. **Happy Path**: Successful account connection and sync
2. **Error Handling**: Invalid tokens, network failures
3. **Data Integrity**: Holdings correctly linked to accounts
4. **UI Integration**: Proper display in sections and asset table

## Security Considerations

1. **Token Storage**: Never store access tokens in client state
2. **API Security**: Validate all Plaid responses
3. **User Privacy**: Clear data retention policies
4. **Error Logging**: Log errors without exposing sensitive data

## File Structure

```
src/
├── app/api/
│   ├── plaid/
│   │   └── holdings/route.ts
│   └── institutions/
│       └── providers/route.ts
├── lib/
│   ├── services/
│   │   ├── plaidService.ts
│   │   └── accountService.ts
│   └── firebase/
│       └── types.ts (updated)
├── components/assets/
│   ├── modals/forms/
│   │   └── AccountForm.tsx
│   └── AssetTable.tsx (updated)
└── lib/assetTypes.ts (updated)
```

## Success Metrics

- [ ] Users can connect Plaid accounts successfully
- [ ] Holdings are automatically synced and displayed
- [ ] Account data is properly linked to assets
- [ ] UI provides clear feedback on connection status
- [ ] Error handling works for various failure scenarios
- [ ] Performance is acceptable for typical account sizes

## Future Enhancements

1. **Multiple Providers**: Support for Yodlee and other providers
2. **Real-time Updates**: Webhook integration for live updates
3. **Advanced Analytics**: Account-level performance metrics
4. **Bulk Operations**: Connect multiple accounts at once
5. **Account Categorization**: Automatic categorization of account types
