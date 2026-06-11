import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

export interface ExternalFoodInfo {
  name: string;
  grade: string;
  source: string;
}

/** Consome a API externa OpenFoodFacts para demonstrar integração REST. */
@Injectable({ providedIn: 'root' })
export class ExternalFoodService {
  constructor(private http: HttpClient) {}

  searchIngredient(query: string): Observable<ExternalFoodInfo[]> {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=3`;
    return this.http.get<any>(url).pipe(
      map((response) =>
        (response.products ?? []).map((product: any) => ({
          name: product.product_name || product.generic_name || 'Produto sem nome',
          grade: product.nutriscore_grade?.toUpperCase() || 'N/D',
          source: 'OpenFoodFacts',
        })),
      ),
      catchError(() => of([{ name: 'API indisponível, dados locais mantidos', grade: 'N/D', source: 'Fallback' }])),
    );
  }
}
