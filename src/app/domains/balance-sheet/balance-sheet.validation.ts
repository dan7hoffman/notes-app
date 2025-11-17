/**
 * Validation utilities for Balance Sheet domain
 * Centralizes business rules and validation logic
 */

import { AccountType, AccountCategory, Account, Balance } from './balance-sheet.model';
import { ASSET_CATEGORIES, LIABILITY_CATEGORIES } from './balance-sheet.constants';

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validation constants for middle-class household
 */
export const VALIDATION_RULES = {
  ACCOUNT_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  ACCOUNT_DESCRIPTION: {
    MAX_LENGTH: 500,
  },
  BALANCE_AMOUNT: {
    ASSET: {
      MIN: -100000,      // Can have margin debt, etc.
      MAX: 10000000,     // $10M max for assets
    },
    LIABILITY: {
      MIN: 0,            // Liabilities should be positive (debt owed)
      MAX: 2000000,      // $2M max (large mortgage)
    },
  },
  BALANCE_DATE: {
    MIN_YEAR: 1900,
    MAX_YEARS_FUTURE: 100,  // Allow far future projections
  },
  BALANCE_NOTE: {
    MAX_LENGTH: 500,
  },
} as const;

/**
 * Validate account name
 */
export function validateAccountName(name: string): ValidationResult {
  const errors: string[] = [];
  const trimmed = name.trim();

  if (trimmed.length < VALIDATION_RULES.ACCOUNT_NAME.MIN_LENGTH) {
    errors.push('Account name is required');
  }

  if (trimmed.length > VALIDATION_RULES.ACCOUNT_NAME.MAX_LENGTH) {
    errors.push(`Account name must be ${VALIDATION_RULES.ACCOUNT_NAME.MAX_LENGTH} characters or less`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate account description
 */
export function validateAccountDescription(description: string | undefined): ValidationResult {
  const errors: string[] = [];

  if (description && description.length > VALIDATION_RULES.ACCOUNT_DESCRIPTION.MAX_LENGTH) {
    errors.push(`Description must be ${VALIDATION_RULES.ACCOUNT_DESCRIPTION.MAX_LENGTH} characters or less`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that account category matches account type
 */
export function validateCategoryTypeMatch(type: AccountType, category: AccountCategory): ValidationResult {
  const errors: string[] = [];

  if (type === AccountType.Asset && !ASSET_CATEGORIES.includes(category)) {
    errors.push(`Category '${category}' is not valid for Asset accounts`);
  }

  if (type === AccountType.Liability && !LIABILITY_CATEGORIES.includes(category)) {
    errors.push(`Category '${category}' is not valid for Liability accounts`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete account data
 */
export function validateAccount(account: {
  name: string;
  type: AccountType;
  category: AccountCategory;
  description?: string;
}): ValidationResult {
  const allErrors: string[] = [];

  // Validate name
  const nameResult = validateAccountName(account.name);
  allErrors.push(...nameResult.errors);

  // Validate description
  const descResult = validateAccountDescription(account.description);
  allErrors.push(...descResult.errors);

  // Validate category-type match
  const categoryResult = validateCategoryTypeMatch(account.type, account.category);
  allErrors.push(...categoryResult.errors);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Validate balance amount based on account type
 */
export function validateBalanceAmount(amount: number, accountType: AccountType): ValidationResult {
  const errors: string[] = [];

  // Check for invalid numbers
  if (!Number.isFinite(amount)) {
    errors.push('Amount must be a valid number');
    return { isValid: false, errors };
  }

  // Check range based on account type
  const rules = accountType === AccountType.Asset
    ? VALIDATION_RULES.BALANCE_AMOUNT.ASSET
    : VALIDATION_RULES.BALANCE_AMOUNT.LIABILITY;

  if (amount < rules.MIN) {
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rules.MIN);
    errors.push(`${accountType} amount cannot be less than ${formatted}`);
  }

  if (amount > rules.MAX) {
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rules.MAX);
    errors.push(`${accountType} amount cannot exceed ${formatted}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate balance date
 */
export function validateBalanceDate(date: Date): ValidationResult {
  const errors: string[] = [];

  // Check for invalid date
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    errors.push('Invalid date');
    return { isValid: false, errors };
  }

  // Check minimum year
  const minDate = new Date(VALIDATION_RULES.BALANCE_DATE.MIN_YEAR, 0, 1);
  if (date < minDate) {
    errors.push(`Date cannot be before ${VALIDATION_RULES.BALANCE_DATE.MIN_YEAR}`);
  }

  // Check maximum (100 years in future)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + VALIDATION_RULES.BALANCE_DATE.MAX_YEARS_FUTURE);
  if (date > maxDate) {
    errors.push(`Date cannot be more than ${VALIDATION_RULES.BALANCE_DATE.MAX_YEARS_FUTURE} years in the future`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate balance note
 */
export function validateBalanceNote(note: string | undefined): ValidationResult {
  const errors: string[] = [];

  if (note && note.length > VALIDATION_RULES.BALANCE_NOTE.MAX_LENGTH) {
    errors.push(`Note must be ${VALIDATION_RULES.BALANCE_NOTE.MAX_LENGTH} characters or less`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete balance data
 * Note: accountType is needed to validate amount ranges
 */
export function validateBalance(balance: {
  amount: number;
  date: Date;
  note?: string;
}, accountType: AccountType): ValidationResult {
  const allErrors: string[] = [];

  // Validate amount
  const amountResult = validateBalanceAmount(balance.amount, accountType);
  allErrors.push(...amountResult.errors);

  // Validate date
  const dateResult = validateBalanceDate(balance.date);
  allErrors.push(...dateResult.errors);

  // Validate note
  const noteResult = validateBalanceNote(balance.note);
  allErrors.push(...noteResult.errors);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Check if two dates are the same day (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a balance already exists for the same account and date
 */
export function isDuplicateBalance(
  accountId: number,
  date: Date,
  existingBalances: Balance[],
  excludeBalanceId?: number
): boolean {
  return existingBalances.some(b =>
    b.accountId === accountId &&
    isSameDay(b.date, date) &&
    (excludeBalanceId === undefined || b.id !== excludeBalanceId)
  );
}
