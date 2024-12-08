import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MainLayoutHeaderService {
  private headerInfo$ = new BehaviorSubject<Record<string, string | number>>({});

  public setHeaderInfo(headerInfo: Record<string, string | number>) {
    this.headerInfo$.next(headerInfo);
  }

  public getHeaderInfo() {
    return this.headerInfo$;
  }
}
