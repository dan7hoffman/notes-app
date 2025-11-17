import { Injectable, signal, computed } from '@angular/core';
import { Balance } from '../balance-sheet.model';

/**
 * Balance State Service
 * Manages reactive state for balance entries using Angular signals
 */
@Injectable({
  providedIn: 'root',
})
export class BalanceStateService {
  // Single source of truth
  private _balances = signal<Balance[]>([]);

  // Public readonly signal - sorted by date (newest first)
  readonly balances = computed(() =>
    [...this._balances()].sort((a, b) => b.date.getTime() - a.date.getTime())
  );

  // Computed: Total balance count
  readonly balanceCount = computed(() => this._balances().length);

  // Computed: Get balances for a specific account
  getBalancesForAccount(accountId: number) {
    return computed(() =>
      this.balances().filter(balance => balance.accountId === accountId)
    );
  }

  // Computed: Get latest balance for a specific account
  getLatestBalanceForAccount(accountId: number) {
    return computed(() => {
      const accountBalances = this.balances()
        .filter(balance => balance.accountId === accountId);

      return accountBalances.length > 0 ? accountBalances[0] : null;
    });
  }

  // Computed: Get all unique dates/periods that have balances
  readonly uniquePeriods = computed(() => {
    const dates = this._balances().map(b => b.date.getTime());
    const uniqueDates = Array.from(new Set(dates));
    return uniqueDates
      .map(timestamp => new Date(timestamp))
      .sort((a, b) => b.getTime() - a.getTime()); // Newest first
  });

  // Computed: Get balances for a specific period/date
  getBalancesForPeriod(date: Date) {
    return computed(() => {
      const targetTime = date.getTime();
      return this._balances().filter(
        balance => balance.date.getTime() === targetTime
      );
    });
  }

  // Setter
  setBalances(balances: Balance[]): void {
    this._balances.set(balances);
  }

  // Get balance by ID (for lookups)
  getBalanceById(id: number): Balance | undefined {
    return this._balances().find(balance => balance.id === id);
  }
}
