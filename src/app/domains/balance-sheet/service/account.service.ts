import { Injectable } from '@angular/core';
import { AccountRepository } from '../data/account.repository';
import { Account, NewAccountData } from '../balance-sheet.model';
import { AccountStateService } from './accountState.service';
import { LoggingService } from '../../logging/service/logging.service';
import { LogLevel } from '../../logging/logging.model';
import { DEFAULT_ACCOUNT_VALUES } from '../balance-sheet.constants';

export type AccountUpdateData = Partial<Omit<Account, 'id' | 'createdAt'>>;

/**
 * Account Service
 * Orchestrates CRUD operations for accounts with logging
 */
@Injectable({
  providedIn: 'root',
})
export class AccountService {
  constructor(
    private repo: AccountRepository,
    private accountState: AccountStateService,
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
   */
  add(data: NewAccountData): Account {
    const now = new Date();
    const id = Date.now();

    // Create new account object (immutable)
    const newAccount: Account = {
      id,
      name: data.name,
      type: data.type,
      category: data.category,
      description: data.description || DEFAULT_ACCOUNT_VALUES.DESCRIPTION,
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
    this.loggingService.add({
      level: LogLevel.Information,
      message: 'Account created',
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
   */
  update(id: number, updates: AccountUpdateData): void {
    const currentAccounts = this.repo.getAll();
    const targetIndex = currentAccounts.findIndex((a) => a.id === id);

    if (targetIndex === -1) {
      // Log error when account not found
      this.loggingService.add({
        level: LogLevel.Error,
        message: 'Attempted to update non-existent account',
        context: 'AccountService.update',
        data: { accountId: id, updates }
      });
      return;
    }

    const currentAccount = currentAccounts[targetIndex];
    const now = new Date();

    // Create new account object with updates (immutable)
    const updatedAccount: Account = {
      ...currentAccount,
      ...updates,
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

    // Log account update operation (only the changes)
    this.loggingService.add({
      level: LogLevel.Information,
      message: 'Account updated',
      context: 'AccountService.update',
      data: { accountId: id, updates }
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
      this.loggingService.add({
        level: LogLevel.Error,
        message: 'Attempted to soft delete non-existent account',
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
    this.loggingService.add({
      level: LogLevel.Warning,
      message: 'Account soft deleted',
      context: 'AccountService.softDelete',
      data: { accountId: id, accountName: currentAccount.name }
    });
  }

  /**
   * Permanently delete an account from the repository
   */
  delete(id: number): void {
    const currentAccounts = this.repo.getAll();
    const accountToDelete = currentAccounts.find((a) => a.id === id);

    // Filter creates a new array (immutable)
    const filteredAccounts = currentAccounts.filter((a) => a.id !== id);
    this.repo.saveAll(filteredAccounts);
    this.accountState.setAccounts(filteredAccounts);

    // Log permanent deletion
    if (accountToDelete) {
      this.loggingService.add({
        level: LogLevel.Warning,
        message: 'Account permanently deleted',
        context: 'AccountService.delete',
        data: { accountId: id, accountName: accountToDelete.name }
      });
    }
  }
}
