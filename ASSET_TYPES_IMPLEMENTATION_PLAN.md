# Asset Types Implementation Plan

**Last updated:** December 2024

## Overview

This document outlines the implementation plan for adding support for different asset types in the WealthWatch investment tracker. The current system only supports stock ticker assets, and we need to expand it to support various asset types including cash, crypto, bank accounts, real estate, vehicles, and manual assets.

## Current State Analysis

### ✅ What's Already Implemented

1. **Database Structure**: The `Asset` type in `types.ts` already supports multiple asset types:
   - `'stock_ticker'` - Currently implemented with full functionality
   - `'cash'` - Basic support exists in sample data
   - `'crypto_ticker'` - Structure exists
   - `'crypto_exchange_wallet'` - Structure exists
   - `'home'` - Structure exists
   - `'car'` - Structure exists
   - `'precious_metals'` - Structure exists
   - `'generic_asset'` - Basic support exists

2. **Current Add Asset Modal**: Only supports stock ticker search and creation
3. **Asset Display**: The `AssetTable` component displays all asset types uniformly
4. **Sample Data**: Includes examples of `cash` and `generic_asset` types

### ❌ What Needs Implementation

1. **Asset Type Selection UI**: No way to choose different asset types
2. **Type-Specific Forms**: Only stock ticker form exists
3. **Type-Specific Validation**: All assets use stock ticker validation
4. **Type-Specific Behaviors**: No differentiation in asset handling

## Implementation Phases

### Phase I: Asset Type Selection System ✅ COMPLETED

#### 1.1 Asset Type Configuration ✅
- ✅ Create centralized asset type definitions
- ✅ Define type-specific properties and behaviors
- ✅ Set up type icons, colors, and metadata

#### 1.2 Asset Type Selector Component ✅
- ✅ Create grid-based asset type selection UI
- ✅ Match the reference design with icons and descriptions
- ✅ Handle type selection and navigation to appropriate forms

#### 1.3 Update AddAssetModal Flow ✅
- ✅ Add asset type selection as first step
- ✅ Maintain backward compatibility
- ✅ Implement proper navigation between steps

### Phase II: Type-Specific Forms ✅ COMPLETED

#### 2.1 Create Specialized Form Components ✅
- ✅ `StockTickerForm.tsx` - Refactored from original implementation
- ✅ `CashForm.tsx` - Simple amount and currency input
- ✅ `CryptoForm.tsx` - Symbol search + exchange selection
- ✅ `CryptoExchangeForm.tsx` - Exchange account management
- ✅ `HomeForm.tsx` - Address, purchase price, current value
- ✅ `CarForm.tsx` - Make, model, year, VIN, current value
- ✅ `ManualAssetForm.tsx` - Name, description, current value

#### 2.2 Asset Type Behaviors

| Asset Type | Symbol Required | Exchange Required | Price Updates | Special Fields |
|------------|----------------|-------------------|---------------|----------------|
| Stock Ticker | ✅ | ✅ | ✅ (API) | Sector, Industry |
| Cash | ❌ | ❌ | ❌ | Account Type |
| Crypto Ticker | ✅ | ✅ | ✅ (API) | Wallet Address |
| Crypto Exchange | ❌ | ✅ | ❌ | Exchange Balance |
| Bank Account | ❌ | ❌ | ❌ | Institution, Account Number |
| Home | ❌ | ❌ | ❌ | Address, Year Built, Square Feet |
| Car | ❌ | ❌ | ❌ | Make, Model, Year, VIN |
| Manual Asset | ❌ | ❌ | ❌ | Description, Category |

### Phase III: Enhanced Asset Display (Future)

#### 3.1 Type-Specific Visual Elements
- Show type-specific icons in asset table
- Different color coding for asset types
- Type-specific information display

#### 3.2 Asset Type-Specific Actions
- **Stock/Crypto**: Price updates, transaction history
- **Bank Accounts**: Balance updates, transaction imports
- **Homes/Cars**: Manual value updates, depreciation tracking
- **Cash**: Simple balance adjustments

### Phase IV: API Integration and Data Sources (Future)

#### 4.1 Price Data Sources
- **Stocks**: Current MarketStack API
- **Crypto**: Add CoinGecko or similar API
- **Real Estate**: Zillow API or manual updates
- **Vehicles**: KBB API or manual updates

#### 4.2 Account Integration
- **Bank Accounts**: Plaid integration for balance updates
- **Brokerage**: Plaid integration for holdings
- **Crypto Exchanges**: Exchange API integrations

