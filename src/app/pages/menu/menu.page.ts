import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, startWith, Subject, switchMap, tap } from 'rxjs';
import { Dish } from '../../core/models/dish';
import { CartService } from '../../core/services/cart.service';
import { MenuService, RestaurantSummary } from '../../core/services/menu.service';
import { StringsService } from '../../core/services/strings.service';

type SortMode = 'popular' | 'rating' | 'priceAsc' | 'priceDesc';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false,
})
export class MenuPage {
  categoryIcons: Record<string, string> = {
    Todos: '🍽️',
    Entradas: '🥟',
    Pizza: '🍕',
    Massas: '🍝',
    'Carne vegetal': '🌱',
    'Pratos principais': '🍽️',
    Hambúrgueres: '🍔',
    Bowls: '🥗',
    Ramen: '🍜',
    Sushi: '🍣',
    Saladas: '🥬',
    Sobremesas: '🍰',
    Tacos: '🌮',
    Wraps: '🌯',
    Bebidas: '🥤',
  };

  categories$ = this.menu.getCategories();
  restaurants$ = this.menu.getRestaurants();
  placeholder$ = this.strings.value('searchPlaceholder');
  selectedCategory = 'Todos';
  selectedRestaurant = 'Todos';
  activeRestaurantCategory = '';
  searchQuery = '';
  fromDishDetail = false;
  showFilters = false;
  sortMode: SortMode = 'popular';
  maxPrice = 50;
  minRating = 0;

  private querySubject = new Subject<string>();
  private categorySubject = new Subject<string>();
  private activeCategory$ = this.categorySubject.pipe(startWith('Todos'), shareReplay(1));
  private filtersSubject = new BehaviorSubject({ sortMode: this.sortMode, maxPrice: this.maxPrice, minRating: this.minRating });

  private restaurant$ = this.route.queryParamMap.pipe(
    map((params) => params.get('restaurante') ?? 'Todos'),
    tap((restaurant) => {
      this.selectedRestaurant = restaurant;
      this.fromDishDetail = this.route.snapshot.queryParamMap.get('fromDishDetail') === '1' || history.state?.fromDishDetail === true;
    }),
  );

  private visibleDishesSource$: Observable<Dish[]> = combineLatest([
    this.querySubject.pipe(startWith('')),
    this.activeCategory$,
    this.restaurant$,
  ]).pipe(
    switchMap(([query, category, restaurant]) => this.menu.search(query, query.trim() ? 'Todos' : category, restaurant)),
    shareReplay(1),
  );

  dishes$: Observable<Dish[]> = combineLatest([
    this.visibleDishesSource$,
    this.filtersSubject,
  ]).pipe(
    map(([dishes, filters]) => this.applyFilters(dishes, filters)),
    shareReplay(1),
  );

  highlights$: Observable<Dish[]> = combineLatest([this.restaurant$, this.activeCategory$, this.filtersSubject]).pipe(
    switchMap(([restaurant, category, filters]) =>
      this.menu.search('', 'Todos', restaurant).pipe(
        map((dishes) =>
          dishes
            .slice(0, 6)
            .filter((dish) => this.matchesCategory(dish, category) && this.matchesFilterValues(dish, filters)),
        ),
      ),
    ),
    shareReplay(1),
  );

  cartCount$ = this.cart.items$.pipe(map((items) => items.reduce((sum, item) => sum + item.quantity, 0)));
  selectedRestaurantInfo$: Observable<RestaurantSummary | undefined> = combineLatest([this.restaurants$, this.restaurant$]).pipe(
    map(([restaurants, restaurant]) => restaurants.find((entry) => entry.name === restaurant)),
  );
  restaurantDishes$ = this.restaurant$.pipe(switchMap((restaurant) => this.menu.search('', 'Todos', restaurant)));
  groupedDishes$ = this.restaurantDishes$.pipe(
    map((dishes) => this.groupDishes(dishes)),
    tap((groups) => {
      if (!this.activeRestaurantCategory || !groups.some((group) => group.category === this.activeRestaurantCategory)) {
        this.activeRestaurantCategory = groups[0]?.category ?? '';
      }
    }),
    shareReplay(1),
  );

  constructor(
    private route: ActivatedRoute,
    private menu: MenuService,
    private cart: CartService,
    private strings: StringsService,
    private router: Router,
    private location: Location,
  ) {}

  search(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value ?? '';
    this.querySubject.next(this.searchQuery);
  }

  filter(category: string): void {
    this.selectedCategory = category;
    this.categorySubject.next(category);
  }

