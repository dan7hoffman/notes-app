import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Balance } from '../balance-sheet.model';
import { dateReviver } from '../../../shared/utils/json-serialization.util';
import { BALANCE_STORAGE_KEY } from '../balance-sheet.constants';

@Injectable({ providedIn: 'root' })
export class BalanceRepository {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private readonly storageKey = BALANCE_STORAGE_KEY;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getAll(): Balance[] {
    if (!this.isBrowser) return [];

    try {
        const raw = localStorage.getItem(this.storageKey);
        if(!raw){
            return[];
        }
        const balances = JSON.parse(raw,dateReviver)

        if(!Array.isArray(balances)){
            return[];
        }
        return balances;
    } catch (error) {
        return [];
    }
  }

  saveAll(balances:Balance[]):boolean{
    if (!this.isBrowser) return false;
    try{
        const balancesCopy = balances.map(balance => ({...balance}));
        const serialized = JSON.stringify(balancesCopy);
        localStorage.setItem(this.storageKey, serialized);
        return true;
    } catch (error){
        return false;
    }
  }

}