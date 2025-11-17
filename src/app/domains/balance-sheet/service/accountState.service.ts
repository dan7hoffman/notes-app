import { Injectable, signal, computed } from '@angular/core';
import { Account, AccountType } from '../balance-sheet.model';

/**
 * Account State Service
 * Manages reactive state for accounts using Angular signals
 */
@Injectable({
  providedIn: 'root',
})
export class AccountStateService {
  // Single source of truth
  private _accounts = signal<Account[]>([]);

  // Public readonly signal
  readonly accounts = this._accounts.asReadonly();

  // Computed: Active accounts only (not deleted)
  readonly activeAccounts = computed(() =>
    this._accounts().filter(account => !account.deleted)
  );

  // Computed: Asset accounts only
  readonly assetAccounts = computed(() =>
    this.activeAccounts().filter(account => account.type === AccountType.Asset)
  );

  // Computed: Liability accounts only
  readonly liabilityAccounts = computed(() =>
    this.activeAccounts().filter(account => account.type === AccountType.Liability)
  );

  // Computed: Total account counts
  readonly accountCount = computed(() => this.activeAccounts().length);
  readonly assetCount = computed(() => this.assetAccounts().length);
  readonly liabilityCount = computed(() => this.liabilityAccounts().length);

  // Setter
  setAccounts(accounts: Account[]): void {
    this._accounts.set(accounts);
  }

  // Get account by ID (for lookups)
  getAccountById(id: number): Account | undefined {
    return this._accounts().find(account => account.id === id);
  }
}
