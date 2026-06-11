import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Order } from '../../core/models/order';
import { MenuService } from '../../core/services/menu.service';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: false,
})
export class OrdersPage implements OnInit, OnDestroy {
  orders$ = this.orders.orders$;
  searchTerm = '';
  statusFilter: 'Todos' | 'Entregues' | 'A preparar' | 'A caminho' | 'Cancelados' = 'Todos';
  readonly statusFilters: Array<'Todos' | 'Entregues' | 'A preparar' | 'A caminho' | 'Cancelados'> = [
    'Todos',
    'Entregues',
    'A caminho',
    'A preparar',
    'Cancelados',
  ];
  showFilters = false;
  selectedMonth = 'Todos';
  selectedYear = 'Todos';
  private statusTimer?: ReturnType<typeof setInterval>;
  readonly monthFilters = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Janeiro', value: '0' },
    { label: 'Fevereiro', value: '1' },
    { label: 'Março', value: '2' },
    { label: 'Abril', value: '3' },
    { label: 'Maio', value: '4' },
    { label: 'Junho', value: '5' },
    { label: 'Julho', value: '6' },
    { label: 'Agosto', value: '7' },
    { label: 'Setembro', value: '8' },
    { label: 'Outubro', value: '9' },
    { label: 'Novembro', value: '10' },
    { label: 'Dezembro', value: '11' },
  ];

  constructor(
    private orders: OrdersService,
    private menu: MenuService,
    private cart: CartService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.route.queryParamMap.subscribe((params) => {
      const state = params.get('estado');
      if (state === 'Todos' || state === 'Entregues' || state === 'A preparar' || state === 'A caminho' || state === 'Cancelados') {
        this.statusFilter = state;
      }
    });
  }

  ngOnInit(): void {
    void this.orders.syncOrderStatuses();
    this.statusTimer = setInterval(() => void this.orders.syncOrderStatuses(), 1000);
  }

  ngOnDestroy(): void {
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
    }
  }

  async repeat(orderId: string): Promise<void> {
    const order = this.orders.getOrder(orderId);
    const dishes = await firstValueFrom(this.menu.getDishes());
    if (!order) {
      return;
    }
    await this.cart.repeat(this.orders.toCartItems(order, dishes));
    void this.router.navigate(['/carrinho'], { queryParams: { repetido: orderId } });
  }

  filteredOrders(orders: Order[] | null): Order[] {
    const list = [...(orders ?? [])].sort((a, b) => this.sortTimestamp(b) - this.sortTimestamp(a));
    const query = this.normalize(this.searchTerm);

    return list.filter((order) => {
      const date = this.orderDate(order);
      const searchable = this.normalize(`${this.orderRestaurant(order)} ${order.id} ${order.items.map((item) => item.name).join(' ')}`);
      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus =
        this.statusFilter === 'Todos' ||
        (this.statusFilter === 'Entregues' && this.statusFor(order) === 'Entregue') ||
        (this.statusFilter === 'A preparar' && this.statusFor(order) === 'Em preparação') ||
        (this.statusFilter === 'A caminho' && this.statusFor(order) === 'A caminho') ||
        (this.statusFilter === 'Cancelados' && this.statusFor(order) === 'Cancelado');
      const matchesMonth = this.selectedMonth === 'Todos' || date.getMonth().toString() === this.selectedMonth;
      const matchesYear = this.selectedYear === 'Todos' || date.getFullYear().toString() === this.selectedYear;

      return matchesSearch && matchesStatus && matchesMonth && matchesYear;
    });
  }

  currentOrders(orders: Order[]): Order[] {
    return orders.filter((order) => this.statusFor(order) !== 'Entregue' && this.statusFor(order) !== 'Cancelado');
  }

  monthGroups(orders: Order[]): Array<{ title: string; orders: Order[] }> {
    const groups = new Map<string, Order[]>();
    orders
      .filter((order) => this.statusFor(order) === 'Entregue' || this.statusFor(order) === 'Cancelado')
      .forEach((order) => {
        const date = this.orderDate(order);
        const title = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(date).toUpperCase();
        groups.set(title, [...(groups.get(title) ?? []), order]);
      });
    return Array.from(groups, ([title, groupedOrders]) => ({ title, orders: groupedOrders }));
  }

  orderTitle(order: Order): string {
    return order.items[0]?.name ?? 'Pedido VerdeVegan';
  }

  orderRestaurant(order: Order): string {
    return order.restaurant ?? 'VerdeVegan';
  }

  itemCount(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  timeLabel(order: Order): string {
    const date = this.orderDate(order);
    const day = this.isYesterday(date) ? 'Ontem' : new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' }).format(date);
    return `${day} · ${this.statusFor(order) === 'Entregue' ? '22H34' : 'Agora'} · ${this.itemCount(order)} ${this.itemCount(order) === 1 ? 'item' : 'itens'}`;
  }

  statusFor(order: Order): Order['status'] {
    return this.orders.trackingStatus(order);
  }

  availableYears(orders: Order[] | null): string[] {
    return Array.from(new Set((orders ?? []).map((order) => this.orderDate(order).getFullYear().toString()))).sort((a, b) => b.localeCompare(a));
  }

  openFilters(): void {
    this.showFilters = true;
  }

  closeFilters(): void {
    this.showFilters = false;
  }

  resetFilters(): void {
    this.selectedMonth = 'Todos';
    this.selectedYear = 'Todos';
    this.statusFilter = 'Todos';
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  }

  private orderDate(order: Order): Date {
    return new Date(`${order.date}T00:00:00`);
  }

  private sortTimestamp(order: Order): number {
    return new Date(order.createdAt ?? `${order.date}T00:00:00`).getTime();
  }

  private isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
