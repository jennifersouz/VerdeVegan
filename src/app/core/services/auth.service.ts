import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { SupabaseService } from './supabase.service';

export interface UserAddress {
  id: number;
  label: string;
  street: string;
  number: string;
  postalCode: string;
  city: string;
  locality: string;
  principal?: boolean;
}

export interface UserPayment {
  id: number;
  holder: string;
  number: string;
  expiry: string;
  cvv: string;
  brand: 'Mastercard' | 'Visa';
  principal?: boolean;
}

export interface UserAccount {
  name: string;
  email: string;
  phone: string;
  password: string;
  diet: string;
  allergies: string;
  photoUrl: string;
  addresses: UserAddress[];
  payments: UserPayment[];
}

const ACCOUNTS_KEY = 'verdevegan.accounts';
const CURRENT_EMAIL_KEY = 'verdevegan.currentUserEmail';
const LEGACY_DEFAULT_EMAIL = 'ines@verdevegan.pt';
const DEFAULT_EMAIL = 'inesmpmarinho@gmail.com';

const defaultAccount: UserAccount = {
  name: 'Inês Marinho',
  email: DEFAULT_EMAIL,
  phone: '912 345 678',
  password: 'verdevegan',
  diet: 'Vegan',
  allergies: '',
  photoUrl: 'assets/profile-photo.jpg',
  addresses: [
    {
      id: 1,
      label: 'Casa',
      street: 'Rua de Santa Catarina',
      number: '852',
      postalCode: '4000-443',
      city: 'Porto',
      locality: 'Porto',
      principal: true,
    },
    {
      id: 2,
      label: 'Trabalho',
      street: 'R. Manuel Pinto de Azevedo',
      number: '626',
      postalCode: '4100-320',
      city: 'Porto',
      locality: 'Porto',
      principal: false,
    },
  ],
  payments: [
    { id: 1, holder: 'Inês Marinho', number: '5123456789011234', expiry: '08/2028', cvv: '123', brand: 'Mastercard', principal: true },
    { id: 2, holder: 'Inês Marinho', number: '4123456789011443', expiry: '12/2029', cvv: '456', brand: 'Visa', principal: false },
  ],
};

