import { Repository } from '../../domain/repositories/Repository';

/**
 * Implementación de almacenamiento local basada en localStorage (para entorno Web).
 */
export class WebStorageRepositoryImpl<T = Record<string, any>> implements Repository<T> {
  private prefix: string;

  constructor(instanceId: string) {
    this.prefix = `app-storage-${instanceId}:`;
  }

  async get(key: string): Promise<T | null> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const rawData = window.localStorage.getItem(this.prefix + key);
      if (!rawData) return null;
      return JSON.parse(rawData) as T;
    } catch (error) {
      console.error(`[WebStorageRepository] Error recuperando (${this.prefix + key}):`, error);
      return null;
    }
  }

  async set(key: string, value: T): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error(`[WebStorageRepository] Error guardando (${this.prefix + key}):`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error(`[WebStorageRepository] Error eliminando (${this.prefix + key}):`, error);
    }
  }

  async getAll(): Promise<Record<string, T>> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return {};
      const results: Record<string, T> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const rawKey = window.localStorage.key(i);
        if (rawKey && rawKey.startsWith(this.prefix)) {
          const key = rawKey.substring(this.prefix.length);
          const value = await this.get(key);
          if (value !== null) results[key] = value;
        }
      }
      return results;
    } catch (error) {
      console.error('[WebStorageRepository] Error recuperando todos:', error);
      return {};
    }
  }

  async clearAll(): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const rawKey = window.localStorage.key(i);
        if (rawKey && rawKey.startsWith(this.prefix)) {
          keysToRemove.push(rawKey);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch (error) {
      console.error('[WebStorageRepository] Error limpiando:', error);
    }
  }
}