## Asset Type Definitions

### Stock Ticker
- **Purpose**: Individual stocks, ETFs, mutual funds
- **Data Source**: MarketStack API
- **Required Fields**: Symbol, Exchange, Quantity, Cost Basis
- **Optional Fields**: Current Price (auto-fetched)

### Cash
- **Purpose**: Cash and cash equivalents
- **Data Source**: Manual entry
- **Required Fields**: Amount, Currency
- **Optional Fields**: Account Type, Institution

### Crypto Ticker
- **Purpose**: Individual cryptocurrencies
- **Data Source**: Crypto API (future)
- **Required Fields**: Symbol, Exchange, Quantity, Cost Basis
- **Optional Fields**: Wallet Address

### Crypto Exchange Wallet
- **Purpose**: Crypto exchange accounts
- **Data Source**: Manual entry
- **Required Fields**: Exchange Name, Balance
- **Optional Fields**: Account ID

### Bank Account
- **Purpose**: Checking, savings, money market accounts
- **Data Source**: Manual entry (future: Plaid)
- **Required Fields**: Institution, Account Type, Balance
- **Optional Fields**: Account Number, Interest Rate

### Home
- **Purpose**: Real estate properties
- **Data Source**: Manual entry (future: Zillow API)
- **Required Fields**: Address, Purchase Price, Current Value
- **Optional Fields**: Year Built, Square Feet, Property Type

### Car
- **Purpose**: Vehicles
- **Data Source**: Manual entry (future: KBB API)
- **Required Fields**: Make, Model, Year, Current Value
- **Optional Fields**: VIN, Mileage, Condition

### Manual Asset
- **Purpose**: Any other asset type
- **Data Source**: Manual entry
- **Required Fields**: Name, Current Value
- **Optional Fields**: Description, Category, Tags

## Technical Implementation Details

### File Structure
```
src/
├── components/assets/
│   ├── modals/
│   │   ├── AddAssetModal.tsx (updated)
│   │   ├── AssetTypeSelector.tsx (new)
│   │   ├── forms/
│   │   │   ├── StockTickerForm.tsx (refactored)
│   │   │   ├── CashForm.tsx (new)
│   │   │   ├── CryptoForm.tsx (new)
│   │   │   ├── BankAccountForm.tsx (new)
│   │   │   ├── HomeForm.tsx (new)
│   │   │   ├── CarForm.tsx (new)
│   │   │   └── ManualAssetForm.tsx (new)
├── lib/
│   ├── assetTypes.ts (new)
│   ├── firebase/
│   │   ├── types.ts (updated)
│   │   └── firebaseUtils.ts (updated)
```

### Key Components

#### AssetTypeSelector
- Grid layout matching reference design
- Icon-based selection
- Type descriptions and tooltips
- Responsive design

#### Form Components
- Consistent validation patterns
- Type-specific field requirements
- Currency input support
- Error handling

#### Updated AddAssetModal
- Multi-step flow: Type Selection → Form → Review
- Backward compatibility with current stock flow
- Proper state management
- Loading states

## Implementation Priority

### Phase I (COMPLETED)
1. ✅ Asset type configuration system
2. ✅ Asset type selector component
3. ✅ Update AddAssetModal flow

### Phase II (COMPLETED)
1. ✅ Cash form implementation
2. ✅ Manual asset form implementation
3. ✅ Crypto exchange form implementation
4. ✅ Home form implementation
5. ✅ Car form implementation
6. ✅ Crypto form implementation
7. ✅ Stock ticker form refactoring

### Future Phases
1. Type-specific visual elements in asset display
2. API integrations for price updates
3. Account linking and automation
4. Advanced features and analytics

## Success Criteria

### Phase I Complete When:
- [x] Users can select from multiple asset types
- [x] Asset type selector matches reference design
- [x] Navigation between type selection and forms works
- [x] Backward compatibility maintained

### Phase II Complete When:
- [x] All asset types have dedicated forms
- [x] Type-specific validation works correctly
- [x] Assets can be created for all supported types
- [x] Forms handle currency inputs properly
- [x] Error handling is consistent across forms

## Notes

- Asset display in sheets/sections remains unchanged for now
- All assets will show uniformly in the asset table
- Type-specific visual elements will be added in Phase III
- API integrations are planned for future phases
- The implementation maintains backward compatibility with existing stock ticker functionality
