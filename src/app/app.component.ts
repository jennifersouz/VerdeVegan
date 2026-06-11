import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { DeviceService } from './core/services/device.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  loggedIn$ = this.auth.loggedIn$;
  cartCount$ = this.cart.items$.pipe(map((items) => items.reduce((sum, item) => sum + item.quantity, 0)));

  navItems = [
    { label: 'Início', icon: 'home-outline', path: '/inicio' },
    { label: 'Menu', icon: 'restaurant-outline', path: '/menu' },
    { label: 'Carrinho', icon: 'cart-outline', path: '/carrinho' },
    { label: 'Pedidos', icon: 'cube-outline', path: '/historico' },
    { label: 'Perfil', icon: 'person-outline', path: '/perfil' },
  ];

  constructor(
    private device: DeviceService,
    private auth: AuthService,
    private cart: CartService,
    private router: Router,
  ) {
    void this.device.lockPortrait();
  }

  isActive(item: { label: string; path: string }): boolean {
    const url = this.router.url.split('?')[0];
    if (item.label === 'Início') {
      return url === '/' || url.startsWith('/inicio');
    }
    if (item.label === 'Menu') {
      return url.startsWith('/menu') || url.startsWith('/detalhes');
    }
    if (item.label === 'Carrinho') {
      return url.startsWith('/carrinho') || url.startsWith('/checkout');
    }
    if (item.label === 'Pedidos') {
      return url.startsWith('/historico') || url.startsWith('/pedido') || url.startsWith('/avaliar');
    }
    if (item.label === 'Perfil') {
      return url.startsWith('/perfil') || url.startsWith('/pontos') || url.startsWith('/sobre');
    }
    return url.startsWith(item.path);
  }

  enter(): void {
    void this.router.navigate(['/login']);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/inicio']);
  }
}
