// Data Validation Functions for WealthWatch Investment Tracker
// Ensures data integrity and proper formatting

import {
  CreateAssetInput,
  CreateDebtInput,
  CreateAccountInput,
  CreateGoalInput,
  Asset,
  Debt,
  Account,
  Goal,
  User,
} from './types';

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationOptions {
  strict?: boolean; // If true, warnings become errors
  allowEmpty?: boolean; // If true, allow empty required fields
}

// ============================================================================
// COMMON VALIDATION FUNCTIONS
// ============================================================================

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateString = (value: any, fieldName: string, minLength: number = 1, maxLength: number = 255): string | null => {
  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long`;
  }
  if (value.length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters long`;
  }
  return null;
};

export const validateNumber = (value: any, fieldName: string, min?: number, max?: number): string | null => {
  if (typeof value !== 'number' || isNaN(value)) {
    return `${fieldName} must be a valid number`;
  }
  if (min !== undefined && value < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (max !== undefined && value > max) {
    return `${fieldName} must be no more than ${max}`;
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  return null;
};

export const validateCurrency = (currency: string): string | null => {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
  if (!validCurrencies.includes(currency.toUpperCase())) {
    return `Currency must be one of: ${validCurrencies.join(', ')}`;
  }
  return null;
};

export const validateDate = (date: any, fieldName: string): string | null => {
  if (!(date instanceof Date) && typeof date !== 'string') {
    return `${fieldName} must be a valid date`;
  }
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    return `${fieldName} must be a valid date`;
  }
  
  return null;
};

export const validateEnum = (value: any, fieldName: string, validValues: string[]): string | null => {
  if (!validValues.includes(value)) {
    return `${fieldName} must be one of: ${validValues.join(', ')}`;
  }
  return null;
};

// ============================================================================
// ASSET VALIDATION FUNCTIONS
// ============================================================================

export const validateCreateAssetInput = (data: CreateAssetInput, options: ValidationOptions = {}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  const nameError = validateRequired(data.name, 'Name');
  if (nameError) errors.push(nameError);

  const typeError = validateEnum(data.type, 'Type', [
    'stock_ticker', 'cash', 'crypto_ticker', 'crypto_exchange_wallet', 
    'home', 'car', 'precious_metals', 'generic_asset'
  ]);
  if (typeError) errors.push(typeError);

  const currencyError = validateCurrency(data.currency);
  if (currencyError) errors.push(currencyError);

  const quantityError = validateNumber(data.quantity, 'Quantity', 0);
  if (quantityError) errors.push(quantityError);

  const currentValueError = validateNumber(data.currentValue, 'Current Value', 0);
  if (currentValueError) errors.push(currentValueError);

  const costBasisError = validateNumber(data.costBasis, 'Cost Basis', 0);
  if (costBasisError) errors.push(costBasisError);

  // Optional but recommended fields
  if (data.symbol) {
    const symbolError = validateString(data.symbol, 'Symbol', 1, 10);
    if (symbolError) warnings.push(symbolError);
  }

  if (data.currentPrice) {
    const priceError = validateNumber(data.currentPrice, 'Current Price', 0);
    if (priceError) warnings.push(priceError);
  }

  // Business logic validations
  if (data.type === 'stock_ticker' || data.type === 'crypto_ticker') {
    if (!data.symbol) {
      warnings.push('Symbol is recommended for ticker-based assets');
    }
    if (!data.currentPrice) {
      warnings.push('Current price is recommended for ticker-based assets');
    }
  }

  if (data.currentValue < 0) {
    errors.push('Current value cannot be negative');
  }

  if (data.costBasis < 0) {
    errors.push('Cost basis cannot be negative');
  }

  // Convert warnings to errors if strict mode
  if (options.strict) {
    errors.push(...warnings);
    warnings.length = 0;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateAsset = (asset: Asset, options: ValidationOptions = {}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic fields
  const nameError = validateRequired(asset.name, 'Name');
  if (nameError) errors.push(nameError);

  const typeError = validateEnum(asset.type, 'Type', [
    'stock_ticker', 'cash', 'crypto_ticker', 'crypto_exchange_wallet', 
    'home', 'car', 'precious_metals', 'generic_asset'
  ]);
  if (typeError) errors.push(typeError);

  const currencyError = validateCurrency(asset.currency);
  if (currencyError) errors.push(currencyError);

  const quantityError = validateNumber(asset.quantity, 'Quantity', 0);
  if (quantityError) errors.push(quantityError);

  const currentValueError = validateNumber(asset.currentValue, 'Current Value', 0);
  if (currentValueError) errors.push(currentValueError);

  const costBasisError = validateNumber(asset.costBasis, 'Cost Basis', 0);
  if (costBasisError) errors.push(costBasisError);

  // Validate performance data
  if (asset.performance) {
    const totalReturnError = validateNumber(asset.performance.totalReturnPercent, 'Total Return Percent');
    if (totalReturnError) warnings.push(totalReturnError);
  }

  // Validate transactions
  if (asset.transactions) {
    asset.transactions.forEach((transaction, index) => {
      const txTypeError = validateEnum(transaction.type, `Transaction ${index + 1} Type`, [
        'buy', 'sell', 'dividend', 'split', 'adjustment', 'transfer'
      ]);
      if (txTypeError) warnings.push(txTypeError);

      const txAmountError = validateNumber(transaction.totalAmount, `Transaction ${index + 1} Amount`, 0);
      if (txAmountError) warnings.push(txAmountError);
    });
  }

  // Convert warnings to errors if strict mode
  if (options.strict) {
    errors.push(...warnings);
    warnings.length = 0;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// ============================================================================
// DEBT VALIDATION FUNCTIONS
// ============================================================================

export const validateCreateDebtInput = (data: CreateDebtInput, options: ValidationOptions = {}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  const nameError = validateRequired(data.name, 'Name');
  if (nameError) errors.push(nameError);

  const typeError = validateEnum(data.type, 'Type', [
    'credit_card', 'mortgage', 'auto_loan', 'student_loan', 'personal_loan', 'line_of_credit'
  ]);
  if (typeError) errors.push(typeError);

  const principalError = validateNumber(data.principal, 'Principal', 0);
  if (principalError) errors.push(principalError);

  const currentBalanceError = validateNumber(data.currentBalance, 'Current Balance', 0);
  if (currentBalanceError) errors.push(currentBalanceError);

  const interestRateError = validateNumber(data.interestRate, 'Interest Rate', 0, 100);
  if (interestRateError) errors.push(interestRateError);

  const minimumPaymentError = validateNumber(data.minimumPayment, 'Minimum Payment', 0);
  if (minimumPaymentError) errors.push(minimumPaymentError);

  const institutionError = validateRequired(data.institution, 'Institution');
  if (institutionError) errors.push(institutionError);

  const currencyError = validateCurrency(data.currency);
  if (currencyError) errors.push(currencyError);

  const dueDateError = validateDate(data.dueDate, 'Due Date');
  if (dueDateError) errors.push(dueDateError);

  // Business logic validations
  if (data.currentBalance > data.principal) {
    warnings.push('Current balance is higher than principal amount');
  }

  if (data.interestRate > 50) {
    warnings.push('Interest rate seems unusually high');
  }

  // Convert warnings to errors if strict mode
  if (options.strict) {
    errors.push(...warnings);
    warnings.length = 0;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateDebt = (debt: Debt, options: ValidationOptions = {}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic fields
  const nameError = validateRequired(debt.name, 'Name');
  if (nameError) errors.push(nameError);

  const typeError = validateEnum(debt.type, 'Type', [
    'credit_card', 'mortgage', 'auto_loan', 'student_loan', 'personal_loan', 'line_of_credit'
  ]);
  if (typeError) errors.push(typeError);

  const principalError = validateNumber(debt.principal, 'Principal', 0);
  if (principalError) errors.push(principalError);

  const currentBalanceError = validateNumber(debt.currentBalance, 'Current Balance', 0);
  if (currentBalanceError) errors.push(currentBalanceError);

  const interestRateError = validateNumber(debt.interestRate, 'Interest Rate', 0, 100);
  if (interestRateError) errors.push(interestRateError);

  const minimumPaymentError = validateNumber(debt.minimumPayment, 'Minimum Payment', 0);
  if (minimumPaymentError) errors.push(minimumPaymentError);

  const institutionError = validateRequired(debt.institution, 'Institution');
  if (institutionError) errors.push(institutionError);

  const currencyError = validateCurrency(debt.currency);
  if (currencyError) errors.push(currencyError);

  const statusError = validateEnum(debt.status, 'Status', [
    'active', 'paid_off', 'defaulted', 'frozen'
  ]);
  if (statusError) errors.push(statusError);

  // Validate payment history
  if (debt.paymentHistory) {
    debt.paymentHistory.forEach((payment, index) => {
      const paymentTypeError = validateEnum(payment.type, `Payment ${index + 1} Type`, [
        'payment', 'interest', 'fee', 'penalty'
      ]);
      if (paymentTypeError) warnings.push(paymentTypeError);

      const paymentAmountError = validateNumber(payment.amount, `Payment ${index + 1} Amount`, 0);
      if (paymentAmountError) warnings.push(paymentAmountError);
    });
  }

  // Convert warnings to errors if strict mode
  if (options.strict) {
    errors.push(...warnings);
    warnings.length = 0;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// ============================================================================
// ACCOUNT VALIDATION FUNCTIONS
// ============================================================================

export const validateCreateAccountInput = (data: CreateAccountInput, options: ValidationOptions = {}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  const nameError = validateRequired(data.name, 'Name');
  if (nameError) errors.push(nameError);

  const typeError = validateEnum(data.type, 'Type', [
    'checking', 'savings', 'brokerage', 'retirement', 'credit_card', 'investment', 'loan'
  ]);
  if (typeError) errors.push(typeError);

  const institutionError = validateRequired(data.institution, 'Institution');
  if (institutionError) errors.push(institutionError);

  const currencyError = validateCurrency(data.currency);
  if (currencyError) errors.push(currencyError);

  // Validate balances
  if (data.balances) {
    const currentBalanceError = validateNumber(data.balances.current, 'Current Balance');
    if (currentBalanceError) errors.push(currentBalanceError);

    if (data.balances.available !== undefined) {
      const availableBalanceError = validateNumber(data.balances.available, 'Available Balance');
      if (availableBalanceError) warnings.push(availableBalanceError);
    }

    if (data.balances.pending !== undefined) {
      const pendingBalanceError = validateNumber(data.balances.pending, 'Pending Balance');
      if (pendingBalanceError) warnings.push(pendingBalanceError);
    }
  }

  const connectionStatusError = validateEnum(data.connectionStatus, 'Connection Status', [
    'connected', 'disconnected', 'error', 'manual'
  ]);
  if (connectionStatusError) errors.push(connectionStatusError);

  // Convert warnings to errors if strict mode
  if (options.strict) {
    errors.push(...warnings);
    warnings.length = 0;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateAccount = (account: Account, options: ValidationOptions = {}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic fields
  const nameError = validateRequired(account.name, 'Name');
  if (nameError) errors.push(nameError);

  const typeError = validateEnum(account.type, 'Type', [
    'checking', 'savings', 'brokerage', 'retirement', 'credit_card', 'investment', 'loan'
  ]);
  if (typeError) errors.push(typeError);

  const institutionError = validateRequired(account.institution, 'Institution');
  if (institutionError) errors.push(institutionError);

  const currencyError = validateCurrency(account.currency);
  if (currencyError) errors.push(currencyError);

  const connectionStatusError = validateEnum(account.connectionStatus, 'Connection Status', [
    'connected', 'disconnected', 'error', 'manual'
  ]);
  if (connectionStatusError) errors.push(connectionStatusError);

  // Validate balances
  if (account.balances) {
    const currentBalanceError = validateNumber(account.balances.current, 'Current Balance');
    if (currentBalanceError) errors.push(currentBalanceError);
  }

  // Validate transactions
  if (account.transactions) {
    account.transactions.forEach((transaction, index) => {
      const txTypeError = validateEnum(transaction.type, `Transaction ${index + 1} Type`, [
        'debit', 'credit', 'transfer'
      ]);
      if (txTypeError) warnings.push(txTypeError);

      const txAmountError = validateNumber(transaction.amount, `Transaction ${index + 1} Amount`);
      if (txAmountError) warnings.push(txAmountError);
    });
  }

  // Convert warnings to errors if strict mode
  if (options.strict) {
    errors.push(...warnings);
    warnings.length = 0;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// ============================================================================
// GOAL VALIDATION FUNCTIONS
// ============================================================================

export const validateCreateGoalInput = (data: CreateGoalInput, options: ValidationOptions = {}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  const nameError = validateRequired(data.name, 'Name');
  if (nameError) errors.push(nameError);

  const typeError = validateEnum(data.type, 'Type', [
    'retirement', 'home', 'education', 'travel', 'emergency', 'other'
  ]);
  if (typeError) errors.push(typeError);

  const targetAmountError = validateNumber(data.targetAmount, 'Target Amount', 0);
  if (targetAmountError) errors.push(targetAmountError);

  const targetDateError = validateDate(data.targetDate, 'Target Date');
  if (targetDateError) errors.push(targetDateError);

  const priorityError = validateEnum(data.priority, 'Priority', [
    'high', 'medium', 'low'
  ]);
  if (priorityError) errors.push(priorityError);

  const monthlyContributionError = validateNumber(data.monthlyContribution, 'Monthly Contribution', 0);
  if (monthlyContributionError) errors.push(monthlyContributionError);

  // Business logic validations
  if (data.targetDate < new Date()) {
    warnings.push('Target date is in the past');
  }

  if (data.targetAmount > 10000000) {
    warnings.push('Target amount seems unusually high');
  }

  // Convert warnings to errors if strict mode
  if (options.strict) {
    errors.push(...warnings);
    warnings.length = 0;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateGoal = (goal: Goal, options: ValidationOptions = {}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic fields
  const nameError = validateRequired(goal.name, 'Name');
  if (nameError) errors.push(nameError);

  const typeError = validateEnum(goal.type, 'Type', [
    'retirement', 'home', 'education', 'travel', 'emergency', 'other'
  ]);
  if (typeError) errors.push(typeError);

  const targetAmountError = validateNumber(goal.targetAmount, 'Target Amount', 0);
  if (targetAmountError) errors.push(targetAmountError);

  const currentAmountError = validateNumber(goal.currentAmount, 'Current Amount', 0);
  if (currentAmountError) errors.push(currentAmountError);

  const targetDateError = validateDate(goal.targetDate, 'Target Date');
  if (targetDateError) errors.push(targetDateError);

  const priorityError = validateEnum(goal.priority, 'Priority', [
    'high', 'medium', 'low'
  ]);
  if (priorityError) errors.push(priorityError);

  const monthlyContributionError = validateNumber(goal.monthlyContribution, 'Monthly Contribution', 0);
  if (monthlyContributionError) errors.push(monthlyContributionError);

  const statusError = validateEnum(goal.status, 'Status', [
    'on_track', 'behind', 'ahead', 'completed'
  ]);
  if (statusError) errors.push(statusError);

  const progressError = validateNumber(goal.progress, 'Progress', 0, 100);
  if (progressError) errors.push(progressError);

  // Convert warnings to errors if strict mode
  if (options.strict) {
    errors.push(...warnings);
    warnings.length = 0;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// ============================================================================
// USER VALIDATION FUNCTIONS
// ============================================================================

export const validateUser = (user: User, options: ValidationOptions = {}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate profile
  if (user.profile) {
    const displayNameError = validateRequired(user.profile.displayName, 'Display Name');
    if (displayNameError) errors.push(displayNameError);

    const emailError = validateEmail(user.profile.email);
    if (emailError) errors.push(emailError);
  }

  // Validate preferences
  if (user.preferences) {
    const currencyError = validateCurrency(user.preferences.defaultCurrency);
    if (currencyError) errors.push(currencyError);

    const riskToleranceError = validateEnum(user.preferences.riskTolerance, 'Risk Tolerance', [
      'conservative', 'moderate', 'aggressive'
    ]);
    if (riskToleranceError) errors.push(riskToleranceError);
  }

  // Validate settings
  if (user.settings) {
    const themeError = validateEnum(user.settings.theme, 'Theme', [
      'light', 'dark'
    ]);
    if (themeError) errors.push(themeError);

    const dataRetentionError = validateNumber(user.settings.dataRetention, 'Data Retention', 1, 120);
    if (dataRetentionError) warnings.push(dataRetentionError);
  }

  // Convert warnings to errors if strict mode
  if (options.strict) {
    errors.push(...warnings);
    warnings.length = 0;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// ============================================================================
// BATCH VALIDATION FUNCTIONS
// ============================================================================

export const validateBatch = <T>(
  items: T[],
  validator: (item: T, options?: ValidationOptions) => ValidationResult,
  options: ValidationOptions = {}
): ValidationResult => {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  items.forEach((item, index) => {
    const result = validator(item, options);
    if (!result.isValid) {
      allErrors.push(`Item ${index + 1}: ${result.errors.join(', ')}`);
    }
    allWarnings.push(...result.warnings.map(w => `Item ${index + 1}: ${w}`));
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
};
