import { Injectable } from '@angular/core';
import { AccountRepository } from '../data/account.repository';
import { Account, NewAccountData } from '../balance-sheet.model';
import { AccountStateService } from './accountState.service';
import { BalanceStateService } from './balanceState.service';
import { LoggingService } from '../../logging/service/logging.service';
import { LogLevel } from '../../logging/logging.model';
import { DEFAULT_ACCOUNT_VALUES } from '../balance-sheet.constants';
import { validateAccount } from '../balance-sheet.validation';

export type AccountUpdateData = Partial<Omit<Account, 'id' | 'createdAt'>>;

/**
 * Custom error for when account has balances and cannot be deleted
 */
export class AccountHasBalancesError extends Error {
  constructor(
    public accountId: number,
    public accountName: string,
    public balanceCount: number
  ) {
    super(`Account "${accountName}" has ${balanceCount} balance entries that will be deleted`);
    this.name = 'AccountHasBalancesError';
  }
}

/**
 * Account Service
 * Orchestrates CRUD operations for accounts with logging and validation
 */
@Injectable({
  providedIn: 'root',
})
export class AccountService {
  constructor(
    private repo: AccountRepository,
    private accountState: AccountStateService,
    private balanceState: BalanceStateService,
    private loggingService: LoggingService
  ) {
    // Initialize state from repository on service creation
    this.loadAccounts();
  }

  // Load accounts from repository and sync with state
  private loadAccounts(): void {
    const accounts = this.repo.getAll();
    this.accountState.setAccounts(accounts);
  }

  // Refresh accounts from repository (useful if external changes occur)
  refresh(): void {
    this.loadAccounts();
  }

  // Get accounts as readonly signal for reactive access
  get accounts() {
    return this.accountState.accounts;
  }

  /**
   * Add a new account to the repository
   * Throws error if validation fails
   */
  add(data: NewAccountData): Account {
    // Validate account data
    const validationResult = validateAccount({
      name: data.name,
      type: data.type,
      category: data.category,
      description: data.description,
    });

    if (!validationResult.isValid) {
      const error = `Validation failed: ${validationResult.errors.join(', ')}`;
      this.loggingService.logError(error, {
        context: 'AccountService.add',
        data: { errors: validationResult.errors }
      });
      throw new Error(error);
    }

    const now = new Date();
    const id = Date.now() + Math.floor(Math.random() * 1000); // Prevent collision

    // Create new account object (immutable)
    const newAccount: Account = {
      id,
      name: data.name.trim(),
      type: data.type,
      category: data.category,
      description: data.description?.trim() || DEFAULT_ACCOUNT_VALUES.DESCRIPTION,
      createdAt: now,
      lastModifiedAt: now,
      deleted: DEFAULT_ACCOUNT_VALUES.DELETED,
      deletionAt: undefined,
    };

    // Create new array with new account (immutable)
    const accounts = [...this.repo.getAll(), newAccount];
    this.repo.saveAll(accounts);
    this.accountState.setAccounts(accounts);

    // Log account creation
    this.loggingService.logInfo('Account created', {
      context: 'AccountService.add',
      data: {
        accountId: newAccount.id,
        name: newAccount.name,
        type: newAccount.type,
        category: newAccount.category
      }
    });

    return newAccount;
  }

