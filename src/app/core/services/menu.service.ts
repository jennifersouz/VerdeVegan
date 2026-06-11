import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { defer, from, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { Dish } from '../models/dish';
import { SupabaseService } from './supabase.service';

export interface RestaurantSummary {
  name: string;
  image: string;
  rating: number;
  time: string;
  categories: string[];
  dishCount: number;
  deliveryFee: number;
  featuredDish: string;
}

export function restaurantDeliveryFee(name: string): number {
  return name === 'Pizzaria Luzzo' ? 2.4 : name === 'Massas Caseiras' ? 1.9 : 1.5;
}

const RESTAURANT_COVERS: Record<string, string> = {
  'Pizzaria Luzzo': 'assets/imagens/pizzaria luzo.jpg',
  'Green Burger Lab': 'assets/imagens/green burguer lab.jpg',
  'Taco Verde': 'assets/imagens/taco verde.jpg',
  'Sushi Raiz': 'assets/imagens/sushi raiz.jpg',
  'Massas Caseiras': 'assets/imagens/massas caseiras .jpg',
  'Brunch Verde': 'assets/imagens/brunch verde.jpg',
  'Bowl Garden': 'assets/imagens/bowl garden.jpg',
  'Doce Planta': 'assets/imagens/doce planta.jpg',
  'Folha Fresca': 'assets/imagens/folha fresca.jpg',
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Gere a leitura dos pratos a partir do ficheiro JSON da app. */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private localDishes$ = this.http.get<Dish[]>('assets/data/menu.json');
  private dishes$ = defer(() => from(this.supabase.getDishes())).pipe(
    switchMap((dishes) => (dishes?.length ? of(dishes) : this.localDishes$)),
    shareReplay(1),
  );

  constructor(
    private http: HttpClient,
    private supabase: SupabaseService,
  ) {}

  getDishes(): Observable<Dish[]> {
    return this.dishes$;
  }

  getDish(id: string): Observable<Dish | undefined> {
    return this.dishes$.pipe(map((dishes) => dishes.find((dish) => dish.id === id)));
  }

  getCategories(): Observable<string[]> {
    return this.dishes$.pipe(map((dishes) => ['Todos', ...Array.from(new Set(dishes.map((dish) => dish.category)))]));
  }

  getRestaurants(): Observable<RestaurantSummary[]> {
    return this.dishes$.pipe(
      map((dishes) => {
        const restaurants = Array.from(new Set(dishes.map((dish) => dish.restaurant)));
        return restaurants.map((name) => {
          const restaurantDishes = dishes.filter((dish) => dish.restaurant === name);
          const coverDish =
            restaurantDishes.find((dish) => dish.category !== 'Bebidas' && dish.category !== 'Sobremesas') ?? restaurantDishes[0];
          const categories = Array.from(new Set(restaurantDishes.map((dish) => dish.category))).sort((a, b) => {
            const order = ['Entradas', 'Pizza', 'Massas', 'Carne vegetal', 'Hambúrgueres', 'Bowls', 'Sushi', 'Tacos', 'Saladas', 'Sobremesas', 'Bebidas'];
            return order.indexOf(a) - order.indexOf(b);
          });
          return {
            name,
            image: RESTAURANT_COVERS[name] ?? coverDish?.image ?? '',
            rating: Math.round((restaurantDishes.reduce((sum, dish) => sum + dish.rating, 0) / restaurantDishes.length) * 10) / 10,
            time: coverDish?.time ?? '25-35min',
            categories,
            dishCount: restaurantDishes.length,
            deliveryFee: restaurantDeliveryFee(name),
            featuredDish: coverDish?.name ?? '',
          };
        });
      }),
    );
  }

  searchRestaurants(query: string, category: string): Observable<RestaurantSummary[]> {
    const normalized = normalizeText(query.trim());
    return this.getRestaurants().pipe(
      map((restaurants) =>
        restaurants.filter((restaurant) => {
          const matchesCategory = category === 'Todos' || restaurant.categories.includes(category);
          const matchesText = !normalized || normalizeText(restaurant.name).includes(normalized);
          return matchesCategory && matchesText;
        }),
      ),
    );
  }

  search(query: string, category: string, restaurant = 'Todos'): Observable<Dish[]> {
    const normalized = normalizeText(query.trim());
    return this.dishes$.pipe(
      map((dishes) =>
        dishes.filter((dish) => {
          const matchesCategory = category === 'Todos' || dish.category === category;
          const matchesRestaurant = restaurant === 'Todos' || dish.restaurant === restaurant;
          const matchesText = !normalized || normalizeText(dish.name).includes(normalized);
          return matchesCategory && matchesRestaurant && matchesText;
        }),
      ),
    );
  }
}
