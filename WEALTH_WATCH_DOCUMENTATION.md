# Wealth Watch - Investment Tracker Application

## 📋 Overview

Wealth Watch is a modern investment tracking application built with Next.js 14, TypeScript, and Firebase. The application provides a comprehensive platform for users to track their financial portfolio, manage assets, monitor debts, and maintain account information.

## 🏗️ Application Architecture

### Technology Stack
- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **State Management**: React Context API
- **Deployment**: Vercel-ready

### Project Structure
```
src/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── anthropic/            # Anthropic AI integration
│   │   ├── deepgram/             # Deepgram audio transcription
│   │   ├── openai/               # OpenAI integration
│   │   └── replicate/            # Replicate image generation
│   ├── dashboard/                # Dashboard page
│   │   └── page.tsx
│   ├── assets/                   # Assets management page
│   │   └── page.tsx
│   ├── debts/                    # Debts tracking page
│   │   └── page.tsx
│   ├── accounts/                 # Accounts management page
│   │   └── page.tsx
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage (redirects to dashboard)
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── Header.tsx                # Top navigation header
│   ├── Sidebar.tsx               # Side navigation panel
│   ├── MainLayout.tsx            # Main layout wrapper
│   ├── ImageUpload.tsx           # Image upload component
│   ├── SignInWithGoogle.tsx      # Google authentication
│   └── VoiceRecorder.tsx         # Voice recording component
└── lib/                          # Utility libraries
    ├── contexts/                 # React contexts
    │   ├── AuthContext.tsx       # Authentication context
    │   └── DeepgramContext.tsx   # Deepgram API context
    ├── firebase/                 # Firebase configuration & database
    │   ├── index.ts              # Main export file
    │   ├── firebase.ts           # Firebase initialization
    │   ├── firebaseUtils.ts      # Core CRUD operations
    │   ├── types.ts              # TypeScript interfaces
    │   ├── portfolioHelpers.ts   # Analytics & calculations
    │   ├── validation.ts         # Data validation functions
    │   └── seedData.ts           # Sample data & seeding utilities
    └── hooks/                    # Custom React hooks
        └── useAuth.ts            # Authentication hook
```

## 🎨 UI/UX Design

### Design System
- **Inspiration**: Kubera investment tracker interface
- **Color Scheme**: Clean white background with dark grey text
- **Accents**: Green for positive performance, red for negative
- **Typography**: Modern, clean fonts with proper hierarchy
- **Layout**: Responsive design with mobile-first approach

### Key UI Components

#### 1. Sidebar Navigation
- **Wealth Watch** branding with hamburger menu
- Navigation items with icons and values:
  - Net Worth (📊) - $0.00
  - Assets (💎) - $0.00
  - Debts (∞) - $0.00
  - Accounts (🏦) - $0.00
- Mobile app promotion section
- Collapsible design for mobile

#### 2. Header
- Trial expiry notice
- Action icons (refresh, search, share, globe)
- Currency selector dropdown (USD default)
- User profile with avatar
- Mobile menu button

#### 3. Page Layout
- Consistent white cards with shadows
- Placeholder content with icons
- Responsive grid system
- Loading states and empty states

## 🗄️ Database Structure (Firebase Firestore)

### ✅ **COMPREHENSIVE DATABASE IMPLEMENTATION COMPLETED**

The database architecture has been fully implemented with comprehensive TypeScript interfaces, CRUD operations, validation, and analytics functions. See `FIREBASE_DATABASE_IMPLEMENTATION.md` for detailed documentation.

### Collections Schema

#### 1. Users Collection (`users/{userId}`)
```typescript
users/{userId}/
├── profile/
│   ├── displayName: string
│   ├── email: string
│   ├── photoURL: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
├── preferences/
│   ├── defaultCurrency: string (USD, EUR, GBP, etc.)
│   ├── dateFormat: string
│   ├── numberFormat: string
│   ├── notifications: object
│   └── riskTolerance: string (conservative, moderate, aggressive)
└── settings/
    ├── theme: string (light, dark)
    ├── language: string
    ├── privacy: object
    └── dataRetention: number (months)
```

