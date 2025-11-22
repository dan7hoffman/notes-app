import { Injectable } from '@angular/core';
import { BalanceRepository } from '../data/balance.repository';
import { Balance, NewBalanceData } from '../balance-sheet.model';
import { BalanceStateService } from './balanceState.service';
import { AccountStateService } from './accountState.service';
import { LoggingService } from '../../logging/service/logging.service';
import { LogLevel } from '../../logging/logging.model';
import { DEFAULT_BALANCE_VALUES } from '../balance-sheet.constants';
import {
  validateBalance,
  isDuplicateBalance,
  ValidationResult,
} from '../balance-sheet.validation';

export type BalanceUpdateData = Partial<Omit<Balance, 'id' | 'createdAt' | 'accountId'>>;

/**
 * Balance Service
 * Orchestrates CRUD operations for balance entries with logging and validation
 */
@Injectable({
  providedIn: 'root',
})
export class BalanceService {
  constructor(
    private repo: BalanceRepository,
    private balanceState: BalanceStateService,
    private accountState: AccountStateService,
    private loggingService: LoggingService
  ) {
    // Initialize state from repository on service creation
    this.loadBalances();
  }

  // Load balances from repository and sync with state
  private loadBalances(): void {
    const balances = this.repo.getAll();
    this.balanceState.setBalances(balances);
  }

  // Refresh balances from repository (useful if external changes occur)
  refresh(): void {
    this.loadBalances();
  }

  // Get balances as readonly signal for reactive access
  get balances() {
    return this.balanceState.balances;
  }

  /**
   * Add a new balance entry to the repository
   * Throws error if validation fails
   */
  add(data: NewBalanceData): Balance {
    const correlationId = this.loggingService.startOperation('createBalance', { accountId: data.accountId });

    // 1. REFERENTIAL INTEGRITY: Check that account exists and is active
    const account = this.accountState.getAccountById(data.accountId);
    if (!account) {
      const error = `Cannot create balance: Account ID ${data.accountId} does not exist`;
      this.loggingService.endOperationWithError(correlationId, error, {
        context: 'BalanceService.add',
        data: { accountId: data.accountId }
      });
      throw new Error(error);
    }

    if (account.deleted) {
      const error = `Cannot create balance: Account "${account.name}" is deleted`;
      this.loggingService.endOperationWithError(correlationId, error, {
        context: 'BalanceService.add',
        data: { accountId: data.accountId, accountName: account.name }
      });
      throw new Error(error);
    }

    // 2. VALIDATE BALANCE DATA
    const validationResult = validateBalance(
      {
        amount: data.amount,
        date: data.date,
        note: data.note,
      },
      account.type
    );

    if (!validationResult.isValid) {
      const error = `Validation failed: ${validationResult.errors.join(', ')}`;
      this.loggingService.endOperationWithError(correlationId, error, {
        context: 'BalanceService.add',
        data: { accountId: data.accountId, errors: validationResult.errors }
      });
      throw new Error(error);
    }

    // 3. CHECK FOR DUPLICATES (same account + same date)
    const existingBalances = this.repo.getAll();
    if (isDuplicateBalance(data.accountId, data.date, existingBalances)) {
      const error = `Balance already exists for account "${account.name}" on this date`;
      this.loggingService.endOperationWithError(correlationId, error, {
        context: 'BalanceService.add',
        data: {
          accountId: data.accountId,
          accountName: account.name,
          date: data.date
        }
      });
      throw new Error(error);
    }

    // 4. CREATE BALANCE
    const now = new Date();
    const id = Date.now() + Math.floor(Math.random() * 1000); // Prevent collision

    const newBalance: Balance = {
      id,
      accountId: data.accountId,
      amount: data.amount,
      date: data.date,
      note: data.note || DEFAULT_BALANCE_VALUES.NOTE,
      createdAt: now,
      lastModifiedAt: now,
    };

    // 5. SAVE
    const balances = [...existingBalances, newBalance];
    this.repo.saveAll(balances);
    this.balanceState.setBalances(balances);

    // 6. LOG SUCCESS
    this.loggingService.endOperation(correlationId, 'Balance entry created', {
      context: 'BalanceService.add',
      data: {
        balanceId: newBalance.id,
        accountId: newBalance.accountId,
        accountName: account.name,
        amount: newBalance.amount,
        date: newBalance.date
      }
    });

    return newBalance;
  }

