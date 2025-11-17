import { Component } from '@angular/core';
import { AccountFormComponent } from '../account-form/account-form.component';
import { AccountListComponent } from '../account-list/account-list.component';
import { BalanceFormComponent } from '../balance-form/balance-form.component';
import { AccountStateService } from '../../service/accountState.service';
import { AccountService } from '../../service/account.service';
import { BalanceService } from '../../service/balance.service';

/**
 * Balance Sheet Container Component
 * Orchestrates account and balance management
 */
@Component({
  selector: 'app-balance-sheet',
  standalone: true,
  imports: [AccountFormComponent, AccountListComponent, BalanceFormComponent],
  templateUrl: './balance-sheet.component.html',
  styleUrls: ['./balance-sheet.component.scss'],
})
export class BalanceSheetComponent {
  // Reference computed signals from state service
  accountCount = this.accountState.accountCount;
  assetCount = this.accountState.assetCount;
  liabilityCount = this.accountState.liabilityCount;

  constructor(
    private accountState: AccountStateService,
    private accountService: AccountService,
    private balanceService: BalanceService
  ) {
    // Services auto-load data on initialization
  }
}
