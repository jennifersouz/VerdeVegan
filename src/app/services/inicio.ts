import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { MenuService, Prato } from './menu';

@Injectable({
  providedIn: 'root'
})
export class InicioService {

  constructor(private menuService: MenuService) {}

  public carregarDestaques(): Observable<Prato[]> {
    return this.menuService.carregarPratos().pipe(
      map((pratos: Prato[]) =>
        pratos.filter((prato: Prato) => prato.destaque)
      )
    );
  }

  public carregarCategorias(): string[] {
    return [
      'Todas',
      'Bebidas',
      'Sobremesas',
      'Pizza',
      'Massas',
      'Hambúrgueres'
    ];
  }
}