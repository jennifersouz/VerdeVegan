import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, map } from 'rxjs';
import { CartItem } from '../../core/models/cart-item';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: false,
})
export class CartPage {
  private destroyRef = inject(DestroyRef);
  usePoints = false;
  showAuthModal = false;
  readonly checkoutSteps = ['Carrinho', 'Descontos', 'Morada', 'Pagamento', 'Confirmação'];
  vm$ = combineLatest([this.cart.items$, this.orders.points$]).pipe(
    map(([items, points]) => {
      const pointsUsed = this.usePoints ? Math.min(points, Math.round((this.cart.subtotal(items) + this.cart.deliveryFee(items)) * 5)) : 0;
      return {
        items,
        points,
        pointsUsed,
        subtotal: this.cart.subtotal(items),
        delivery: this.cart.deliveryFee(items),
        total: this.cart.total(pointsUsed, items),
      };
    }),
  );

  constructor(
    public cart: CartService,
    private orders: OrdersService,
    private auth: AuthService,
    private router: Router,
  ) {
    this.auth.loggedIn$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loggedIn) => {
        if (loggedIn) {
          this.showAuthModal = false;
        }
      });
  }

  ionViewWillEnter(): void {
    if (this.auth.isLoggedIn) {
      this.showAuthModal = false;
    }
  }

  itemSubtotal(item: CartItem): number {
    return this.cart.itemSubtotal(item);
  }

  update(index: number, quantity: number): void {
    void this.cart.updateQuantity(index, quantity);
  }

  continueCheckout(pointsUsed: number): void {
    if (!this.auth.isLoggedIn) {
      this.showAuthModal = true;
      return;
    }

    void this.router.navigate(['/checkout'], { queryParams: { step: 2, pontos: pointsUsed } });
  }

  closeAuthModal(): void {
    this.showAuthModal = false;
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  }
}
