  export enum AccountType {
    Asset = 'asset',
    Liability = 'liability',
  }

  export enum AccountCategory {
    // Assets
    Cash = 'cash',
    Investment = 'investment',
    RealEstate = 'real-estate',
    Vehicle = 'vehicle',
    Other = 'other',

    // Liabilities
    Mortgage = 'mortgage',
    StudentLoan = 'student-loan',
    CreditCard = 'credit-card',
    PersonalLoan = 'personal-loan',
    Debt = 'debt',
  }

  export interface Account {
    id: number;
    name: string;                    // e.g., "Chase Checking"
    type: AccountType;               // Asset or Liability
    category: AccountCategory;       // Cash, Mortgage, etc.
    description?: string;
    createdAt: Date;
    lastModifiedAt: Date;
    deleted: boolean;
    deletionAt?: Date;
  }

  export interface Balance {
    id: number;
    accountId: number;               // Links to Account
    amount: number;                  // Dollar amount
    date: Date;                      // Period end date (e.g., 
    note?: string;                   // Optional context
    createdAt: Date;
    lastModifiedAt: Date;
  }

    // For creating new accounts/balances
  export type NewAccountData = Omit<Account, 'id' | 'createdAt' | 'lastModifiedAt' | 'deleted' | 'deletionAt'>;
  export type NewBalanceData = Omit<Balance, 'id' | 'createdAt' | 'lastModifiedAt'>;

  // For balance sheet calculations
  export interface BalanceSheetSnapshot {
    date: Date;
    assets: AccountBalance[];
    liabilities: AccountBalance[];
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  }

  export interface AccountBalance {
    account: Account;
    balance: Balance | null;         // Null if no balance for this period
  }