#### 2. Assets Collection (`users/{userId}/assets/{assetId}`)
```typescript
users/{userId}/assets/{assetId}
├── name: string                    // Asset name
├── type: string                    // stock_ticker, cash, crypto_ticker, home, car, etc.
├── subType?: string                // Finer categorization
├── symbol?: string                 // Ticker symbol (AAPL, BTC)
├── exchange?: string               // Exchange (NASDAQ, Binance)
├── currency: string                // Asset currency
├── quantity: number                // Number of shares/units
├── currentPrice?: number           // Current market price
├── currentValue: number            // Total current value
├── costBasis: number               // Total acquisition cost
├── avgCost?: number                // Average cost per unit
├── valueByDate: [{                 // Historical values
│   ├── date: timestamp
│   ├── value: number
│   ├── price?: number
│   └── quantity: number
│   }]
├── transactions?: [{               // Transaction history
│   ├── id: string
│   ├── type: string (buy, sell, dividend, etc.)
│   ├── quantity: number
│   ├── price: number
│   ├── totalAmount: number
│   ├── date: timestamp
│   ├── fees?: number
│   └── notes?: string
│   }]
├── totalReturn: number             // Cumulative return
├── accountMapping: {               // Account linking
│   ├── isLinked: boolean
│   ├── accountId?: string
│   └── externalId?: string
│   }
├── cashFlow?: [{                   // Cash flow events
│   ├── type: string (cash_in, cash_out)
│   ├── amount: number
│   ├── date: timestamp
│   └── description: string
│   }]
├── metadata: {                     // Rich metadata
│   ├── description?: string
│   ├── tags: string[]
│   ├── location?: string
│   ├── model?: string
│   ├── year?: number
│   ├── address?: string
│   └── customFields: object
│   }
├── performance: {                  // Performance metrics
│   ├── dayChange?: number
│   ├── dayChangePercent?: number
│   ├── weekChange?: number
│   ├── weekChangePercent?: number
│   ├── monthChange?: number
│   ├── monthChangePercent?: number
│   ├── yearChange?: number
│   ├── yearChangePercent?: number
│   └── totalReturnPercent: number
│   }
├── createdAt: timestamp
└── updatedAt: timestamp
```

#### 3. Debts Collection (`users/{userId}/debts/{debtId}`)
```typescript
users/{userId}/debts/{debtId}
├── name: string                    // Debt name
├── type: string                    // credit_card, mortgage, auto_loan, etc.
├── principal: number               // Original principal
├── currentBalance: number          // Outstanding balance
├── interestRate: number            // Annual interest rate
├── minimumPayment: number          // Minimum payment
├── dueDate: date                   // Next due date
├── accountNumber?: string          // Account reference
├── institution: string             // Lending entity
├── currency: string                // Debt currency
├── status: string                  // active, paid_off, defaulted, frozen
├── terms: {                        // Loan terms
│   ├── termLength?: number         // Term in months
│   ├── paymentFrequency: string    // monthly, etc.
│   ├── fixedRate: boolean
│   └── maturityDate?: date
│   }
├── paymentHistory: [{              // Payment log
│   ├── id: string
│   ├── amount: number
│   ├── date: timestamp
│   ├── type: string (payment, interest, fee, penalty)
│   ├── principalPortion?: number
│   ├── interestPortion?: number
│   └── description: string
│   }]
├── accountMapping: {               // Account linking
│   ├── isLinked: boolean
│   ├── accountId?: string
│   └── externalId?: string
│   }
├── valueByDate: [{                 // Historical balance tracking
│   ├── date: timestamp
│   └── balance: number
│   }]
├── createdAt: timestamp
└── updatedAt: timestamp
```

