import { Injectable } from '@angular/core';
import { AuthChangeEvent, createClient, RealtimeChannel, Session, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Dish } from '../models/dish';
import { Order } from '../models/order';
import type { UserAccount } from './auth.service';

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  diet: string | null;
  allergies: string | null;
  photo_url: string | null;
  addresses: unknown;
  payments: unknown;
  points: number | null;
};

type OrderRow = {
  id: string;
  user_id: string;
  date: string;
  created_at_app: string | null;
  estimated_delivery_minutes: number | null;
  restaurant: string | null;
  status: Order['status'];
  items: unknown;
  points_used: number;
  points_earned: number;
  delivery_fee: number | null;
  total: number;
  rated: boolean;
  rating: number | null;
  review_comment: string | null;
};

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient | null = this.createSupabaseClient();

  get enabled(): boolean {
    return Boolean(this.client);
  }

  async signIn(email: string, password: string): Promise<UserAccount | null> {
    if (!this.client) {
      return null;
    }

    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return null;
    }

    return this.getCurrentAccount();
  }

  async signUp(account: Pick<UserAccount, 'name' | 'email' | 'password' | 'diet' | 'allergies'>): Promise<UserAccount | null> {
    if (!this.client) {
      return null;
    }

    const { data, error } = await this.client.auth.signUp({
      email: account.email,
      password: account.password,
      options: {
        data: {
          name: account.name,
          diet: account.diet,
          allergies: account.allergies,
        },
      },
    });
    if (error || !data.user) {
      return null;
    }

    const profile = this.accountToProfileRow(
      {
        name: account.name,
        email: account.email,
        phone: '',
        password: account.password,
        diet: account.diet,
        allergies: account.allergies,
        photoUrl: '',
        addresses: [],
        payments: [],
      },
      data.user.id,
      0,
    );
    await this.client.from('profiles').upsert(profile);
    return this.getCurrentAccount();
  }

  async signOut(): Promise<void> {
    await this.client?.auth.signOut();
  }

  async resetPassword(email: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    return !error;
  }

  async getCurrentAccount(): Promise<UserAccount | null> {
    if (!this.client) {
      return null;
    }

    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user?.email) {
      return null;
    }

    const { data } = await this.client.from('profiles').select('*').eq('id', user.id).maybeSingle<ProfileRow>();
    if (!data) {
      const fallback: UserAccount = {
        name: String(user.user_metadata?.['name'] ?? user.email.split('@')[0]),
        email: user.email,
        phone: '',
        password: '',
        diet: String(user.user_metadata?.['diet'] ?? 'Vegan'),
        allergies: String(user.user_metadata?.['allergies'] ?? ''),
        photoUrl: '',
        addresses: [],
        payments: [],
      };
      await this.client.from('profiles').upsert(this.accountToProfileRow(fallback, user.id, 0));
      return fallback;
    }

    return this.profileRowToAccount(data);
  }

  async updateCurrentAccount(update: UserAccount): Promise<UserAccount | null> {
    if (!this.client) {
      return null;
    }

    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) {
      return null;
    }

    if (update.email && update.email !== user.email) {
      await this.client.auth.updateUser({ email: update.email });
    }

    const currentPoints = await this.getPoints();
    const { data, error } = await this.client
      .from('profiles')
      .upsert(this.accountToProfileRow(update, user.id, currentPoints))
      .select()
      .single<ProfileRow>();
    return error ? null : this.profileRowToAccount(data);
  }

  async getOrders(): Promise<Order[] | null> {
    if (!this.client) {
      return null;
    }

    const { data, error } = await this.client.from('orders').select('*').order('created_at_app', { ascending: false });
    if (error) {
      return null;
    }

    return (data as OrderRow[]).map((row) => this.orderRowToOrder(row));
  }

  async saveOrders(orders: Order[]): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) {
      return false;
    }

    const rows = orders.map((order) => this.orderToOrderRow(order, user.id));
    const { error } = await this.client.from('orders').upsert(rows);
    return !error;
  }

  async getPoints(): Promise<number> {
    if (!this.client) {
      return 0;
    }

    const { data } = await this.client.from('profiles').select('points').maybeSingle<{ points: number | null }>();
    return data?.points ?? 0;
  }

  async savePoints(points: number): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) {
      return false;
    }

    const { error } = await this.client.from('profiles').update({ points }).eq('id', user.id);
    return !error;
  }

  async getDishes(): Promise<Dish[] | null> {
    if (!this.client) {
      return null;
    }

    const { data, error } = await this.client.from('dishes').select('*').eq('available', true).order('name');
    if (error || !data?.length) {
      return null;
    }

    return (data as Dish[]).map((dish) => ({
      ...dish,
      price: Number(dish.price),
      rating: Number(dish.rating),
      extras: (dish.extras ?? []).map((extra) => ({ ...extra, price: Number(extra.price) })),
      customizations: (dish.customizations ?? []).map((group) => ({
        ...group,
        options: group.options.map((option) => ({ ...option, price: Number(option.price) })),
      })),
    }));
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): void {
    this.client?.auth.onAuthStateChange(callback);
  }

  async subscribeToCurrentUserOrders(callback: () => void): Promise<(() => void) | null> {
    const userId = await this.getCurrentUserId();
    if (!this.client || !userId) {
      return null;
    }

    const channel = this.client
      .channel(`orders-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();

    return () => this.removeChannel(channel);
  }

  async subscribeToCurrentUserProfile(callback: () => void): Promise<(() => void) | null> {
    const userId = await this.getCurrentUserId();
    if (!this.client || !userId) {
      return null;
    }

    const channel = this.client
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        callback,
      )
      .subscribe();

    return () => this.removeChannel(channel);
  }

  private createSupabaseClient(): SupabaseClient | null {
    const url = environment.supabase?.url?.trim();
    const anonKey = environment.supabase?.anonKey?.trim();
    if (!url || !anonKey) {
      return null;
    }

    return createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  private async getCurrentUserId(): Promise<string | null> {
    if (!this.client) {
      return null;
    }

    const {
      data: { user },
    } = await this.client.auth.getUser();
    return user?.id ?? null;
  }

  private removeChannel(channel: RealtimeChannel): void {
    void this.client?.removeChannel(channel);
  }

  private profileRowToAccount(row: ProfileRow): UserAccount {
    return {
      name: row.name,
      email: row.email,
      phone: row.phone ?? '',
      password: '',
      diet: row.diet ?? 'Vegan',
      allergies: row.allergies ?? '',
      photoUrl: row.photo_url ?? '',
      addresses: Array.isArray(row.addresses) ? (row.addresses as UserAccount['addresses']) : [],
      payments: Array.isArray(row.payments) ? (row.payments as UserAccount['payments']) : [],
    };
  }

  private accountToProfileRow(account: UserAccount, userId: string, points: number): ProfileRow {
    return {
      id: userId,
      name: account.name,
      email: account.email,
      phone: account.phone,
      diet: account.diet,
      allergies: account.allergies,
      photo_url: account.photoUrl,
      addresses: account.addresses,
      payments: account.payments,
      points,
    };
  }

  private orderRowToOrder(row: OrderRow): Order {
    return {
      id: row.id,
      date: row.date,
      createdAt: row.created_at_app ?? undefined,
      estimatedDeliveryMinutes: row.estimated_delivery_minutes ?? undefined,
      restaurant: row.restaurant ?? undefined,
      status: row.status,
      items: Array.isArray(row.items) ? (row.items as Order['items']) : [],
      pointsUsed: row.points_used,
      pointsEarned: row.points_earned,
      deliveryFee: row.delivery_fee === null ? undefined : Number(row.delivery_fee),
      total: Number(row.total),
      rated: row.rated,
      rating: row.rating ?? undefined,
      reviewComment: row.review_comment ?? undefined,
    };
  }

  private orderToOrderRow(order: Order, userId: string): OrderRow {
    return {
      id: order.id,
      user_id: userId,
      date: order.date,
      created_at_app: order.createdAt ?? null,
      estimated_delivery_minutes: order.estimatedDeliveryMinutes ?? null,
      restaurant: order.restaurant ?? null,
      status: order.status,
      items: order.items,
      points_used: order.pointsUsed,
      points_earned: order.pointsEarned,
      delivery_fee: order.deliveryFee ?? null,
      total: order.total,
      rated: order.rated,
      rating: order.rating ?? null,
      review_comment: order.reviewComment ?? null,
    };
  }
}
