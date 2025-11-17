import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BalanceService } from '../../service/balance.service';
import { BalanceStateService } from '../../service/balanceState.service';
import { AccountStateService } from '../../service/accountState.service';
import { Balance } from '../../balance-sheet.model';
import { formatAbsoluteDateTime, parseDateInputAsLocal } from '../../../../shared/utils/date-formatter.util';

/**
 * Balance History Component
 * Displays all balance entries with edit/delete capabilities
 */
@Component({
  selector: 'app-balance-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './balance-history.component.html',
  styleUrls: ['./balance-history.component.scss'],
})
export class BalanceHistoryComponent {
  // Expose formatter for template
  formatAbsoluteDateTime = formatAbsoluteDateTime;

  // Access signals
  balances = this.balanceState.balances; // Already sorted newest first

  // Editing state
  editingBalanceId = signal<number | null>(null);
  editAmount = signal<number>(0);
  editDate = signal<string>('');
  editNote = signal<string>('');

  // Filter state
  selectedAccountFilter = signal<number | null>(null);

  // Active accounts for filter dropdown
  activeAccounts = this.accountState.activeAccounts;

  // Computed: Filtered balances
  filteredBalances = computed(() => {
    const accountFilter = this.selectedAccountFilter();
    if (accountFilter === null) return this.balances();

    return this.balances().filter(b => b.accountId === accountFilter);
  });

  constructor(
    private balanceService: BalanceService,
    private balanceState: BalanceStateService,
    private accountState: AccountStateService
  ) {}

  // Get account name by ID
  getAccountName(accountId: number): string {
    const account = this.accountState.getAccountById(accountId);
    return account?.name ?? 'Unknown Account';
  }

  // Start editing a balance
  startEdit(balance: Balance): void {
    this.editingBalanceId.set(balance.id);
    this.editAmount.set(balance.amount);
    this.editDate.set(this.formatDateForInput(balance.date));
    this.editNote.set(balance.note ?? '');
  }

  // Save edited balance
  saveEdit(): void {
    const id = this.editingBalanceId();
    if (id === null) return;

    this.balanceService.update(id, {
      amount: this.editAmount(),
      date: parseDateInputAsLocal(this.editDate()),
      note: this.editNote(),
    });

    this.cancelEdit();
  }

  // Cancel editing
  cancelEdit(): void {
    this.editingBalanceId.set(null);
    this.editAmount.set(0);
    this.editDate.set('');
    this.editNote.set('');
  }

  // Delete balance
  deleteBalance(id: number): void {
    if (confirm('Are you sure you want to delete this balance entry?')) {
      this.balanceService.delete(id);
    }
  }

  // Check if currently editing this balance
  isEditing(balanceId: number): boolean {
    return this.editingBalanceId() === balanceId;
  }

  // Format Date object to YYYY-MM-DD for date input
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}
