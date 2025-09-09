// Firebase Database Implementation for WealthWatch Investment Tracker
// Main export file for all Firebase utilities

// Core Firebase configuration
export { app, auth, db, storage } from './firebase';

// Type definitions
export * from './types';

// Core Firebase utilities
export * from './firebaseUtils';

// Portfolio analytics and calculation helpers
export * from './portfolioHelpers';

// Data validation functions
export * from './validation';

// Seed data utilities
export * from './seedData';

// Re-export commonly used functions for convenience
export {
  // User management
  createUser,
  getUser,
  updateUser,
  
  // Asset management
  createAsset,
  getUserAssets,
  getAsset,
  updateAsset,
  deleteAsset,
  
  // Debt management
  createDebt,
  getUserDebts,
  getDebt,
  updateDebt,
  deleteDebt,
  
  // Account management
  createAccount,
  getUserAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
  
  // Goal management
  createGoal,
  getUserGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  
  // Analytics
  createPortfolioAnalytics,
  getPortfolioAnalytics,
  
  // Historical data
  createHistoricalData,
  getHistoricalData,
  
  // Categories
  createCategory,
  getUserCategories,
  
  // Tickers
  createTicker,
  getTickers,
  searchTickers,
  
  // Authentication
  logoutUser,
  signInWithGoogle,
  
  // Storage
  uploadFile,
  
  // Generic utilities
  addDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getPaginatedDocuments
} from './firebaseUtils';

// Portfolio helpers
export {
  calculateNetWorth,
  calculateAssetAllocation,
  calculatePortfolioPerformance,
  calculateCashFlow,
  calculateRiskMetrics,
  generatePortfolioAnalytics,
  generateHistoricalData,
  calculateGoalProgress,
  formatCurrency,
  formatPercentage,
  getAssetTypeIcon,
  getDebtTypeIcon,
  getAccountTypeIcon
} from './portfolioHelpers';

// Validation functions
export {
  validateCreateAssetInput,
  validateAsset,
  validateCreateDebtInput,
  validateDebt,
  validateCreateAccountInput,
  validateAccount,
  validateCreateGoalInput,
  validateGoal,
  validateUser,
  validateBatch
} from './validation';

// Seed data functions
export {
  seedTickers,
  seedCategories,
  seedUserData,
  seedAllData,
  clearAllData,
  resetToSampleData,
  sampleTickers,
  sampleCategories,
  createSampleUser,
  createSampleAssets,
  createSampleDebts,
  createSampleAccounts,
  createSampleGoals
} from './seedData';
