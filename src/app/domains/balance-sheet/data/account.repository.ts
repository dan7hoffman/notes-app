import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Account } from '../balance-sheet.model';
import { dateReviver } from '../../../shared/utils/json-serialization.util';
import { ACCOUNT_STORAGE_KEY } from '../balance-sheet.constants';

@Injectable({ providedIn: 'root' })
export class AccountRepository {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private readonly storageKey = ACCOUNT_STORAGE_KEY;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getAll(): Account[] {
    if (!this.isBrowser) return [];

    try {
        const raw = localStorage.getItem(this.storageKey);
        if(!raw){
            return[];
        }
        const accounts = JSON.parse(raw,dateReviver)

        if(!Array.isArray(accounts)){
            return[];
        }
        return accounts;
    } catch (error) {
        return [];
    }
  }

  saveAll(accounts:Account[]):boolean{
    if (!this.isBrowser) return false;
    try{
        const accountsCopy = accounts.map(account => ({...account}));
        const serialized = JSON.stringify(accountsCopy);
        localStorage.setItem(this.storageKey, serialized);
        return true;
    } catch (error){
        return false;
    }
  }

}