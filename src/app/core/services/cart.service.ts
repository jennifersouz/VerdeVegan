import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../models/cart-item';
import { Dish } from '../models/dish';
import { AuthService, UserAccount } from './auth.service';
import { restaurantDeliveryFee } from './menu.service';
import { StorageService } from './storage.service';

const LEGACY_CART_KEY = 'verdevegan.cart';
const CART_KEY_PREFIX = 'verdevegan.cart.';

/** Centraliza a lógica do carrinho para evitar duplicação nas páginas. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  readonly items$ = this.itemsSubject.asObservable();
  private currentUser: UserAccount | null = null;

  constructor(
    private storage: StorageService,
    private auth: AuthService,
  ) {
    this.auth.currentUser$.subscribe((user) => {
      const anonymousItems = !this.currentUser && user ? this.itemsSubject.value : [];
      this.currentUser = user;
      void this.load(user, anonymousItems);
    });
  }

  async load(user = this.currentUser, itemsToMerge: CartItem[] = []): Promise<void> {
    if (!user) {
      this.itemsSubject.next([]);
      await this.storage.remove(LEGACY_CART_KEY);
      return;
    }

    const storedItems = await this.storage.get<CartItem[]>(this.cartKey(user), []);
    const mergedItems = itemsToMerge.length ? [...storedItems, ...itemsToMerge] : storedItems;
    this.itemsSubject.next(mergedItems);
    if (itemsToMerge.length) {
      await this.storage.set(this.cartKey(user), mergedItems);
    }
  }

  async addItem(dish: Dish, item?: Partial<CartItem>): Promise<void> {
    if (!dish.available) {
      throw new Error('Este prato está indisponível hoje.');
    }
    const next: CartItem = {
      dish,
      quantity: item?.quantity ?? 1,
      removedIngredients: item?.removedIngredients ?? [],
      selectedExtras: item?.selectedExtras ?? [],
      customPriceDelta: item?.customPriceDelta ?? 0,
      notes: item?.notes ?? '',
    };
    await this.persist([...this.itemsSubject.value, next]);
  }

  async repeat(items: CartItem[]): Promise<void> {
    await this.persist(items);
  }

  async updateQuantity(index: number, quantity: number): Promise<void> {
    const items = [...this.itemsSubject.value];
    if (quantity <= 0) {
      items.splice(index, 1);
    } else {
      items[index] = { ...items[index], quantity };
    }
    await this.persist(items);
  }

  async clear(): Promise<void> {
    await this.persist([]);
  }

  itemSubtotal(item: CartItem): number {
    if (item.customPriceDelta && item.customPriceDelta > 0) {
      return (item.dish.price + item.customPriceDelta) * item.quantity;
    }

    const extras = item.selectedExtras.reduce((sum, extraName) => {
      const extra = item.dish.extras.find((entry) => entry.name === extraName);
      return sum + (extra?.price ?? 0);
    }, 0);
    return (item.dish.price + extras) * item.quantity;
  }

  subtotal(items = this.itemsSubject.value): number {
    return items.reduce((sum, item) => sum + this.itemSubtotal(item), 0);
  }

  total(pointsUsed = 0, items = this.itemsSubject.value): number {
    return Math.max(0, this.subtotal(items) + this.deliveryFee(items) - pointsUsed / 10);
  }

  deliveryFee(items = this.itemsSubject.value): number {
    const restaurants = new Set(items.map((item) => item.dish.restaurant));
    return Array.from(restaurants).reduce((sum, restaurant) => sum + restaurantDeliveryFee(restaurant), 0);
  }

  private async persist(items: CartItem[]): Promise<void> {
    this.itemsSubject.next(items);
    if (this.currentUser) {
      await this.storage.set(this.cartKey(this.currentUser), items);
    }
  }

  private cartKey(user: UserAccount): string {
    return `${CART_KEY_PREFIX}${user.email}`;
  }
}
