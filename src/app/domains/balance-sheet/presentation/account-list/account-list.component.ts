import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../service/account.service';
import { AccountStateService } from '../../service/accountState.service';
import { ACCOUNT_CATEGORY_LABELS } from '../../balance-sheet.constants';
import { formatAbsoluteDateTime } from '../../../../shared/utils/date-formatter.util';

/**
 * Account List Component
 * Displays all accounts grouped by type (Assets vs Liabilities)
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
    private accountState: AccountStateService
  ) {}

  // Delete account permanently
  deleteAccount(id: number): void {
    if (confirm('Are you sure you want to permanently delete this account?')) {
      this.accountService.delete(id);
    }
  }

  // Soft delete account
  softDeleteAccount(id: number): void {
    if (confirm('Archive this account? (It can be restored later)')) {
      this.accountService.softDelete(id);
    }
  }
}
