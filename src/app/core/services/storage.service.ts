import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

/**
 * Encapsula o Ionic Storage para manter carrinho, pontos e encomendas
 * persistentes entre sessões da aplicação.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private ready: Promise<Storage>;

  constructor(private storage: Storage) {
    this.ready = this.storage.create();
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    const store = await this.ready;
    const value = await store.get(key);
    if (value !== null && value !== undefined) {
      return value;
    }

    const localValue = this.getLocal<T>(key);
    return localValue ?? fallback;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const store = await this.ready;
    await store.set(key, value);
    this.setLocal(key, value);
  }

  async remove(key: string): Promise<void> {
    const store = await this.ready;
    await store.remove(key);
    localStorage.removeItem(key);
  }

  getLocalValue<T>(key: string): T | null {
    return this.getLocal<T>(key);
  }

  localKeysWithPrefix(prefix: string): string[] {
    return Object.keys(localStorage).filter((key) => key.startsWith(prefix));
  }

  private getLocal<T>(key: string): T | null {
    const value = localStorage.getItem(key);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  private setLocal<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
