import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountStateService } from '../../service/accountState.service';
import { BalanceStateService } from '../../service/balanceState.service';
import { Account, Balance, AccountType } from '../../balance-sheet.model';
import { ACCOUNT_CATEGORY_LABELS } from '../../balance-sheet.constants';
import { formatAbsoluteDate } from '../../../../shared/utils/date-formatter.util';
import { isSameDay } from '../../balance-sheet.validation';

interface AccountWithBalance {
  account: Account;
  balance: Balance | null;
  amount: number;
}

/**
 * Balance Sheet View Component
 * Displays net worth calculation for a selected date
 */
@Component({
  selector: 'app-balance-sheet-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './balance-sheet-view.component.html',
  styleUrls: ['./balance-sheet-view.component.scss'],
})
export class BalanceSheetViewComponent {
  // Expose for template
  AccountType = AccountType;
  ACCOUNT_CATEGORY_LABELS = ACCOUNT_CATEGORY_LABELS;
  formatAbsoluteDate = formatAbsoluteDate;

  // Selected date for viewing
  selectedDate = signal<Date | null>(null);
  selectedDateString = signal<string>('');

  // Available periods (dates that have balance entries)
  availablePeriods = this.balanceState.uniquePeriods;

  // Get accounts with their balances for selected date
  accountsWithBalances = computed(() => {
    const date = this.selectedDate();
    if (!date) return [];

    const accounts = this.accountState.activeAccounts();
    const balances = this.balanceState.balances();

    return accounts.map(account => {
      // Find balance for this account at this date
      const balance = balances.find(b =>
        b.accountId === account.id &&
        isSameDay(b.date, date)
      );

      return {
        account,
        balance,
        amount: balance?.amount ?? 0
      };
    });
  });

  // Computed: Asset accounts with balances
  assetAccountsWithBalances = computed(() =>
    this.accountsWithBalances().filter(ab =>
      ab.account.type === AccountType.Asset
    )
  );

  // Computed: Liability accounts with balances
  liabilityAccountsWithBalances = computed(() =>
    this.accountsWithBalances().filter(ab =>
      ab.account.type === AccountType.Liability
    )
  );

  // Computed: Total assets
  totalAssets = computed(() =>
    this.assetAccountsWithBalances().reduce((sum, ab) => sum + ab.amount, 0)
  );

  // Computed: Total liabilities
  totalLiabilities = computed(() =>
    this.liabilityAccountsWithBalances().reduce((sum, ab) => sum + ab.amount, 0)
  );

  // Computed: Net worth (assets - liabilities)
  netWorth = computed(() => this.totalAssets() - this.totalLiabilities());

  constructor(
    private accountState: AccountStateService,
    private balanceState: BalanceStateService
  ) {}

  // Handle date selection
  onDateSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const dateString = target.value;

    if (!dateString) {
      this.selectedDate.set(null);
      this.selectedDateString.set('');
      return;
    }

    const date = new Date(dateString);
    this.selectedDate.set(date);
    this.selectedDateString.set(dateString);
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}