/** Estado simples de autenticação para adaptar a ação da sidebar. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedInSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<UserAccount | null>(null);
  private profileRealtimeUnsubscribe: (() => void) | null = null;
  private profileRealtimeEmail = '';
  readonly loggedIn$ = this.loggedInSubject.asObservable();
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private storage: StorageService,
    private supabase: SupabaseService,
  ) {
    void this.loadSession();
    this.supabase.onAuthStateChange(() => {
      void this.loadSupabaseSession();
    });
  }

  get isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }

  get currentUser(): UserAccount | null {
    return this.currentUserSubject.value;
  }

  async login(email = DEFAULT_EMAIL, password = ''): Promise<'success' | 'missing' | 'invalid-password'> {
    const normalizedEmail = this.normalizeEmail(email);
    const remoteAccount = await this.supabase.signIn(normalizedEmail, password);
    if (remoteAccount) {
      await this.storage.set(ACCOUNTS_KEY, [remoteAccount, ...(await this.getAccounts()).filter((item) => item.email !== remoteAccount.email)]);
      await this.setCurrentUser(remoteAccount);
      return 'success';
    }

    const accounts = await this.getAccounts();
    const account = accounts.find((item) => item.email === normalizedEmail);
    if (!account) {
      return 'missing';
    }
    if ((account.password ?? 'verdevegan') !== password) {
      return 'invalid-password';
    }
    await this.setCurrentUser(account);
    return 'success';
  }

  async register(account: Pick<UserAccount, 'name' | 'email' | 'password' | 'diet' | 'allergies'>): Promise<UserAccount> {
    const accounts = await this.getAccounts();
    const normalizedEmail = this.normalizeEmail(account.email);
    const remoteAccount = await this.supabase.signUp({ ...account, email: normalizedEmail });
    if (remoteAccount) {
      await this.storage.set(ACCOUNTS_KEY, [remoteAccount, ...accounts.filter((item) => item.email !== normalizedEmail)]);
      await this.setCurrentUser(remoteAccount);
      return remoteAccount;
    }

    const newAccount: UserAccount = {
      name: account.name.trim(),
      email: normalizedEmail,
      phone: '',
      password: account.password,
      diet: account.diet,
      allergies: account.allergies?.trim() ?? '',
      photoUrl: '',
      addresses: [],
      payments: [],
    };
    const nextAccounts = [newAccount, ...accounts.filter((item) => item.email !== normalizedEmail)];
    await this.storage.set(ACCOUNTS_KEY, nextAccounts);
    await this.setCurrentUser(newAccount);
    return newAccount;
  }

  async recoverPassword(email: string): Promise<boolean> {
    return this.supabase.resetPassword(this.normalizeEmail(email));
  }

  async updateCurrentUser(update: Partial<UserAccount>): Promise<void> {
    const current = this.currentUserSubject.value;
    if (!current) {
      return;
    }
    const nextEmail = update.email ? this.normalizeEmail(update.email) : current.email;
    const updated = { ...current, ...update, email: nextEmail };
    const remoteUpdated = await this.supabase.updateCurrentAccount(updated);
    const accounts = await this.getAccounts();
    const accountToStore = remoteUpdated ?? updated;
    await this.storage.set(
      ACCOUNTS_KEY,
      accounts
        .filter((account) => account.email === current.email || account.email !== nextEmail)
        .map((account) => (account.email === current.email ? accountToStore : account)),
    );
    if (nextEmail !== current.email) {
      await this.storage.set(CURRENT_EMAIL_KEY, nextEmail);
    }
    this.currentUserSubject.next(accountToStore);
  }

  logout(): void {
    this.stopProfileRealtime();
    void this.supabase.signOut();
    void this.storage.remove(CURRENT_EMAIL_KEY);
    this.currentUserSubject.next(null);
    this.loggedInSubject.next(false);
  }

  private async loadSession(): Promise<void> {
    if (await this.loadSupabaseSession()) {
      return;
    }

    const accounts = await this.getAccounts();
    if (!accounts.length) {
      await this.storage.set(ACCOUNTS_KEY, [defaultAccount]);
    }
    const storedEmail = await this.storage.get<string | null>(CURRENT_EMAIL_KEY, null);
    const email = storedEmail === LEGACY_DEFAULT_EMAIL ? DEFAULT_EMAIL : storedEmail;
    if (storedEmail === LEGACY_DEFAULT_EMAIL) {
      await this.storage.set(CURRENT_EMAIL_KEY, DEFAULT_EMAIL);
    }
    const account = email ? (await this.getAccounts()).find((item) => item.email === email) : undefined;
    if (account) {
      this.currentUserSubject.next(account);
      this.loggedInSubject.next(true);
    }
  }

  private async loadSupabaseSession(): Promise<boolean> {
    const remoteAccount = await this.supabase.getCurrentAccount();
    if (!remoteAccount) {
      return false;
    }

    await this.storage.set(ACCOUNTS_KEY, [remoteAccount, ...(await this.getAccounts()).filter((item) => item.email !== remoteAccount.email)]);
    await this.storage.set(CURRENT_EMAIL_KEY, remoteAccount.email);
    this.currentUserSubject.next(remoteAccount);
    this.loggedInSubject.next(true);
    void this.startProfileRealtime(remoteAccount.email);
    return true;
  }

  private async getAccounts(): Promise<UserAccount[]> {
    const stored = await this.storage.get<UserAccount[]>(ACCOUNTS_KEY, []);
    const migratedStored = stored.map((account) => ({
      ...account,
      email: account.email === LEGACY_DEFAULT_EMAIL ? DEFAULT_EMAIL : account.email,
    }));
    const uniqueAccounts = Array.from(new Map(migratedStored.map((account) => [account.email, account])).values());
    const hasDefault = uniqueAccounts.some((account) => account.email === DEFAULT_EMAIL);
    const accounts = hasDefault ? uniqueAccounts : [defaultAccount, ...uniqueAccounts];
    return accounts.map((account) => ({
      ...account,
      password: account.password ?? 'verdevegan',
      phone: account.phone ?? '',
      addresses: this.normalizePrimary(account.addresses ?? []),
      payments: this.normalizePrimary(account.payments ?? []),
    }));
  }

  private normalizePrimary<T extends { principal?: boolean }>(items: T[]): T[] {
    if (!items.length) {
      return [];
    }

    const primaryIndex = Math.max(0, items.findIndex((item) => item.principal));
    return items.map((item, index) => ({ ...item, principal: index === primaryIndex }));
  }

  private async setCurrentUser(account: UserAccount): Promise<void> {
    await this.storage.set(CURRENT_EMAIL_KEY, account.email);
    this.currentUserSubject.next(account);
    this.loggedInSubject.next(true);
    void this.startProfileRealtime(account.email);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async startProfileRealtime(email: string): Promise<void> {
    if (!this.supabase.enabled || this.profileRealtimeEmail === email) {
      return;
    }

    this.stopProfileRealtime();
    this.profileRealtimeEmail = email;
    this.profileRealtimeUnsubscribe = await this.supabase.subscribeToCurrentUserProfile(() => {
      void this.loadSupabaseSession();
    });
  }

  private stopProfileRealtime(): void {
    this.profileRealtimeUnsubscribe?.();
    this.profileRealtimeUnsubscribe = null;
    this.profileRealtimeEmail = '';
  }
}
