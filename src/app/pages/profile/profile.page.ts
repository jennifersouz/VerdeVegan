import { Component } from '@angular/core';
import { map } from 'rxjs';
import { Order, OrderItem } from '../../core/models/order';
import { AuthService, UserAccount, UserAddress, UserPayment } from '../../core/services/auth.service';
import { OrdersService } from '../../core/services/orders.service';

type ProfileModal = 'profile' | 'address' | 'payment' | null;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage {
  loggedIn$ = this.auth.loggedIn$;
  user$ = this.auth.currentUser$;
  points$ = this.orders.points$;
  recentOrders$ = this.orders.orders$.pipe(map((orders) => orders.slice(0, 5)));
  activeModal: ProfileModal = null;
  editingId?: number;

  addresses: UserAddress[] = [];
  payments: UserPayment[] = [];

  addressDraft: UserAddress = this.emptyAddress();
  paymentDraft: UserPayment = this.emptyPayment();
  profileDraft: Pick<UserAccount, 'name' | 'email' | 'phone' | 'diet' | 'allergies'> = {
    name: '',
    email: '',
    phone: '',
    diet: '',
    allergies: '',
  };
  profileError = '';

  constructor(
    private orders: OrdersService,
    private auth: AuthService,
  ) {
    this.auth.currentUser$.subscribe((user) => {
      this.addresses = user?.addresses ?? [];
      this.payments = user?.payments ?? [];
    });
  }

  openAddressModal(address?: UserAddress): void {
    this.editingId = address?.id;
    this.addressDraft = address ? { ...address } : this.emptyAddress();
    if (!address && !this.addresses.length) {
      this.addressDraft.principal = true;
    }
    this.activeModal = 'address';
  }

  openPaymentModal(payment?: UserPayment): void {
    this.editingId = payment?.id;
    this.paymentDraft = payment ? { ...payment } : this.emptyPayment();
    if (!payment && !this.payments.length) {
      this.paymentDraft.principal = true;
    }
    this.activeModal = 'payment';
  }

  openProfileModal(user: UserAccount): void {
    this.profileDraft = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      diet: user.diet,
      allergies: user.allergies,
    };
    this.profileError = '';
    this.activeModal = 'profile';
  }

  closeModal(): void {
    this.activeModal = null;
    this.editingId = undefined;
  }

  async saveAddress(): Promise<void> {
    const entry = { ...this.addressDraft, id: this.editingId ?? Date.now() };
    const addresses = this.editingId
      ? this.addresses.map((address) => (address.id === this.editingId ? entry : address))
      : [...this.addresses, entry];
    this.addresses = this.applySinglePrimary(addresses, entry.id);
    await this.auth.updateCurrentUser({ addresses: this.addresses });
    this.closeModal();
  }

  async savePayment(): Promise<void> {
    const entry = { ...this.paymentDraft, id: this.editingId ?? Date.now() };
    const payments = this.editingId
      ? this.payments.map((payment) => (payment.id === this.editingId ? entry : payment))
      : [...this.payments, entry];
    this.payments = this.applySinglePrimary(payments, entry.id);
    await this.auth.updateCurrentUser({ payments: this.payments });
    this.closeModal();
  }

  async saveProfile(): Promise<void> {
    this.profileError = '';
    const email = this.profileDraft.email.trim().toLowerCase();
    const phone = this.profileDraft.phone.trim();
    if (!this.profileDraft.name.trim() || this.profileDraft.name.trim().length < 2) {
      this.profileError = 'Introduz um nome válido.';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.profileError = 'Introduz um email válido.';
      return;
    }
    if (phone && !/^(9[1236]\d{7}|2\d{8})$/.test(phone.replace(/\s/g, ''))) {
      this.profileError = 'Introduz um telefone português válido.';
      return;
    }

    await this.auth.updateCurrentUser({
      name: this.profileDraft.name.trim(),
      email,
      phone,
      diet: this.profileDraft.diet.trim(),
      allergies: this.profileDraft.allergies.trim(),
    });
    this.closeModal();
  }

  async deleteAddress(addressId: number): Promise<void> {
    this.addresses = this.ensureOnePrimary(this.addresses.filter((address) => address.id !== addressId));
    await this.auth.updateCurrentUser({ addresses: this.addresses });
  }

  async deletePayment(paymentId: number): Promise<void> {
    this.payments = this.ensureOnePrimary(this.payments.filter((payment) => payment.id !== paymentId));
    await this.auth.updateCurrentUser({ payments: this.payments });
  }

  async setPrimaryAddress(addressId: number): Promise<void> {
    this.addresses = this.addresses.map((address) => ({ ...address, principal: address.id === addressId }));
    await this.auth.updateCurrentUser({ addresses: this.addresses });
  }

  async setPrimaryPayment(paymentId: number): Promise<void> {
    this.payments = this.payments.map((payment) => ({ ...payment, principal: payment.id === paymentId }));
    await this.auth.updateCurrentUser({ payments: this.payments });
  }

  choosePhoto(input: HTMLInputElement): void {
    input.click();
  }

  async changePhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const photoUrl = await this.readFileAsDataUrl(file);
    await this.auth.updateCurrentUser({ photoUrl });
    input.value = '';
  }

  itemCount(order: Order): string {
    const count = order.items.reduce((total: number, item: OrderItem) => total + item.quantity, 0);
    return `${count} ${count === 1 ? 'item' : 'itens'}`;
  }

  formatMoney(value: number): string {
    return `${value.toFixed(2).replace('.', ',')}€`;
  }

  formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    return `${day}/${month}`;
  }

  cardLastDigits(payment: UserPayment): string {
    return payment.number.replace(/\s/g, '').slice(-4).padStart(4, '0');
  }

  private emptyAddress(): UserAddress {
    return {
      id: 0,
      label: '',
      street: '',
      number: '',
      postalCode: '',
      city: '',
      locality: '',
      principal: false,
    };
  }

  private emptyPayment(): UserPayment {
    return {
      id: 0,
      holder: '',
      number: '',
      expiry: '',
      cvv: '',
      brand: 'Mastercard',
      principal: false,
    };
  }

  private applySinglePrimary<T extends { id: number; principal?: boolean }>(items: T[], preferredId: number): T[] {
    const preferred = items.find((item) => item.id === preferredId);
    if (preferred?.principal || !items.some((item) => item.principal)) {
      return items.map((item) => ({ ...item, principal: item.id === preferredId }));
    }

    let primaryFound = false;
    return items.map((item) => {
      if (item.principal && !primaryFound) {
        primaryFound = true;
        return item;
      }
      return { ...item, principal: false };
    });
  }

  private ensureOnePrimary<T extends { principal?: boolean }>(items: T[]): T[] {
    if (!items.length) {
      return [];
    }

    const primaryIndex = Math.max(0, items.findIndex((item) => item.principal));
    return items.map((item, index) => ({ ...item, principal: index === primaryIndex }));
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
