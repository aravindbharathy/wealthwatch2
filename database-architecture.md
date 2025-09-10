# Comprehensive Investment Tracker Database Structure

**Last updated:** September 9, 2025

***

This database schema is designed to comprehensively support an investment tracking application in alignment with the full asset taxonomies and relationships illustrated in your provided asset map. This structure accommodates all major asset types (both deposit-linked, market-linked, and manually tracked), debts, linked accounts, transaction histories, portfolio analytics, snapshots, and performance metrics. Fields are marked optional where required for flexibility, ensuring robust support for both manual and connected tracking workflows.

***

## Database Schema

***

### 1. Users Collection

```typescript
users/{userId}/
├── profile/
│   ├── displayName: string
│   ├── email: string
│   ├── photoURL: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
├── preferences/
│   ├── defaultCurrency: string            // User's preferred currency (USD, EUR, etc.)
│   ├── dateFormat: string                 // e.g. 'MM/DD/YYYY'
│   ├── numberFormat: string               // e.g. '1,234.56'
│   ├── notifications: object
│   └── riskTolerance: string              // e.g. 'conservative', 'moderate', 'aggressive'
├── settings/
│   ├── theme: string                      // e.g. 'light' or 'dark'
│   ├── language: string
│   ├── privacy: object
│   └── dataRetention: number              // in months
├── sheets/                                // Asset organization sheets
│   └── {sheetId}/
│       ├── name: string
│       ├── description?: string
│       ├── isActive: boolean
│       ├── order: number
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
├── sections/                              // Asset sections within sheets
│   └── {sectionId}/
│       ├── name: string
│       ├── description?: string
│       ├── sheetId: string                // Reference to parent sheet
│       ├── isExpanded: boolean
│       ├── order: number
│       ├── summary: object                // Calculated summary data
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
└── assets/                                // Individual assets
    └── {assetId}/
        ├── name: string
        ├── type: string
        ├── sectionId: string              // Reference to parent section
        ├── symbol?: string
        ├── exchange?: string
        ├── currency: string
        ├── quantity: number
        ├── currentPrice?: number
        ├── currentValue: number
        ├── costBasis: number
        ├── avgCost?: number
        ├── valueByDate: array
        ├── transactions: array
        ├── totalReturn: number
        ├── accountMapping: object
        ├── cashFlow: array
        ├── metadata: object
        ├── performance: object
        ├── createdAt: timestamp
        └── updatedAt: timestamp
```

***

### 2. Assets Collection

```typescript
users/{userId}/assets/{assetId}
├── name: string                             // Asset name
├── type: string                             // stock_ticker, cash, crypto_ticker, crypto_exchange_wallet, home, car, precious_metals, generic_asset
├── subType?: string                         // For finer categorization (e.g., mutual_fund, collectible)
├── symbol?: string                          // e.g., 'AAPL', 'BTC' (only for ticker-linked assets)
├── exchange?: string                        // e.g., 'NASDAQ', 'Binance'
├── currency: string                         // Currency for this asset
├── quantity: number                         // Amount/shares/units held
├── currentPrice?: number                    // Only for price-quoted/traded assets
├── currentValue: number                     // Present market value or user-set value
├── costBasis: number                        // Total acquisition cost
├── avgCost?: number                         // Average cost per unit
├── valueByDate: [                           // Historical values of the asset
│   {
│     date: timestamp,                       // Date of entry
│     value: number,                         // Value at that date
│     price?: number,                        // Price per unit at that date (if relevant)
│     quantity: number                       // Quantity held that day
│   }
│ ]
├── transactions?: [                         // OPTIONAL: Transaction history for this asset
│   {
│     id: string,
│     type: string,                          // buy, sell, dividend, split, adjustment, etc.
│     quantity: number,
│     price: number,
│     totalAmount: number,
│     date: timestamp,
│     fees?: number,
│     notes?: string
│   }
│ ]
├── totalReturn: number                      // Cumulative return since acquisition
├── accountMapping: {                        // Connection to an associated account, if synced
│   isLinked: boolean,
│   accountId?: string,                      // Reference to users/{userId}/accounts/{accountId}
│   externalId?: string                      // e.g., Plaid item/account ID
│ }
├── cashFlow?: [                             // OPTIONAL: Cashflow events (dividends, rent, etc.)
│   {
│     type: string,                          // cash_in, cash_out
│     amount: number,
│     date: timestamp,
│     description: string
│   }
│ ]
├── metadata: {
│   description?: string,
│   tags: string[],
│   location?: string,                       // For physical assets
│   model?: string,                          // e.g., for vehicles
│   year?: number,                           // For vehicles or real estate
│   address?: string,                        // For real estate
│   customFields: object
│ }
├── performance: {                           // Performance tracking for returns and volatility
│   dayChange?: number,
│   dayChangePercent?: number,
│   weekChange?: number,
│   weekChangePercent?: number,
│   monthChange?: number,
│   monthChangePercent?: number,
│   yearChange?: number,
│   yearChangePercent?: number,
│   totalReturnPercent: number
│ }
├── createdAt: timestamp
└── updatedAt: timestamp
```

