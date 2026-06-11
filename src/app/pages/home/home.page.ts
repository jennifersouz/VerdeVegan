import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, map, Observable, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { MenuService, RestaurantSummary } from '../../core/services/menu.service';
import { StringsService } from '../../core/services/strings.service';

type ReverseGeocodeResponse = {
  address?: {
    road?: string;
    pedestrian?: string;
    footway?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
  };
  display_name?: string;
};

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
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
  popularDishes$ = this.menu.getDishes().pipe(map((dishes) => dishes.slice(0, 4)));
  placeholder$ = this.strings.value('searchPlaceholder');
  selectedCategory = 'Todos';
  searchQuery = '';
  locationEnabled = localStorage.getItem('verdevegan-location-enabled') !== 'false';
  locationText = this.locationEnabled ? 'A obter localização...' : 'Localização desativada';
  showLocationMenu = false;

  private querySubject = new Subject<string>();
  private categorySubject = new Subject<string>();
  private activeCategory$ = this.categorySubject.pipe(startWith('Todos'), shareReplay(1));

  featured$ = combineLatest([this.menu.getRestaurants(), this.activeCategory$]).pipe(
    map(([restaurants, category]) => restaurants.slice(0, 6).filter((restaurant) => category === 'Todos' || restaurant.categories.includes(category))),
    shareReplay(1),
  );

  restaurants$: Observable<RestaurantSummary[]> = combineLatest([
    this.querySubject.pipe(startWith('')),
    this.activeCategory$,
  ]).pipe(
    switchMap(([query, category]) => this.menu.searchRestaurants(query, query.trim() ? 'Todos' : category)),
    shareReplay(1),
  );

  constructor(
    private menu: MenuService,
    private strings: StringsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.locationEnabled) {
      void this.refreshCurrentLocation();
    }
  }

  search(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value ?? '';
    this.querySubject.next(this.searchQuery);
  }

  filter(category: string): void {
    this.selectedCategory = category;
    this.categorySubject.next(category);
  }

  iconFor(category: string): string {
    return this.categoryIcons[category] ?? '🍽️';
  }

  get hasSearch(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  toggleLocationMenu(): void {
    this.showLocationMenu = !this.showLocationMenu;
  }

  toggleLocationUse(): void {
    this.showLocationMenu = false;
    this.locationEnabled = !this.locationEnabled;
    localStorage.setItem('verdevegan-location-enabled', String(this.locationEnabled));

    if (!this.locationEnabled) {
      this.locationText = 'Localização desativada';
      return;
    }

    this.locationText = 'A obter localização...';
    void this.refreshCurrentLocation();
  }

  openRestaurant(restaurant: RestaurantSummary): void {
    void this.router.navigate(['/menu'], { queryParams: { restaurante: restaurant.name } });
  }

  openDish(id: string): void {
    void this.router.navigate(['/detalhes', id]);
  }

  private async refreshCurrentLocation(): Promise<void> {
    if (!('geolocation' in navigator)) {
      this.locationText = 'Localização indisponível';
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 300000,
        });
      });

      const address = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
      this.locationText = address || 'Localização atual';
    } catch {
      this.locationText = 'Localização indisponível';
    }
  }

  private async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(latitude),
      lon: String(longitude),
      addressdetails: '1',
      'accept-language': 'pt-PT',
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
    if (!response.ok) {
      return '';
    }

    const data = (await response.json()) as ReverseGeocodeResponse;
    const address = data.address;
    return (
      address?.road ||
      address?.pedestrian ||
      address?.footway ||
      address?.neighbourhood ||
      address?.suburb ||
      address?.city ||
      address?.town ||
      address?.village ||
      data.display_name?.split(',')[0]?.trim() ||
      ''
    );
  }
}
