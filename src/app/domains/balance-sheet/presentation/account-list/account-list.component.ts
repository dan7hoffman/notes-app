import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService, AccountHasBalancesError } from '../../service/account.service';
import { AccountStateService } from '../../service/accountState.service';
import { BalanceService } from '../../service/balance.service';
import { ACCOUNT_CATEGORY_LABELS } from '../../balance-sheet.constants';
import { formatAbsoluteDateTime } from '../../../../shared/utils/date-formatter.util';

/**
 * Account List Component
 * Displays all accounts grouped by type (Assets vs Liabilities)
 * Handles cascade delete confirmation when accounts have balances
 */
@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss'],
})
export class AccountListComponent {
  // Expose labels for template
  ACCOUNT_CATEGORY_LABELS = ACCOUNT_CATEGORY_LABELS;

  // Expose formatter for template
  formatAbsoluteDateTime = formatAbsoluteDateTime;

  // Access signals from state service
  assetAccounts = this.accountState.assetAccounts;
  liabilityAccounts = this.accountState.liabilityAccounts;

  constructor(
    private accountService: AccountService,
    private accountState: AccountStateService,
    private balanceService: BalanceService
  ) {}

  // Delete account permanently with cascade delete handling
  deleteAccount(id: number): void {
    try {
      // First attempt to delete - will throw if account has balances
      this.accountService.delete(id);
      alert('Account deleted successfully');
    } catch (error) {
      if (error instanceof AccountHasBalancesError) {
        // Account has balances - ask for confirmation to cascade delete
        const message = `This account has ${error.balanceCount} balance ${error.balanceCount === 1 ? 'entry' : 'entries'}.\n\n` +
                       `Deleting this account will also permanently delete all ${error.balanceCount} balance ${error.balanceCount === 1 ? 'entry' : 'entries'}.\n\n` +
                       `Are you sure you want to continue?`;

        if (confirm(message)) {
          // User confirmed - delete balances first, then account
          this.balanceService.deleteByAccount(id);
          this.accountService.delete(id);
          alert('Account and all associated balances deleted successfully');
        }
      } else if (error instanceof Error) {
        // Other errors
        alert(`Error deleting account: ${error.message}`);
      } else {
        alert('An unknown error occurred while deleting the account');
      }
    }
  }

  // Soft delete account
  softDeleteAccount(id: number): void {
    try {
      if (confirm('Archive this account? (It can be restored later)')) {
        this.accountService.softDelete(id);
        alert('Account archived successfully');
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(`Error archiving account: ${error.message}`);
      } else {
        alert('An unknown error occurred while archiving the account');
      }
    }
  }
}
