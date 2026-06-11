import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';

/** Disponibiliza textos globais da app a partir de JSON. */
@Injectable({ providedIn: 'root' })
export class StringsService {
  private strings$ = this.http.get<Record<string, string>>('assets/i18n/pt.json').pipe(shareReplay(1));

  constructor(private http: HttpClient) {}

  value(key: string): Observable<string> {
    return this.strings$.pipe(map((strings) => strings[key] ?? key));
  }
}