#### 4. Accounts Collection (`users/{userId}/accounts/{accountId}`)
```typescript
users/{userId}/accounts/{accountId}
├── name: string                    // Account name
├── type: string                    // checking, savings, brokerage, retirement, etc.
├── institution: string             // Financial institution
├── accountNumber?: string          // Masked account number
├── currency: string                // Account currency
├── balances: {                     // Account balances
│   ├── current: number             // Current balance
│   ├── available?: number          // Available balance
│   ├── pending?: number            // Pending transactions
│   └── lastUpdated: timestamp
│   }
├── holdings?: [{                   // Account holdings
│   ├── assetId?: string            // Reference to asset
│   ├── debtId?: string             // Reference to debt
│   ├── type: string (asset, debt)
│   ├── quantity?: number
│   ├── currentValue: number
│   └── lastUpdated: timestamp
│   }]
├── isActive: boolean               // Account status
├── connectionStatus: string        // connected, disconnected, error, manual
├── integrationInfo?: {             // API integration details
│   ├── plaidAccountId?: string
│   ├── plaidItemId?: string
│   ├── provider: string (plaid, yodlee, manual)
│   ├── lastSync: timestamp
│   └── syncErrors?: string[]
│   }
├── transactions?: [{               // Transaction ledger
│   ├── id: string
│   ├── amount: number
│   ├── type: string (debit, credit, transfer)
│   ├── description: string
│   ├── category?: string
│   ├── subcategory?: string
│   ├── date: timestamp
│   ├── balance: number
│   ├── cashIn?: number
│   ├── cashOut?: number
│   └── linkedAssetId?: string
│   }]
├── performance: {                  // Account performance
│   ├── dayChange?: number
│   ├── dayChangePercent?: number
│   ├── weekChange?: number
│   ├── weekChangePercent?: number
│   ├── monthChange?: number
│   ├── monthChangePercent?: number
│   ├── yearChange?: number
│   ├── yearChangePercent?: number
│   ├── totalReturn?: number
│   └── totalReturnPercent?: number
│   }
├── valueByDate?: [{                // Historical account values
│   ├── date: timestamp
│   ├── balance: number
│   ├── totalValue?: number
│   └── cashFlow?: number
│   }]
├── createdAt: timestamp
└── updatedAt: timestamp
```

#### 5. Goals Collection (`users/{userId}/goals/{goalId}`)
```typescript
users/{userId}/goals/{goalId}
├── name: string                    // Goal name
├── type: string                    // retirement, home, education, travel, etc.
├── targetAmount: number            // Target funding amount
├── currentAmount: number           // Current progress
├── targetDate: date                // Target completion date
├── priority: string                // high, medium, low
├── linkedAssets: string[]          // Array of asset IDs
├── linkedAccounts: string[]        // Array of account IDs
├── monthlyContribution: number     // Monthly contribution amount
├── status: string                  // on_track, behind, ahead, completed
├── progress: number                // Progress percentage
├── projectedCompletion?: date      // Estimated completion date
├── createdAt: timestamp
└── updatedAt: timestamp
```

#### 6. Portfolio Analytics Collection (`users/{userId}/analytics/{date}`)
```typescript
users/{userId}/analytics/{date}
├── date: timestamp                 // Analytics date
├── netWorth: {                     // Net worth breakdown
│   ├── total: number               // Total net worth
│   ├── liquid: number              // Liquid net worth
│   ├── totalAssets: number         // Total assets
│   ├── totalDebts: number          // Total debts
│   └── currency: string
│   }
├── assetAllocation: {              // Asset allocation analysis
│   ├── byType: {                   // Allocation by asset type
│   │   ├── stocks: number
│   │   ├── crypto: number
│   │   ├── cash: number
│   │   ├── realEstate: number
│   │   ├── vehicles: number
│   │   ├── preciousMetals: number
│   │   └── other: number
│   │   }
│   ├── byAccount: object           // Allocation by account
│   └── byCurrency: object          // Allocation by currency
│   }
├── performance: {                  // Performance metrics
│   ├── dayChange: number
│   ├── dayChangePercent: number
│   ├── weekChange: number
│   ├── weekChangePercent: number
│   ├── monthChange: number
│   ├── monthChangePercent: number
│   ├── yearChange: number
│   ├── yearChangePercent: number
│   ├── totalReturn: number
│   └── totalReturnPercent: number
│   }
├── cashFlow: {                     // Cash flow analysis
│   ├── totalCashIn: number
│   ├── totalCashOut: number
│   ├── netCashFlow: number
│   └── sources: [{                 // Cash flow sources
│   │   ├── source: string
│   │   ├── amount: number
│   │   └── type: string
│   │   }]
│   }
├── riskMetrics: {                  // Risk assessment
│   ├── volatility?: number
│   ├── sharpeRatio?: number
│   ├── beta?: number
│   └── diversificationScore?: number
│   }
└── createdAt: timestamp
```