  /**
   * Update an existing balance entry in the repository
   * Throws error if validation fails
   */
  update(id: number, updates: BalanceUpdateData): void {
    const correlationId = this.loggingService.startOperation('updateBalance', { balanceId: id });

    const currentBalances = this.repo.getAll();
    const targetIndex = currentBalances.findIndex((b) => b.id === id);

    if (targetIndex === -1) {
      const error = `Cannot update: Balance ID ${id} does not exist`;
      this.loggingService.endOperationWithError(correlationId, error, {
        context: 'BalanceService.update',
        data: { balanceId: id, updates }
      });
      throw new Error(error);
    }

    const currentBalance = currentBalances[targetIndex];

    // Get account for validation
    const account = this.accountState.getAccountById(currentBalance.accountId);
    if (!account) {
      const error = `Cannot update balance: Associated account no longer exists`;
      this.loggingService.endOperationWithError(correlationId, error, {
        context: 'BalanceService.update',
        data: { balanceId: id, accountId: currentBalance.accountId }
      });
      throw new Error(error);
    }

    // Merge updates with current balance for validation
    const mergedBalance = {
      amount: updates.amount ?? currentBalance.amount,
      date: updates.date ?? currentBalance.date,
      note: updates.note ?? currentBalance.note,
    };

    // Validate updated data
    const validationResult = validateBalance(mergedBalance, account.type);
    if (!validationResult.isValid) {
      const error = `Validation failed: ${validationResult.errors.join(', ')}`;
      this.loggingService.endOperationWithError(correlationId, error, {
        context: 'BalanceService.update',
        data: { balanceId: id, errors: validationResult.errors }
      });
      throw new Error(error);
    }

    // Check for duplicates if date is being updated (exclude current balance from check)
    if (updates.date && isDuplicateBalance(currentBalance.accountId, updates.date, currentBalances, id)) {
      const error = `Balance already exists for account "${account.name}" on this date`;
      this.loggingService.endOperationWithError(correlationId, error, {
        context: 'BalanceService.update',
        data: {
          balanceId: id,
          accountId: currentBalance.accountId,
          accountName: account.name,
          date: updates.date
        }
      });
      throw new Error(error);
    }

    const now = new Date();

    // Create new balance object with updates (immutable)
    const updatedBalance: Balance = {
      ...currentBalance,
      ...updates,
      lastModifiedAt: now,
    };

    // Create new balances array with updated balance (immutable)
    const updatedBalances = [
      ...currentBalances.slice(0, targetIndex),
      updatedBalance,
      ...currentBalances.slice(targetIndex + 1),
    ];

    this.repo.saveAll(updatedBalances);
    this.balanceState.setBalances(updatedBalances);

    // Log balance update operation
    this.loggingService.endOperation(correlationId, 'Balance entry updated', {
      context: 'BalanceService.update',
      data: {
        balanceId: id,
        accountName: account.name,
        updates
      }
    });
  }

  /**
   * Permanently delete a balance entry from the repository
   * Throws error if balance not found
   */
  delete(id: number): void {
    const correlationId = this.loggingService.startOperation('deleteBalance', { balanceId: id });

    const currentBalances = this.repo.getAll();
    const balanceToDelete = currentBalances.find((b) => b.id === id);

    if (!balanceToDelete) {
      const error = `Cannot delete: Balance ID ${id} does not exist`;
      this.loggingService.endOperationWithError(correlationId, error, {
        context: 'BalanceService.delete',
        data: { balanceId: id }
      });
      throw new Error(error);
    }

    // Get account name for logging
    const account = this.accountState.getAccountById(balanceToDelete.accountId);
    const accountName = account?.name ?? 'Unknown';

    // Filter creates a new array (immutable)
    const filteredBalances = currentBalances.filter((b) => b.id !== id);
    this.repo.saveAll(filteredBalances);
    this.balanceState.setBalances(filteredBalances);

    // Log permanent deletion
    this.loggingService.endOperation(correlationId, 'Balance entry permanently deleted', {
      context: 'BalanceService.delete',
      data: {
        balanceId: id,
        accountId: balanceToDelete.accountId,
        accountName,
        amount: balanceToDelete.amount
      }
    });
  }

  /**
   * Delete all balances for a specific account
   * Useful when an account is deleted
   */
  deleteByAccount(accountId: number): void {
    const currentBalances = this.repo.getAll();
    const balancesToDelete = currentBalances.filter(b => b.accountId === accountId);

    // Filter creates a new array (immutable)
    const filteredBalances = currentBalances.filter((b) => b.accountId !== accountId);
    this.repo.saveAll(filteredBalances);
    this.balanceState.setBalances(filteredBalances);

    // Log bulk deletion
    if (balancesToDelete.length > 0) {
      this.loggingService.logWarn('All balance entries deleted for account', {
        context: 'BalanceService.deleteByAccount',
        data: {
          accountId,
          deletedCount: balancesToDelete.length
        }
      });
    }
  }
}