  selectRestaurant(restaurant: string): void {
    void this.router.navigate(['/menu'], {
      queryParams: restaurant === 'Todos' ? {} : { restaurante: restaurant },
    });
  }

  backFromRestaurant(): void {
    if (this.fromDishDetail) {
      this.location.back();
      return;
    }

    void this.router.navigate(['/inicio']);
  }

  openFilters(): void {
    this.showFilters = true;
  }

  closeFilters(): void {
    this.showFilters = false;
  }

  setSortMode(sortMode: SortMode): void {
    this.sortMode = sortMode;
  }

  setMinRating(minRating: number): void {
    this.minRating = minRating;
  }

  updateMaxPrice(event: Event): void {
    this.maxPrice = Number((event.target as HTMLInputElement).value);
  }

  resetFilters(): void {
    this.sortMode = 'popular';
    this.maxPrice = 50;
    this.minRating = 0;
    this.filtersSubject.next({ sortMode: this.sortMode, maxPrice: this.maxPrice, minRating: this.minRating });
    this.closeFilters();
  }

  applyFilterSelection(): void {
    this.filtersSubject.next({ sortMode: this.sortMode, maxPrice: this.maxPrice, minRating: this.minRating });
    this.closeFilters();
  }

  iconFor(category: string): string {
    return this.categoryIcons[category] ?? '🍽️';
  }

  get hasSearch(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  openDish(dish: Dish): void {
    const queryParams = this.selectedRestaurant === 'Todos' ? { categoria: this.selectedCategory } : { categoria: this.selectedCategory, restaurante: dish.restaurant };

    void this.router.navigate(['/detalhes', dish.id], {
      queryParams,
    });
  }

  sectionId(category: string): string {
    return `sec-${category
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`;
  }

  scrollToSection(category: string): void {
    this.activeRestaurantCategory = category;
    document.getElementById(this.sectionId(category))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onRestaurantScroll(): void {
    if (this.selectedRestaurant === 'Todos') {
      return;
    }

    const sections = Array.from(document.querySelectorAll<HTMLElement>('.restaurant-groups .dish-section'));
    if (!sections.length) {
      return;
    }

    const scrollElement = document.querySelector('ion-content')?.shadowRoot?.querySelector<HTMLElement>('.inner-scroll');
    const scrollTop = scrollElement?.scrollTop ?? window.scrollY;
    if (scrollTop <= 4) {
      this.activeRestaurantCategory = sections[0].dataset['category'] ?? this.activeRestaurantCategory;
      return;
    }

    if (scrollElement && scrollTop + scrollElement.clientHeight >= scrollElement.scrollHeight - 2) {
      this.activeRestaurantCategory = sections[sections.length - 1].dataset['category'] ?? this.activeRestaurantCategory;
      return;
    }

    const activationY = 150;
    const activeSection = [...sections].reverse().find((section) => section.getBoundingClientRect().top <= activationY) ?? sections[0];
    this.activeRestaurantCategory = activeSection.dataset['category'] ?? this.activeRestaurantCategory;
  }

  private applyFilters(dishes: Dish[], filters: { sortMode: SortMode; maxPrice: number; minRating: number }): Dish[] {
    const filtered = dishes.filter((dish) => this.matchesFilterValues(dish, filters));
    return [...filtered].sort((a, b) => {
      if (filters.sortMode === 'rating') {
        return b.rating - a.rating;
      }
      if (filters.sortMode === 'priceAsc') {
        return a.price - b.price;
      }
      if (filters.sortMode === 'priceDesc') {
        return b.price - a.price;
      }
      return b.rating - a.rating || a.time.localeCompare(b.time);
    });
  }

  private matchesFilterValues(dish: Dish, filters: { maxPrice: number; minRating: number }): boolean {
    return dish.price <= filters.maxPrice && dish.rating >= filters.minRating;
  }

  private matchesCategory(dish: Dish, category: string): boolean {
    return category === 'Todos' || dish.category === category;
  }

  private groupDishes(dishes: Dish[]): { category: string; dishes: Dish[] }[] {
    const order = ['Entradas', 'Pizza', 'Massas', 'Carne vegetal', 'Hambúrgueres', 'Bowls', 'Sushi', 'Tacos', 'Saladas', 'Sobremesas', 'Bebidas'];
    return order
      .map((category) => ({ category, dishes: dishes.filter((dish) => dish.category === category) }))
      .filter((group) => group.dishes.length > 0);
  }
}