#### 7. Historical Data Collection (`users/{userId}/history/{timestamp}`)
```typescript
users/{userId}/history/{timestamp}
├── date: timestamp                 // Snapshot date
├── netWorthSnapshot: number        // Net worth at date
├── assetValues: [{                 // Asset values snapshot
│   ├── assetId: string
│   ├── value: number
│   └── quantity: number
│   }]
├── debtBalances: [{                // Debt balances snapshot
│   ├── debtId: string
│   └── balance: number
│   }]
├── accountBalances: [{             // Account balances snapshot
│   ├── accountId: string
│   └── balance: number
│   }]
└── createdAt: timestamp
```

#### 8. Categories Collection (`users/{userId}/categories/{categoryId}`)
```typescript
users/{userId}/categories/{categoryId}
├── name: string                    // Category name
├── type: string                    // asset, transaction, goal, debt
├── parent?: string                 // Parent category
├── color?: string                  // Category color
├── icon?: string                   // Category icon
├── isActive: boolean               // Category status
├── createdAt: timestamp
└── updatedAt: timestamp
```

#### 9. Tickers Collection (`tickers/{tickerId}`) - Global Reference
```typescript
tickers/{tickerId}
├── symbol: string                  // Ticker symbol (AAPL, BTC)
├── name: string                    // Full name
├── type: string                    // stock, crypto, etf, mutual_fund
├── exchange: string                // Exchange name
├── currency: string                // Trading currency
├── sector?: string                 // Industry sector
├── industry?: string               // Industry classification
├── description?: string            // Asset description
├── marketCap?: number              // Market capitalization
├── lastUpdated: timestamp          // Last update time
└── isActive: boolean               // Active status
```

## 🛠️ Database Implementation Features

### ✅ **Comprehensive TypeScript Support**
- **Complete Type Safety**: All database operations are fully typed
- **IntelliSense Support**: Full autocomplete and error detection
- **Interface Definitions**: Detailed interfaces for all data structures
- **Validation Types**: Built-in validation with TypeScript

### ✅ **Advanced CRUD Operations**
- **Create Operations**: `createAsset`, `createDebt`, `createAccount`, `createGoal`
- **Read Operations**: `getUserAssets`, `getUserDebts`, `getUserAccounts`, `getUserGoals`
- **Update Operations**: `updateAsset`, `updateDebt`, `updateAccount`, `updateGoal`
- **Delete Operations**: `deleteAsset`, `deleteDebt`, `deleteAccount`, `deleteGoal`
- **Batch Operations**: Support for bulk operations and transactions

### ✅ **Portfolio Analytics Engine**
- **Net Worth Calculations**: Real-time total and liquid net worth
- **Asset Allocation**: By type, account, and currency
- **Performance Metrics**: Daily, weekly, monthly, yearly returns
- **Risk Assessment**: Volatility, Sharpe ratio, diversification score
- **Cash Flow Analysis**: Income, expenses, and net cash flow tracking

