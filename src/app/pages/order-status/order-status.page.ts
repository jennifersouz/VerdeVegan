import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Order } from '../../core/models/order';
import { CartService } from '../../core/services/cart.service';
import { MenuService } from '../../core/services/menu.service';
import { OrdersService } from '../../core/services/orders.service';

interface Coordinate {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-order-status',
  templateUrl: './order-status.page.html',
  styleUrls: ['./order-status.page.scss'],
  standalone: false,
})
export class OrderStatusPage implements OnInit, OnDestroy {
  order?: Order;
  isNewOrder = false;
  showCancelSheet = false;
  showReviewSheet = false;
  cancelCountdown = '15:00';
  selectedRating = 0;
  reviewComment = '';
  backLink = '/historico';
  backLabel = 'Pedidos';
  steps = ['Recebido', 'Em preparação', 'A caminho', 'Entregue'];
  checkoutSteps = ['Carrinho', 'Descontos', 'Morada', 'Pagamento', 'Confirmação'];
  mapUrl?: SafeResourceUrl;
  restaurantPosition = { x: 36, y: 42 };
  homePosition = { x: 78, y: 72 };
  courierPosition = { x: 36, y: 42 };
  private cancelTimer?: ReturnType<typeof setInterval>;
  private syncingStatus = false;
  private deliveryLocation: Coordinate = { lat: 41.6932, lng: -8.8329 };
  private restaurantLocation: Coordinate = { lat: 41.6947, lng: -8.8274 };
  private mapBounds = {
    minLat: 41.689,
    maxLat: 41.699,
    minLng: -8.838,
    maxLng: -8.823,
  };
  private readonly restaurantLocations: Record<string, Coordinate> = {
    'Pizzaria Luzzo': { lat: 41.6958, lng: -8.8271 },
    'Massas Caseiras': { lat: 41.6929, lng: -8.8317 },
    'Bowl Garden': { lat: 41.6972, lng: -8.8341 },
    'Green Burger Lab': { lat: 41.6909, lng: -8.8264 },
    'Taco Verde': { lat: 41.6965, lng: -8.8206 },
    'Sushi Raiz': { lat: 41.6889, lng: -8.8294 },
    'Doce Planta': { lat: 41.6991, lng: -8.8322 },
    'Folha Fresca': { lat: 41.6916, lng: -8.8381 },
    'Brunch Verde': { lat: 41.7002, lng: -8.8252 },
    VerdeVegan: { lat: 41.6947, lng: -8.8274 },
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orders: OrdersService,
    private menu: MenuService,
    private cart: CartService,
    private sanitizer: DomSanitizer,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.orders.load();
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.order = this.orders.getOrder(id);
    this.setRestaurantLocation();
    this.prepareMap();
    this.updateMapPositions();
    this.requestDeliveryLocation();
    this.startCancelCountdown();
    this.route.queryParamMap.subscribe((params) => {
      this.isNewOrder = params.get('novo') === 'true';
      this.updateMapPositions();
      if (params.get('voltar') === 'perfil') {
        this.backLink = '/perfil';
        this.backLabel = 'Perfil';
      } else {
        this.backLink = '/historico';
        this.backLabel = 'Pedidos';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.cancelTimer) {
      clearInterval(this.cancelTimer);
    }
  }

  isDone(index: number): boolean {
    const active = this.steps.indexOf(this.order?.status ?? 'Recebido');
    return index <= Math.max(active, 1);
  }

  activeStepIndex(order: Order): number {
    return Math.max(0, this.steps.indexOf(this.trackingStatus(order)));
  }

  stepLabel(step: string): string {
    return step === 'Recebido' ? 'Confirmado!' : step;
  }

  trackingTitle(order: Order): string {
    const status = this.trackingStatus(order);
    if (status === 'Recebido') {
      return 'Pedido Confirmado! A tua refeição está a ser processada';
    }
    if (status === 'Em preparação') {
      return 'Na cozinha! O chef está a preparar tudo com carinho';
    }
    if (status === 'A caminho') {
      return 'O estafeta já saiu!';
    }
    return 'Pedido Entregue! Bom apetite!';
  }

  statusHeading(order: Order): string {
    const status = this.trackingStatus(order);
    if (status === 'Recebido') {
      return 'Pedido recebido!';
    }
    if (status === 'Em preparação') {
      return 'Em preparação';
    }
    if (status === 'A caminho') {
      return 'A caminho';
    }
    return 'Pedido entregue!';
  }

  statusDescription(order: Order): string {
    const status = this.trackingStatus(order);
    if (status === 'Recebido') {
      return 'Confirmámos o teu pedido com o restaurante.';
    }
    if (status === 'Em preparação') {
      return 'O restaurante está a preparar a tua refeição.';
    }
    if (status === 'A caminho') {
      return 'O estafeta está a caminho da tua morada.';
    }
    return 'O teu pedido foi entregue com sucesso.';
  }

  statusTime(order: Order): string {
    const createdAt = this.createdAtDate(order);
    if (createdAt) {
      return this.formatTime(this.statusDate(order, createdAt));
    }

    const times: Record<Order['status'], string> = {
      Recebido: '12:36',
      'Em preparação': '12:42',
      'A caminho': '12:57',
      Entregue: '13:14',
      Cancelado: '12:45',
    };
    return times[this.trackingStatus(order)];
  }

  estimatedArrival(order: Order): string {
    const createdAt = this.createdAtDate(order);
    if (!createdAt) {
      return '13:30';
    }

    return this.formatTime(new Date(createdAt.getTime() + this.deliveryMinutes(order) * 60_000));
  }

  canCancel(order: Order): boolean {
    const status = this.trackingStatus(order);
    return (status === 'Recebido' || status === 'Em preparação') && this.cancelRemainingMs(order) > 0;
  }

  async cancelOrder(orderId: string): Promise<void> {
    if (this.order && !this.canCancel(this.order)) {
      this.showCancelSheet = false;
      return;
    }

    await this.orders.cancelOrder(orderId);
    this.showCancelSheet = false;
    void this.router.navigate(['/inicio']);
  }

  async confirmDelivery(orderId: string): Promise<void> {
    await this.orders.completeDelivery(orderId, this.selectedRating > 0);
    if (this.selectedRating > 0) {
      await this.orders.markRated(orderId, this.selectedRating, this.reviewComment.trim());
    }
    this.order = this.orders.getOrder(orderId);
    void this.router.navigate(['/inicio']);
  }

  canTrack(order: Order): boolean {
    const status = this.trackingStatus(order);
    return status !== 'Entregue' && status !== 'Cancelado';
  }

  canReview(order: Order): boolean {
    return this.trackingStatus(order) === 'Entregue';
  }

  reviewButtonLabel(order: Order): string {
    return this.hasReview(order) ? 'Alterar review' : 'Dar review ao pedido';
  }

  openReview(order: Order): void {
    this.selectedRating = order.rating ?? (this.hasReview(order) ? 5 : 0);
    this.reviewComment = order.reviewComment ?? '';
    this.showReviewSheet = true;
  }

  closeReview(): void {
    this.showReviewSheet = false;
  }

  async saveReview(orderId: string): Promise<void> {
    if (this.selectedRating <= 0) {
      return;
    }

    await this.orders.markRated(orderId, this.selectedRating, this.reviewComment.trim());
    this.order = this.orders.getOrder(orderId);
    this.showReviewSheet = false;
  }

  private hasReview(order: Order): boolean {
    return order.rated && (order.rating ?? 0) > 0;
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  }

  itemTotal(item: Order['items'][number]): number {
    return item.price * item.quantity;
  }

  subtotal(item: Order): number {
    return item.items.reduce((sum, orderItem) => sum + this.itemTotal(orderItem), 0);
  }

  deliveryFee(item: Order): number {
    return item.deliveryFee ?? Math.max(0, item.total - this.subtotal(item) + item.pointsUsed / 10);
  }

  startTracking(orderId: string): void {
    this.isNewOrder = true;
    void this.router.navigate(['/pedido', orderId], { queryParams: { novo: true } });
  }

  backToDetails(orderId: string): void {
    this.isNewOrder = false;
    void this.router.navigate(['/pedido', orderId]);
  }

  setTrackingStep(_orderId: string, _index: number): void {}

  setRating(event: MouseEvent, star: number): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const isHalf = event.clientX - rect.left <= rect.width / 2;
    this.selectedRating = isHalf ? star - 0.5 : star;
  }

  trackingStatus(order: Order): Order['status'] {
    return this.orders.trackingStatus(order);
  }

  starFill(star: number): string {
    const fill = Math.max(0, Math.min(1, this.selectedRating - (star - 1)));
    return `${fill * 100}%`;
  }

  private startCancelCountdown(): void {
    void this.updateCancelCountdown();
    this.cancelTimer = setInterval(() => void this.updateCancelCountdown(), 1000);
  }

  private async updateCancelCountdown(): Promise<void> {
    if (!this.order) {
      this.cancelCountdown = '00:00';
      return;
    }

    await this.syncOrderStatus();
    const remaining = this.cancelRemainingMs(this.order);
    this.updateMapPositions();
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    this.cancelCountdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (remaining <= 0) {
      this.showCancelSheet = false;
    }
  }

  private cancelRemainingMs(order: Order): number {
    return this.orders.cancelRemainingMs(order);
  }

  private createdAtDate(order: Order): Date | null {
    if (!order.createdAt) {
      return null;
    }

    const createdAt = new Date(order.createdAt);
    return Number.isNaN(createdAt.getTime()) ? null : createdAt;
  }

  private statusDate(order: Order, createdAt: Date): Date {
    const deliveryMinutes = this.deliveryMinutes(order);
    const stepMinutes = deliveryMinutes / 3;
    const offsets: Record<Order['status'], number> = {
      Recebido: 0,
      'Em preparação': stepMinutes,
      'A caminho': stepMinutes * 2,
      Entregue: deliveryMinutes,
      Cancelado: 0,
    };
    return new Date(createdAt.getTime() + offsets[this.trackingStatus(order)] * 60_000);
  }

  private deliveryMinutes(order: Order): number {
    return order.estimatedDeliveryMinutes && order.estimatedDeliveryMinutes > 0 ? order.estimatedDeliveryMinutes : 30;
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' }).format(date);
  }

  private requestDeliveryLocation(): void {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.deliveryLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        this.prepareMap();
        this.updateMapPositions();
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 60000,
      },
    );
  }

  private setRestaurantLocation(): void {
    const restaurantName = this.order?.restaurant ?? 'VerdeVegan';
    const match = Object.keys(this.restaurantLocations).find((name) => restaurantName.includes(name));
    this.restaurantLocation = this.restaurantLocations[match ?? 'VerdeVegan'];
  }

  private prepareMap(): void {
    const paddingLat = Math.max(Math.abs(this.deliveryLocation.lat - this.restaurantLocation.lat) * 0.35, 0.004);
    const paddingLng = Math.max(Math.abs(this.deliveryLocation.lng - this.restaurantLocation.lng) * 0.35, 0.006);

    this.mapBounds = {
      minLat: Math.min(this.deliveryLocation.lat, this.restaurantLocation.lat) - paddingLat,
      maxLat: Math.max(this.deliveryLocation.lat, this.restaurantLocation.lat) + paddingLat,
      minLng: Math.min(this.deliveryLocation.lng, this.restaurantLocation.lng) - paddingLng,
      maxLng: Math.max(this.deliveryLocation.lng, this.restaurantLocation.lng) + paddingLng,
    };

    const bbox = [
      this.mapBounds.minLng,
      this.mapBounds.minLat,
      this.mapBounds.maxLng,
      this.mapBounds.maxLat,
    ].join('%2C');
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private updateMapPositions(): void {
    this.restaurantPosition = this.coordinateToPosition(this.restaurantLocation);
    this.homePosition = this.coordinateToPosition(this.deliveryLocation);

    const progress = this.courierProgress();
    this.courierPosition = {
      x: this.restaurantPosition.x + (this.homePosition.x - this.restaurantPosition.x) * progress,
      y: this.restaurantPosition.y + (this.homePosition.y - this.restaurantPosition.y) * progress,
    };
  }

  private coordinateToPosition(coordinate: Coordinate): { x: number; y: number } {
    const width = this.mapBounds.maxLng - this.mapBounds.minLng || 1;
    const height = this.mapBounds.maxLat - this.mapBounds.minLat || 1;
    const x = ((coordinate.lng - this.mapBounds.minLng) / width) * 100;
    const y = (1 - (coordinate.lat - this.mapBounds.minLat) / height) * 100;

    return {
      x: Math.min(92, Math.max(8, x)),
      y: Math.min(88, Math.max(8, y)),
    };
  }

  private courierProgress(): number {
    if (!this.order) {
      return 0;
    }

    const status = this.trackingStatus(this.order);
    if (status === 'Entregue') {
      return 1;
    }

    if (status !== 'A caminho') {
      return 0;
    }

    const createdAt = this.createdAtDate(this.order)?.getTime() ?? Date.now();
    const deliveryMinutes = this.deliveryMinutes(this.order);
    const eta = deliveryMinutes * 60_000;
    const routeStart = createdAt + (deliveryMinutes / 3) * 2 * 60_000;
    const routeEnd = createdAt + eta;

    return Math.min(1, Math.max(0, (Date.now() - routeStart) / (routeEnd - routeStart || 1)));
  }

  private async syncOrderStatus(): Promise<void> {
    if (!this.order || this.syncingStatus) {
      return;
    }

    this.syncingStatus = true;
    try {
      await this.orders.syncOrderStatuses();
      this.order = this.orders.getOrder(this.order.id) ?? this.order;
    } finally {
      this.syncingStatus = false;
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
}
