import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { CartItem } from '../models/cart-item';
import { Dish } from '../models/dish';
import { Order } from '../models/order';
import { AuthService, UserAccount } from './auth.service';
import { restaurantDeliveryFee } from './menu.service';
import { StorageService } from './storage.service';
import { SupabaseService } from './supabase.service';

const ORDERS_KEY = 'verdevegan.orders';
const POINTS_KEY = 'verdevegan.points';
const PERSISTED_ORDERS_KEY = 'verdevegan.orders.persisted';
const PERSISTED_POINTS_KEY = 'verdevegan.points.persisted';
const LEGACY_DEFAULT_EMAIL = 'ines@verdevegan.pt';
const DEFAULT_EMAIL = 'inesmpmarinho@gmail.com';
const CANCEL_WINDOW_MINUTES = 1;
const STEP_MINUTES = 2;
const DELIVERY_MINUTES = STEP_MINUTES * 3;
const REMOVED_DEFAULT_ORDER_IDS = new Set(['VV-3078']);

/** Simula uma pequena base de dados local de encomendas usando Ionic Storage. */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  private pointsSubject = new BehaviorSubject<number>(86);
  // BehaviorSubject guarda o estado atual e também permite que os ecrãs reajam automaticamente.
  private seedOrders = new Map<string, Order>();
  private loadedUserEmail = '';
  private ordersRealtimeUnsubscribe: (() => void) | null = null;
  private ordersRealtimeEmail = '';
  readonly orders$ = this.ordersSubject.asObservable();
  readonly points$ = this.pointsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private auth: AuthService,
    private supabase: SupabaseService,
  ) {
    // Sempre que muda o utilizador autenticado, recarrega encomendas e pontos desse utilizador.
    this.auth.currentUser$.subscribe((user) => {
      void this.handleUserChange(user);
    });
  }

  async load(user = this.auth.currentUser, persistRemote = true): Promise<void> {
    if (!user) {
      this.ordersSubject.next([]);
      this.pointsSubject.next(0);
      this.seedOrders = new Map<string, Order>();
      this.loadedUserEmail = '';
      return;
    }
    const isDefaultUser = user.email === DEFAULT_EMAIL || user.email === LEGACY_DEFAULT_EMAIL;
    // A conta default recebe encomendas iniciais do JSON para a demonstração não começar vazia.
    const seed = isDefaultUser ? await firstValueFrom(this.http.get<Order[]>('assets/data/orders.json')) : [];
    this.seedOrders = new Map(seed.map((order) => [order.id, order]));
    this.loadedUserEmail = user.email;
    const storedOrders = await this.readStoredOrders(user);
    const orderMap = new Map<string, Order>();
    // Map por id evita pedidos duplicados quando há dados no JSON, localStorage e Supabase.
    [...seed, ...storedOrders].forEach((order) => orderMap.set(order.id, order));
    const orders = Array.from(orderMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    const points = await this.readStoredPoints(user, isDefaultUser ? 86 : 0);
    // Ao carregar, atualiza pedidos que entretanto chegaram ao fim e credita pontos só nessa transição.
    const synced = this.syncStatusesAndPoints(orders, points);
    if (persistRemote) {
      await this.persistUserOrders(user, synced.orders);
      await this.persistUserPoints(user, synced.points);
    }
    this.ordersSubject.next(synced.orders);
    this.pointsSubject.next(synced.points);
  }

  async createOrder(items: CartItem[], pointsUsed: number, total: number): Promise<Order> {
    const user = this.requireUser();
    await this.ensureLoadedFor(user);
    const createdAt = new Date();
    const order: Order = {
      id: this.nextOrderId(),
      date: createdAt.toISOString().slice(0, 10),
      createdAt: createdAt.toISOString(),
      estimatedDeliveryMinutes: this.estimatedDeliveryMinutes(items),
      // Junta nomes diferentes porque o carrinho pode ter itens de mais do que um restaurante.
      restaurant: Array.from(new Set(items.map((item) => item.dish.restaurant))).join(', ') || 'VerdeVegan',
      status: 'Recebido',
      items: items.map((item) => ({
        dishId: item.dish.id,
        name: item.dish.name,
        quantity: item.quantity,
        price: item.dish.price,
        extras: item.selectedExtras,
      })),
      pointsUsed,
      // Pontos a ganhar no futuro: calculados sobre o total final pago, depois dos descontos.
      pointsEarned: this.pointsEarned(total),
      deliveryFee: this.cartDeliveryFee(items),
      total,
      rated: false,
    };
    const orders = this.sortOrders([order, ...this.ordersSubject.value]);
    // Ao criar o pedido, os pontos usados saem logo; os pontos ganhos só entram quando for entregue.
    const points = Math.max(0, this.pointsSubject.value - pointsUsed);
    await this.persistUserOrders(user, orders);
    await this.persistUserPoints(user, points);
    this.ordersSubject.next(orders);
    this.pointsSubject.next(points);
    return order;
  }

  async markRated(orderId: string, rating?: number, reviewComment?: string): Promise<void> {
    const user = this.requireUser();
    await this.ensureLoadedFor(user);
    // Mantém os dados antigos e só altera avaliação/comentário do pedido escolhido.
    const orders = this.ordersSubject.value.map((order) =>
      order.id === orderId
        ? {
            ...order,
            rated: true,
            rating: rating ?? order.rating,
            reviewComment: reviewComment ?? order.reviewComment,
          }
        : order,
    );
    await this.persistUserOrders(user, orders);
    this.ordersSubject.next(orders);
  }

  async completeDelivery(orderId: string, rated: boolean): Promise<void> {
    const user = this.requireUser();
    await this.ensureLoadedFor(user);
    const orderToComplete = this.ordersSubject.value.find((order) => order.id === orderId);
    // Evita duplicar pontos se o pedido já tiver sido marcado como entregue.
    const pointsToEarn = orderToComplete?.status === 'Entregue' ? 0 : (orderToComplete?.pointsEarned ?? 0);
    const orders = this.ordersSubject.value.map((order) =>
      order.id === orderId ? { ...order, status: 'Entregue' as const, rated: rated || order.rated } : order,
    );
    const points = Math.max(0, this.pointsSubject.value + pointsToEarn);
    await this.persistUserOrders(user, orders);
    await this.persistUserPoints(user, points);
    this.ordersSubject.next(orders);
    this.pointsSubject.next(points);
  }

  async cancelOrder(orderId: string): Promise<void> {
    const user = this.requireUser();
    await this.ensureLoadedFor(user);
    const orderToCancel = this.ordersSubject.value.find((order) => order.id === orderId);
    // Cancelar devolve apenas os pontos usados; pontos ganhos ainda não foram atribuídos antes da entrega.
    const pointsToReturn = orderToCancel?.status === 'Cancelado' ? 0 : (orderToCancel?.pointsUsed ?? 0);
    const orders = this.ordersSubject.value.map((order) =>
      order.id === orderId ? { ...order, status: 'Cancelado' as const } : order,
    );
    const points = Math.max(0, this.pointsSubject.value + pointsToReturn);
    await this.persistUserOrders(user, orders);
    await this.persistUserPoints(user, points);
    this.ordersSubject.next(orders);
    this.pointsSubject.next(points);
  }

  async syncOrderStatuses(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      return;
    }

    await this.ensureLoadedFor(user);
    // Sincroniza o estado com o tempo real e, se passar a entregue, atualiza o saldo de pontos.
    const result = this.syncStatusesAndPoints(this.ordersSubject.value, this.pointsSubject.value);
    const changed =
      result.orders.some((order, index) => order.status !== this.ordersSubject.value[index]?.status) ||
      result.points !== this.pointsSubject.value;
    if (!changed) {
      return;
    }

    await this.persistUserOrders(user, result.orders);
    await this.persistUserPoints(user, result.points);
    this.ordersSubject.next(result.orders);
    this.pointsSubject.next(result.points);
  }

  trackingStatus(order: Order, now = new Date()): Order['status'] {
    if (order.status === 'Cancelado' || order.status === 'Entregue') {
      return order.status;
    }

    const createdAt = this.createdAtDate(order);
    if (!createdAt) {
      return order.status;
    }

    const deliveryMinutes = this.deliveryMinutes(order);
    // Divide a duração total em três fases visuais: recebido, preparação e a caminho.
    const stepMinutes = deliveryMinutes / 3;
    const elapsedMinutes = (now.getTime() - createdAt.getTime()) / 60_000;
    if (elapsedMinutes >= deliveryMinutes) {
      return 'Entregue';
    }
    if (elapsedMinutes >= stepMinutes * 2) {
      return 'A caminho';
    }
    if (elapsedMinutes >= stepMinutes) {
      return 'Em preparação';
    }
    return 'Recebido';
  }

  cancelRemainingMs(order: Order, now = new Date()): number {
    const createdAt = this.createdAtDate(order);
    if (!createdAt || order.status === 'Cancelado' || this.trackingStatus(order, now) === 'Entregue') {
      return 0;
    }

    const cancelUntil = createdAt.getTime() + CANCEL_WINDOW_MINUTES * 60_000;
    return Math.max(0, cancelUntil - now.getTime());
  }

  getOrder(orderId: string): Order | undefined {
    // Leitura rápida usada pelas páginas de detalhe/acompanhamento.
    return this.ordersSubject.value.find((order) => order.id === orderId);
  }

  toCartItems(order: Order, dishes: Dish[]): CartItem[] {
    // Converte uma encomenda antiga de volta para itens de carrinho quando o utilizador repete pedido.
    return order.items
      .map((item): CartItem | undefined => {
        const dish = dishes.find((entry) => entry.id === item.dishId);
        if (!dish || !dish.available) {
          return undefined;
        }
        return {
          dish,
          quantity: item.quantity,
          selectedExtras: item.extras,
          customPriceDelta: 0,
          removedIngredients: [],
          notes: 'Pedido repetido a partir do histórico.',
        };
      })
      .filter((item): item is CartItem => Boolean(item));
  }

  private ordersKey(user: UserAccount): string {
    return `${ORDERS_KEY}.${user.email}`;
  }

  private pointsKey(user: UserAccount): string {
    return `${POINTS_KEY}.${user.email}`;
  }

  private legacyOrdersKey(): string {
    return `${ORDERS_KEY}.${LEGACY_DEFAULT_EMAIL}`;
  }

  private legacyPointsKey(): string {
    return `${POINTS_KEY}.${LEGACY_DEFAULT_EMAIL}`;
  }

  private async readStoredOrders(user: UserAccount): Promise<Order[]> {
    // Supabase tem prioridade; se não houver dados remotos, tenta recuperar armazenamento local.
    const remoteOrders = await this.supabase.getOrders();
    if (remoteOrders?.length) {
      return this.filterRemovedDefaultOrders(remoteOrders);
    }

    const keys = Array.from(
      new Set([
        this.ordersKey(user),
        this.legacyOrdersKey(),
        PERSISTED_ORDERS_KEY,
        ...this.storage.localKeysWithPrefix(`${ORDERS_KEY}.`),
      ]),
    );
    const orderMap = new Map<string, Order>();

    for (const key of keys) {
      this.addOrdersToMap(orderMap, await this.storage.get<Order[] | null>(key, null));
      this.addOrdersToMap(orderMap, this.storage.getLocalValue<Order[] | null>(key));
    }

    return this.filterRemovedDefaultOrders(Array.from(orderMap.values()));
  }

  private async readStoredPoints(user: UserAccount, fallback: number): Promise<number> {
    // Mesma lógica dos pedidos: primeiro Supabase, depois storage por utilizador, depois fallback.
    if (this.supabase.enabled) {
      const remotePoints = await this.supabase.getPoints();
      if (remotePoints > 0) {
        return remotePoints;
      }
    }

    const storedPoints = await this.storage.get<number | null>(this.pointsKey(user), null);
    if (storedPoints !== null) {
      return storedPoints;
    }

    const persistedPoints = await this.storage.get<number | null>(PERSISTED_POINTS_KEY, null);
    if (persistedPoints !== null) {
      return persistedPoints;
    }

    return this.storage.get<number>(this.legacyPointsKey(), fallback);
  }

  private async ensureLoadedFor(user: UserAccount): Promise<void> {
    if (this.loadedUserEmail !== user.email) {
      await this.load(user);
    }
  }

  private async persistUserOrders(user: UserAccount, orders: Order[]): Promise<void> {
    const sortedOrders = this.sortOrders(orders);
    // Guarda em Supabase e localmente para funcionar online e também depois de recarregar a app.
    await this.supabase.saveOrders(sortedOrders);
    await this.storage.set(this.ordersKey(user), sortedOrders);
    await this.storage.set(PERSISTED_ORDERS_KEY, sortedOrders);
  }

  private async persistUserPoints(user: UserAccount, points: number): Promise<void> {
    await this.supabase.savePoints(points);
    await this.storage.set(this.pointsKey(user), points);
    await this.storage.set(PERSISTED_POINTS_KEY, points);
  }

  private sortOrders(orders: Order[]): Order[] {
    // Mais recentes primeiro no histórico.
    return [...orders].sort((a, b) => this.sortTimestamp(b) - this.sortTimestamp(a));
  }

  private addOrdersToMap(orderMap: Map<string, Order>, orders: Order[] | null): void {
    // Ignora entradas inválidas e o pedido default removido para não voltar a aparecer.
    (orders ?? [])
      .filter((order) => order?.id && Array.isArray(order.items) && !REMOVED_DEFAULT_ORDER_IDS.has(order.id))
      .forEach((order) => orderMap.set(order.id, order));
  }

  private filterRemovedDefaultOrders(orders: Order[]): Order[] {
    return orders.filter((order) => !REMOVED_DEFAULT_ORDER_IDS.has(order.id));
  }

  private sortTimestamp(order: Order): number {
    return new Date(order.createdAt ?? `${order.date}T00:00:00`).getTime();
  }

  private syncStatusesAndPoints(orders: Order[], currentPoints: number): { orders: Order[]; points: number } {
    let points = currentPoints;
    const now = new Date();
    const syncedOrders = orders.map((order) => {
      const status = this.trackingStatus(order, now);
      if (status === order.status) {
        return order;
      }

      if (status === 'Entregue' && order.status !== 'Entregue') {
        // Os pontos são atribuídos uma única vez: quando o estado muda para entregue.
        points += order.pointsEarned;
      }

      return { ...order, status };
    });

    return { orders: syncedOrders, points: Math.max(0, points) };
  }

  private createdAtDate(order: Order): Date | null {
    // Protege contra datas inválidas antes de calcular estados e tempos.
    if (!order.createdAt) {
      return null;
    }

    const createdAt = new Date(order.createdAt);
    return Number.isNaN(createdAt.getTime()) ? null : createdAt;
  }

  private estimatedDeliveryMinutes(items: CartItem[]): number {
    const restaurantMinutes = new Map<string, number[]>();
    items.forEach((item) => {
      const minutes = this.parseDeliveryTime(item.dish.time);
      if (minutes <= 0) {
        return;
      }

      const restaurant = item.dish.restaurant || 'VerdeVegan';
      restaurantMinutes.set(restaurant, [...(restaurantMinutes.get(restaurant) ?? []), minutes]);
    });

    const averages = Array.from(restaurantMinutes.values()).map(
      (minutes) => minutes.reduce((sum, value) => sum + value, 0) / minutes.length,
    );
    // Se houver vários restaurantes, usa a média dos tempos médios de cada um.
    return averages.length ? Math.round(averages.reduce((sum, value) => sum + value, 0) / averages.length) : 30;
  }

  private cartDeliveryFee(items: CartItem[]): number {
    // Cobra entrega por restaurante diferente presente no carrinho.
    const restaurants = new Set(items.map((item) => item.dish.restaurant));
    return Array.from(restaurants).reduce((sum, restaurant) => sum + restaurantDeliveryFee(restaurant), 0);
  }

  private pointsEarned(total: number): number {
    // Regra usada na app: 10 pontos por cada euro efetivamente pago.
    return Math.max(0, Math.floor(Math.round(total * 100) / 10));
  }

  private parseDeliveryTime(time: string): number {
    const values = time.match(/\d+/g)?.map(Number).filter(Number.isFinite) ?? [];
    // Exemplo: "30-40min" passa a 35 minutos.
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  private deliveryMinutes(order: Order): number {
    return order.estimatedDeliveryMinutes && order.estimatedDeliveryMinutes > 0 ? order.estimatedDeliveryMinutes : DELIVERY_MINUTES;
  }

  private nextOrderId(): string {
    const existingIds = new Set(this.ordersSubject.value.map((order) => order.id));
    let id = '';
    // Gera ids VV-0000 e repete se por acaso já existir.
    do {
      id = `VV-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (existingIds.has(id));
    return id;
  }

  private requireUser(): UserAccount {
    // Impede criar, cancelar ou avaliar pedidos sem sessão iniciada.
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('É preciso iniciar sessão para criar ou alterar pedidos.');
    }
    return user;
  }

  private async handleUserChange(user: UserAccount | null): Promise<void> {
    if (!user) {
      this.stopOrdersRealtime();
      await this.load(user);
      return;
    }

    const sameUser = this.loadedUserEmail === user.email;
    await this.load(user, !sameUser);
    await this.startOrdersRealtime(user.email);
  }

  private async startOrdersRealtime(email: string): Promise<void> {
    // Realtime faz a app atualizar quando Supabase recebe alterações de pedidos.
    if (!this.supabase.enabled || this.ordersRealtimeEmail === email) {
      return;
    }

    this.stopOrdersRealtime();
    this.ordersRealtimeEmail = email;
    this.ordersRealtimeUnsubscribe = await this.supabase.subscribeToCurrentUserOrders(() => {
      void this.load(this.auth.currentUser, false);
    });
  }

  private stopOrdersRealtime(): void {
    // Cancela a subscrição antiga para não ficar a ouvir pedidos de outro utilizador.
    this.ordersRealtimeUnsubscribe?.();
    this.ordersRealtimeUnsubscribe = null;
    this.ordersRealtimeEmail = '';
  }
}