### ✅ **Data Validation System**
- **Input Validation**: Comprehensive validation for all data types
- **Business Logic**: Asset-specific validation rules
- **Error Handling**: Detailed error messages and warnings
- **Type Checking**: Runtime and compile-time validation

### ✅ **Sample Data & Seeding**
- **Pre-populated Tickers**: 20+ major stocks, crypto, and ETFs
- **Sample Categories**: Asset, debt, and goal categories
- **Demo User Data**: Complete sample portfolio
- **Seeding Utilities**: Easy setup for development and testing

### ✅ **Performance Optimizations**
- **Pagination**: Efficient handling of large datasets
- **Caching**: Optimized query patterns
- **Batch Operations**: Reduced database calls
- **Indexing**: Optimized for common query patterns

### 🔧 **Ready-to-Use Functions**

```typescript
// Import everything you need
import { 
  createAsset, getUserAssets, updateAsset, deleteAsset,
  createDebt, getUserDebts, updateDebt, deleteDebt,
  createAccount, getUserAccounts, updateAccount, deleteAccount,
  createGoal, getUserGoals, updateGoal, deleteGoal,
  generatePortfolioAnalytics, calculateNetWorth,
  validateCreateAssetInput, validateDebt,
  seedAllData, createSampleAssets
} from '@/lib/firebase';

// Example usage
const result = await createAsset(userId, {
  name: 'Apple Inc. (AAPL)',
  type: 'stock_ticker',
  symbol: 'AAPL',
  currency: 'USD',
  quantity: 10,
  currentValue: 1755.00,
  costBasis: 1500.00
});

if (result.success) {
  console.log('Asset created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## 🔧 Firebase Configuration

### Current Setup
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyBRFlZSwCYkP0PYaHfBmVDSzJCLBeveZ9c",
  authDomain: "wealthwatch-e8c32.firebaseapp.com",
  projectId: "wealthwatch-e8c32",
  storageBucket: "wealthwatch-e8c32.firebasestorage.app",
  messagingSenderId: "933918698096",
  appId: "1:933918698096:web:2fcaab09ce0627f4e9a2b5",
  measurementId: "G-K33PR5SRDE"
};
```

### Services Enabled
- ✅ **Authentication** - Google Sign-in (currently disabled)
- ✅ **Firestore Database** - Document storage
- ✅ **Storage** - File uploads
- ⏳ **Analytics** - User behavior tracking
- ⏳ **Cloud Functions** - Server-side logic
- ⏳ **Hosting** - Static site hosting

## 🚀 Current Implementation Status

### ✅ Completed Features
1. **Application Structure** - Next.js 14 with App Router
2. **UI Components** - Header, Sidebar, Layout components
3. **Navigation** - Routing between Dashboard, Assets, Debts, Accounts
4. **Responsive Design** - Mobile and desktop compatibility
5. **Firebase Integration** - Complete database implementation
6. **Authentication Setup** - Google sign-in (currently disabled)
7. **Currency Support** - Multi-currency selector
8. **Placeholder Pages** - All main pages with basic structure
9. **🗄️ COMPREHENSIVE DATABASE IMPLEMENTATION** - ✅ **COMPLETED**
   - Complete TypeScript interfaces for all collections
   - Full CRUD operations for all data types
   - Advanced portfolio analytics and calculations
   - Data validation and error handling
   - Sample data and seeding utilities
   - Performance optimization and caching

### 🔄 Ready for Integration
1. **Data Management** - ✅ CRUD operations implemented and ready
2. **Portfolio Analytics** - ✅ Advanced calculations and metrics ready
3. **Data Validation** - ✅ Comprehensive validation system ready
4. **Sample Data** - ✅ Pre-populated data for development/testing

### ⏳ Pending Implementation
1. **Real-time Updates** - Live price feeds and portfolio updates
2. **Analytics Dashboard** - Charts, graphs, performance metrics UI
3. **Account Integration** - Bank API connections (Plaid, Yodlee)
4. **Transaction Management** - Import and categorize transactions
5. **Reporting** - Generate financial reports
6. **Notifications** - Alerts and reminders
7. **Data Export** - CSV/PDF export functionality
8. **UI Integration** - Connect database functions to React components

