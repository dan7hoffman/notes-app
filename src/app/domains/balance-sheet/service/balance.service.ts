import { Injectable } from '@angular/core';
import { BalanceRepository } from '../data/balance.repository';
import { Balance, NewBalanceData } from '../balance-sheet.model';
import { BalanceStateService } from './balanceState.service';
import { LoggingService } from '../../logging/service/logging.service';
import { LogLevel } from '../../logging/logging.model';
import { DEFAULT_BALANCE_VALUES } from '../balance-sheet.constants';

export type BalanceUpdateData = Partial<Omit<Balance, 'id' | 'createdAt' | 'accountId'>>;

/**
 * Balance Service
 * Orchestrates CRUD operations for balance entries with logging
 */
@Injectable({
  providedIn: 'root',
})
export class BalanceService {
  constructor(
    private repo: BalanceRepository,
    private balanceState: BalanceStateService,
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
   */
  add(data: NewBalanceData): Balance {
    const now = new Date();
    const id = Date.now();

    // Create new balance object (immutable)
    const newBalance: Balance = {
      id,
      accountId: data.accountId,
      amount: data.amount,
      date: data.date,
      note: data.note || DEFAULT_BALANCE_VALUES.NOTE,
      createdAt: now,
      lastModifiedAt: now,
    };

    // Create new array with new balance (immutable)
    const balances = [...this.repo.getAll(), newBalance];
    this.repo.saveAll(balances);
    this.balanceState.setBalances(balances);

    // Log balance creation
    this.loggingService.add({
      level: LogLevel.Information,
      message: 'Balance entry created',
      context: 'BalanceService.add',
      data: {
        balanceId: newBalance.id,
        accountId: newBalance.accountId,
        amount: newBalance.amount,
        date: newBalance.date
      }
    });

    return newBalance;
  }

  /**
   * Update an existing balance entry in the repository
   */
  update(id: number, updates: BalanceUpdateData): void {
    const currentBalances = this.repo.getAll();
    const targetIndex = currentBalances.findIndex((b) => b.id === id);

    if (targetIndex === -1) {
      // Log error when balance not found
      this.loggingService.add({
        level: LogLevel.Error,
        message: 'Attempted to update non-existent balance',
        context: 'BalanceService.update',
        data: { balanceId: id, updates }
      });
      return;
    }

    const currentBalance = currentBalances[targetIndex];
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

    // Log balance update operation (only the changes)
    this.loggingService.add({
      level: LogLevel.Information,
      message: 'Balance entry updated',
      context: 'BalanceService.update',
      data: { balanceId: id, updates }
    });
  }

  /**
   * Permanently delete a balance entry from the repository
   */
  delete(id: number): void {
    const currentBalances = this.repo.getAll();
    const balanceToDelete = currentBalances.find((b) => b.id === id);

    // Filter creates a new array (immutable)
    const filteredBalances = currentBalances.filter((b) => b.id !== id);
    this.repo.saveAll(filteredBalances);
    this.balanceState.setBalances(filteredBalances);

    // Log permanent deletion
    if (balanceToDelete) {
      this.loggingService.add({
        level: LogLevel.Warning,
        message: 'Balance entry permanently deleted',
        context: 'BalanceService.delete',
        data: {
          balanceId: id,
          accountId: balanceToDelete.accountId,
          amount: balanceToDelete.amount
        }
      });
    }
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
      this.loggingService.add({
        level: LogLevel.Warning,
        message: 'All balance entries deleted for account',
        context: 'BalanceService.deleteByAccount',
        data: {
          accountId,
          deletedCount: balancesToDelete.length
        }
      });
    }
  }
}
