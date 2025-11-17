import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../service/account.service';
import { AccountType, AccountCategory } from '../../balance-sheet.model';
import {
  getCategoriesForType,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_CATEGORY_LABELS,
} from '../../balance-sheet.constants';

/**
 * Account Form Component
 * Handles creation of new accounts with signal-based form state
 */
@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-form.component.html',
  styleUrls: ['./account-form.component.scss'],
})
export class AccountFormComponent {
  // Expose enums for template
  AccountType = AccountType;
  AccountCategory = AccountCategory;
  ACCOUNT_TYPE_LABELS = ACCOUNT_TYPE_LABELS;
  ACCOUNT_CATEGORY_LABELS = ACCOUNT_CATEGORY_LABELS;

  // Signal-based form state
  accountName = signal('');
  accountType = signal<AccountType>(AccountType.Asset);
  accountCategory = signal<AccountCategory>(AccountCategory.Cash);
  description = signal('');

  // Computed: Get valid categories based on selected type
  validCategories = computed(() => getCategoriesForType(this.accountType()));

  // Computed: Form is valid
  isFormValid = computed(() => {
    return this.accountName().trim().length > 0;
  });

  constructor(private accountService: AccountService) {}

  // Handle type change - reset category to first valid option
  onTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newType = target.value as AccountType;
    this.accountType.set(newType);

    // Reset category to first valid category for new type
    const validCats = getCategoriesForType(newType);
    if (validCats.length > 0) {
      this.accountCategory.set(validCats[0]);
    }
  }

  // Add new account
  addAccount(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.accountService.add({
      name: this.accountName(),
      type: this.accountType(),
      category: this.accountCategory(),
      description: this.description(),
    });

    this.clearForm();
  }

  // Clear form fields
  clearForm(): void {
    this.accountName.set('');
    this.accountType.set(AccountType.Asset);
    this.accountCategory.set(AccountCategory.Cash);
    this.description.set('');
  }
}
