import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BalanceService } from '../../service/balance.service';
import { AccountStateService } from '../../service/accountState.service';
import { parseDateInputAsLocal } from '../../../../shared/utils/date-formatter.util';

/**
 * Balance Form Component
 * Handles creation of new balance entries with signal-based form state
 */
@Component({
  selector: 'app-balance-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './balance-form.component.html',
  styleUrls: ['./balance-form.component.scss'],
})
export class BalanceFormComponent {
  // Signal-based form state
  selectedAccountId = signal<number | null>(null);
  amount = signal<number>(0);
  balanceDate = signal<string>(this.getTodayString());
  note = signal('');

  // Access active accounts for dropdown
  activeAccounts = this.accountState.activeAccounts;

  // Computed: Form is valid
  isFormValid = computed(() => {
    return (
      this.selectedAccountId() !== null &&
      this.amount() !== 0 &&
      this.balanceDate().length > 0
    );
  });

  constructor(
    private balanceService: BalanceService,
    private accountState: AccountStateService
  ) {}

  // Get today's date in YYYY-MM-DD format for date input
  private getTodayString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Add new balance entry
  addBalance(): void {
    if (!this.isFormValid()) {
      return;
    }

    const accountId = this.selectedAccountId();
    if (accountId === null) {
      return;
    }

    // Convert date string to Date object (local timezone)
    const date = parseDateInputAsLocal(this.balanceDate());

    this.balanceService.add({
      accountId,
      amount: this.amount(),
      date,
      note: this.note(),
    });

    this.clearForm();
  }

  // Clear form fields
  clearForm(): void {
    this.selectedAccountId.set(null);
    this.amount.set(0);
    this.balanceDate.set(this.getTodayString());
    this.note.set('');
  }
}