***

### 2. Debts Collection

```typescript
users/{userId}/debts/{debtId}
├── name: string                             // Debt instrument name
├── type: string                             // credit_card, mortgage, auto_loan, student_loan, personal_loan, line_of_credit
├── principal: number                        // Original principal
├── currentBalance: number                   // Outstanding debt
├── interestRate: number                     // Annual rate
├── minimumPayment: number                   // Next minimum payment required
├── dueDate: date                            // Next due date
├── accountNumber?: string                   // Account number or reference, optional
├── institution: string                      // Lending entity
├── currency: string
├── status: string                           // active, paid_off, defaulted, frozen
├── terms: {
│   termLength?: number,                     // if finite, in months
│   paymentFrequency: string,                // e.g., 'monthly'
│   fixedRate: boolean,
│   maturityDate?: date
│ }
├── paymentHistory: [                        // Payment log
│   {
│     id: string,
│     amount: number,
│     date: timestamp,
│     type: string,                          // payment, interest, fee, penalty
│     principalPortion?: number,
│     interestPortion?: number,
│     description: string
│   }
│ ]
├── accountMapping: {
│   isLinked: boolean,
│   accountId?: string,
│   externalId?: string
│ }
├── valueByDate: [                           // Historical outstanding balance tracking
│   {
│     date: timestamp,
│     balance: number
│   }
│ ]
├── createdAt: timestamp
└── updatedAt: timestamp
```

***

### 3. Accounts Collection

```typescript
users/{userId}/accounts/{accountId}
├── name: string                             // Account name
├── type: string                             // checking, savings, brokerage, retirement, credit_card, etc.
├── institution: string                      // Financial services provider
├── accountNumber?: string                   // Masked or truncated account number (OPTIONAL)
├── currency: string
├── balances: {
│   current: number,                         // Current balance
│   available?: number,                      // Liquid available
│   pending?: number,                        // Not yet posted
│   lastUpdated: timestamp
│ }
├── holdings?: [                             // OPTIONAL: Array of links to asset/debt references
│   {
│     assetId?: string,                      // Reference to users/{userId}/assets/{assetId}
│     debtId?: string,                       // Reference to users/{userId}/debts/{debtId}
│     type: string,                          // 'asset' or 'debt'
│     quantity?: number,                     // For tradable assets
│     currentValue: number,
│     lastUpdated: timestamp
│   }
│ ]
├── isActive: boolean
├── connectionStatus: string                 // connected, disconnected, error, manual
├── integrationInfo?: {                      // For Plaid/API connections
│   plaidAccountId?: string,
│   plaidItemId?: string,
│   provider: string,                        // 'plaid', 'yodlee', 'manual', etc.
│   lastSync: timestamp,
│   syncErrors?: string[]
│ }
├── transactions?: [                         // OPTIONAL: Transaction ledger
│   {
│     id: string,
│     amount: number,
│     type: string,                          // debit, credit, transfer
│     description: string,
│     category?: string,
│     subcategory?: string,
│     date: timestamp,
│     balance: number,
│     cashIn?: number,
│     cashOut?: number,
│     linkedAssetId?: string                 // Ref to asset if relevant
│   }
│ ]
├── performance: {                           // Performance data as in assets
│   dayChange?: number,
│   dayChangePercent?: number,
│   weekChange?: number,
│   weekChangePercent?: number,
│   monthChange?: number,
│   monthChangePercent?: number,
│   yearChange?: number,
│   yearChangePercent?: number,
│   totalReturn?: number,
│   totalReturnPercent?: number
│ }
├── valueByDate?: [                          // OPTIONAL: Time-series tracking of daily account value
│   {
│     date: timestamp,
│     balance: number,
│     totalValue?: number,                    // Sum value of all holdings for investment accounts
│     cashFlow?: number                       // Net cashflow that day
│   }
│ ]
├── createdAt: timestamp
└── updatedAt: timestamp
```

