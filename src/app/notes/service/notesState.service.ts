import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class NotesStateService {
  private _noteCountSubject = new BehaviorSubject<number>(0);

  get noteCount$(): Observable<number> {
    return this._noteCountSubject.asObservable();
  }

  setNoteCount(count: number): void {
    if (count !== this.noteCount) { // Optional: to prevent unnecessary updates
      this._noteCountSubject.next(count);
    }
  }

  get noteCount(): number {
    return this._noteCountSubject.value;
  }
}