  /**
   * Update an existing account in the repository
   * Throws error if validation fails
   */
  update(id: number, updates: AccountUpdateData): void {
    const currentAccounts = this.repo.getAll();
    const targetIndex = currentAccounts.findIndex((a) => a.id === id);

    if (targetIndex === -1) {
      const error = `Cannot update: Account ID ${id} does not exist`;
      this.loggingService.logError(error, {
        context: 'AccountService.update',
        data: { accountId: id, updates }
      });
      throw new Error(error);
    }

    const currentAccount = currentAccounts[targetIndex];

    // Merge updates with current account for validation
    const mergedAccount = {
      name: updates.name?.trim() ?? currentAccount.name,
      type: updates.type ?? currentAccount.type,
      category: updates.category ?? currentAccount.category,
      description: updates.description?.trim() ?? currentAccount.description,
    };

    // Validate updated data
    const validationResult = validateAccount(mergedAccount);
    if (!validationResult.isValid) {
      const error = `Validation failed: ${validationResult.errors.join(', ')}`;
      this.loggingService.logError(error, {
        context: 'AccountService.update',
        data: { accountId: id, errors: validationResult.errors }
      });
      throw new Error(error);
    }

    const now = new Date();

    // Create new account object with updates (immutable)
    const updatedAccount: Account = {
      ...currentAccount,
      ...updates,
      name: mergedAccount.name,
      description: mergedAccount.description,
      lastModifiedAt: now,
    };

    // Create new accounts array with updated account (immutable)
    const updatedAccounts = [
      ...currentAccounts.slice(0, targetIndex),
      updatedAccount,
      ...currentAccounts.slice(targetIndex + 1),
    ];

    this.repo.saveAll(updatedAccounts);
    this.accountState.setAccounts(updatedAccounts);

    // Log account update operation
    this.loggingService.logInfo('Account updated', {
      context: 'AccountService.update',
      data: { accountId: id, accountName: updatedAccount.name, updates }
    });
  }

  /**
   * Soft delete an account by marking it as deleted
   */
  softDelete(id: number): void {
    const currentAccounts = this.repo.getAll();
    const targetIndex = currentAccounts.findIndex((a) => a.id === id);

    if (targetIndex === -1) {
      // Log error when account not found
      this.loggingService.logError('Attempted to soft delete non-existent account', {
        context: 'AccountService.softDelete',
        data: { accountId: id }
      });
      return;
    }

    const currentAccount = currentAccounts[targetIndex];
    const now = new Date();

    // Create new account object with soft delete flags (immutable)
    const deletedAccount: Account = {
      ...currentAccount,
      deleted: true,
      deletionAt: now,
      lastModifiedAt: now,
    };

    // Create new accounts array with deleted account (immutable)
    const updatedAccounts = [
      ...currentAccounts.slice(0, targetIndex),
      deletedAccount,
      ...currentAccounts.slice(targetIndex + 1),
    ];

    this.repo.saveAll(updatedAccounts);
    this.accountState.setAccounts(updatedAccounts);

    // Log soft delete operation
    this.loggingService.logWarn('Account soft deleted', {
      context: 'AccountService.softDelete',
      data: { accountId: id, accountName: currentAccount.name }
    });
  }

  /**
   * Get count of balances for an account
   */
  getBalanceCount(accountId: number): number {
    const balances = this.balanceState.balances();
    return balances.filter(b => b.accountId === accountId).length;
  }

  /**
   * Permanently delete an account from the repository
   * Throws AccountHasBalancesError if account has balance entries
   * Throws error if account not found
   */
  delete(id: number): void {
    const currentAccounts = this.repo.getAll();
    const accountToDelete = currentAccounts.find((a) => a.id === id);

    if (!accountToDelete) {
      const error = `Cannot delete: Account ID ${id} does not exist`;
      this.loggingService.logError(error, {
        context: 'AccountService.delete',
        data: { accountId: id }
      });
      throw new Error(error);
    }

    // Check if account has balances
    const balanceCount = this.getBalanceCount(id);
    if (balanceCount > 0) {
      this.loggingService.logWarn('Cannot delete account with balances', {
        context: 'AccountService.delete',
        data: {
          accountId: id,
          accountName: accountToDelete.name,
          balanceCount
        }
      });
      throw new AccountHasBalancesError(id, accountToDelete.name, balanceCount);
    }

    // Filter creates a new array (immutable)
    const filteredAccounts = currentAccounts.filter((a) => a.id !== id);
    this.repo.saveAll(filteredAccounts);
    this.accountState.setAccounts(filteredAccounts);

    // Log permanent deletion
    this.loggingService.logWarn('Account permanently deleted', {
      context: 'AccountService.delete',
      data: { accountId: id, accountName: accountToDelete.name }
    });
  }
}