## 📱 Future Development Roadmap

### ✅ Phase 1: Core Data Management - **COMPLETED**
- [x] Asset CRUD operations
- [x] Debt tracking functionality
- [x] Account management
- [x] Advanced portfolio calculations
- [x] Data validation and error handling
- [x] TypeScript interfaces and type safety

### 🔄 Phase 2: UI Integration & External APIs - **IN PROGRESS**
- [ ] Connect database functions to React components
- [ ] Stock price APIs (Alpha Vantage, Yahoo Finance)
- [ ] Bank account connections (Plaid, Yodlee)
- [ ] Crypto price feeds (CoinGecko, CoinMarketCap)
- [ ] Real estate valuation APIs
- [ ] Real-time data updates

### 📊 Phase 3: Analytics & Visualization - **NEXT**
- [x] Portfolio analytics and insights (backend ready)
- [x] Risk assessment tools (backend ready)
- [x] Goal tracking and planning (backend ready)
- [ ] Analytics dashboard UI
- [ ] Charts and visualizations
- [ ] Performance reporting
- [ ] Tax optimization suggestions

### 🚀 Phase 4: Advanced Features - **FUTURE**
- [ ] Advanced charts and visualizations
- [ ] Mobile app development
- [ ] Push notifications
- [ ] Social features and sharing
- [ ] Data export functionality
- [ ] Advanced reporting

## 🔒 Security Considerations

### Data Protection
- User data encryption in transit and at rest
- Firebase Security Rules for data access control
- Input validation and sanitization
- Rate limiting for API calls

### Privacy
- GDPR compliance for EU users
- Data retention policies
- User consent management
- Anonymization of analytics data

## 📊 Performance Optimization

### Frontend
- Next.js automatic code splitting
- Image optimization with next/image
- Lazy loading for components
- Service worker for offline functionality

### Backend
- Firestore query optimization
- Caching strategies
- CDN for static assets
- Database indexing

## 🧪 Testing Strategy

### Unit Tests
- Component testing with React Testing Library
- Utility function testing with Jest
- Firebase function testing

### Integration Tests
- API endpoint testing
- Database operation testing
- User flow testing

### E2E Tests
- Critical user journeys
- Cross-browser compatibility
- Mobile responsiveness

## 📈 Monitoring and Analytics

### Application Monitoring
- Error tracking with Sentry
- Performance monitoring
- User behavior analytics
- Database performance metrics

### Business Metrics
- User engagement tracking
- Feature usage analytics
- Conversion funnel analysis
- Revenue tracking (if applicable)

---

## 📞 Support and Maintenance

### Development Environment
- Node.js 18+
- npm/yarn package manager
- VS Code with TypeScript support
- Firebase CLI for deployment

### Deployment
- Vercel for frontend hosting
- Firebase for backend services
- GitHub Actions for CI/CD
- Environment variable management

## 📚 Additional Documentation

### Database Implementation
- **`FIREBASE_DATABASE_IMPLEMENTATION.md`** - Comprehensive database implementation guide
- **`database-architecture.md`** - Original database architecture specification
- **`src/lib/firebase/`** - Complete database implementation with TypeScript interfaces

### Key Files
- **`src/lib/firebase/index.ts`** - Main export file for all database functions
- **`src/lib/firebase/types.ts`** - Complete TypeScript interfaces
- **`src/lib/firebase/firebaseUtils.ts`** - Core CRUD operations
- **`src/lib/firebase/portfolioHelpers.ts`** - Analytics and calculations
- **`src/lib/firebase/validation.ts`** - Data validation functions
- **`src/lib/firebase/seedData.ts`** - Sample data and seeding utilities

---

This documentation provides a comprehensive overview of the Wealth Watch application structure and serves as a foundation for future development planning and implementation. The database implementation is now complete and ready for integration with the UI components.