***

### 4. Portfolio Analytics Collection

```typescript
users/{userId}/analytics/{date}
├── date: timestamp
├── netWorth: {
│   total: number,                            // Net worth that day
│   liquid: number,                           // Liquid net worth
│   totalAssets: number,
│   totalDebts: number,
│   currency: string
│ }
├── assetAllocation: {
│   byType: {
│     stocks: number,
│     crypto: number,
│     cash: number,
│     realEstate: number,
│     vehicles: number,
│     preciousMetals: number,
│     other: number
│   },
│   byAccount: object,                        // {accountId: percent, ...}
│   byCurrency: object                        // {currencyCode: percent, ...}
│ }
├── performance: {
│   dayChange: number,
│   dayChangePercent: number,
│   weekChange: number,
│   weekChangePercent: number,
│   monthChange: number,
│   monthChangePercent: number,
│   yearChange: number,
│   yearChangePercent: number,
│   totalReturn: number,
│   totalReturnPercent: number
│ }
├── cashFlow: {
│   totalCashIn: number,
│   totalCashOut: number,
│   netCashFlow: number,
│   sources: [
│     {source: string, amount: number, type: string}
│   ]
│ }
├── riskMetrics: {
│   volatility?: number,
│   sharpeRatio?: number,
│   beta?: number,
│   diversificationScore?: number
│ }
└── createdAt: timestamp
```

***

### 6. Goals Collection

```typescript
users/{userId}/goals/{goalId}
├── name: string                             // Goal label
├── type: string                             // e.g., 'retirement', 'home', 'education'
├── targetAmount: number                     // Funding goal
├── currentAmount: number                    // Tracked progress
├── targetDate: date
├── priority: string                         // high, medium, low
├── linkedAssets: string[]                   // Array of assetIds contributing to goal
├── linkedAccounts: string[]                 // Array of accountIds for goal
├── monthlyContribution: number
├── status: string                           // on_track, behind, ahead, completed
├── progress: number                         // Percent to goal
├── projectedCompletion?: date               // Estimate according to performance
├── createdAt: timestamp
└── updatedAt: timestamp
```

***

### 7. Historical Data Collection

```typescript
users/{userId}/history/{timestamp}
├── date: timestamp
├── netWorthSnapshot: number
├── assetValues: [
│   {assetId: string, value: number, quantity: number}
│ ]
├── debtBalances: [
│   {debtId: string, balance: number}
│ ]
├── accountBalances: [
│   {accountId: string, balance: number}
│ ]
└── createdAt: timestamp
```

***

### 8. Categories Collection

```typescript
users/{userId}/categories/{categoryId}
├── name: string                             // Human-friendly category label
├── type: string                             // asset, transaction, goal, etc.
├── parent?: string                          // Category hierarchy
├── color?: string
├── icon?: string
├── isActive: boolean
├── createdAt: timestamp
└── updatedAt: timestamp
```

***

### 9. Stock/Crypto Tickers Reference Collection (Global Reference)

```typescript
tickers/{tickerId}
├── symbol: string                           // e.g. 'AAPL'
├── name: string
├── type: string                             // stock, crypto, etf, mutual_fund
├── exchange: string
├── currency: string
├── sector?: string
├── industry?: string
├── description?: string
├── marketCap?: number
├── lastUpdated: timestamp
└── isActive: boolean
```

***

## Notes on Data Model Design

- **Field Optionality (`?`):** Fields marked optional are not required for record creation, supporting both comprehensive and minimalist user workflows.
- **Value Tracking (`valueByDate`):** For both assets, debts, and accounts, this stores historical daily value snapshots for rich time-series and trend analytics.
- **Account-Asset normalization:** Account holdings now reference specific asset or debt records (by ID), ensuring each asset/debt has a single canonical record and reducing data duplication.
- **Transaction and Cashflow Flexibility:** Transactions are optional on both asset and account records and can be minimal or detailed, reflecting both manual and automatically integrated data.
- **Performance Fields:** Performance metrics (daily/weekly/monthly/yearly/total change and return) are tracked for both assets and accounts wherever relevant to allow granular analytics.
- **Rich Metadata:** Asset and category schemas support extensive metadata for UI, analytical, and extensibility needs.

***