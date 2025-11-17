/**
 * Constants for Balance Sheet domain
 * Centralized configuration to avoid magic strings
 */

import { AccountType, AccountCategory } from './balance-sheet.model';

/**
 * localStorage keys for persistence
 */
export const ACCOUNT_STORAGE_KEY = 'balance-sheet-accounts';
export const BALANCE_STORAGE_KEY = 'balance-sheet-balances';

/**
 * Default values for new accounts
 */
export const DEFAULT_ACCOUNT_VALUES = {
  DELETED: false,
  DESCRIPTION: '',
} as const;

/**
 * Default values for new balances
 */
export const DEFAULT_BALANCE_VALUES = {
  NOTE: '',
  AMOUNT: 0,
} as const;

/**
 * Account type labels for display
 */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.Asset]: 'Asset',
  [AccountType.Liability]: 'Liability',
};

/**
 * Account category labels for display
 */
export const ACCOUNT_CATEGORY_LABELS: Record<AccountCategory, string> = {
  // Assets
  [AccountCategory.Cash]: 'Cash',
  [AccountCategory.Investment]: 'Investment',
  [AccountCategory.RealEstate]: 'Real Estate',
  [AccountCategory.Vehicle]: 'Vehicle',
  [AccountCategory.Other]: 'Other',

  // Liabilities
  [AccountCategory.Mortgage]: 'Mortgage',
  [AccountCategory.StudentLoan]: 'Student Loan',
  [AccountCategory.CreditCard]: 'Credit Card',
  [AccountCategory.PersonalLoan]: 'Personal Loan',
  [AccountCategory.Debt]: 'Debt',
};

/**
 * Asset categories only
 */
export const ASSET_CATEGORIES: AccountCategory[] = [
  AccountCategory.Cash,
  AccountCategory.Investment,
  AccountCategory.RealEstate,
  AccountCategory.Vehicle,
  AccountCategory.Other,
];

/**
 * Liability categories only
 */
export const LIABILITY_CATEGORIES: AccountCategory[] = [
  AccountCategory.Mortgage,
  AccountCategory.StudentLoan,
  AccountCategory.CreditCard,
  AccountCategory.PersonalLoan,
  AccountCategory.Debt,
];

/**
 * Get valid categories for a given account type
 */
export function getCategoriesForType(type: AccountType): AccountCategory[] {
  return type === AccountType.Asset ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;
}
