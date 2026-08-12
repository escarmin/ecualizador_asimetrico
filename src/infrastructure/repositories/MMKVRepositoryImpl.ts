import { MMKV } from 'react-native-mmkv';
import { Repository } from '../../domain/repositories/Repository';

/**
 * Implementación de repositorio local basada en MMKV (C++ rápida sobre JSI).
 * Permite guardar estructuras dinámicas JSON sin DTOs rígidos.
 * 
 * NOTA: Esta implementación es exclusiva del entorno nativo (Android/iOS).
 * En entorno web (Platform.OS === 'web'), usar WebStorageRepositoryImpl en su lugar.
 */
export class MMKVRepositoryImpl<T = Record<string, any>> implements Repository<T> {
  private storage: MMKV;
  private prefix: string;

  constructor(instanceId: string) {
    this.storage = new MMKV({ id: `app-storage-${instanceId}` });
    this.prefix = `${instanceId}:`;
  }

  async get(key: string): Promise<T | null> {
    try {
      const rawData = this.storage.getString(this.prefix + key);
      if (!rawData) return null;
      return JSON.parse(rawData) as T;
    } catch (error) {
      console.error(`[MMKVRepository] Error recuperando (${this.prefix + key}):`, error);
      return null;
    }
  }

  async set(key: string, value: T): Promise<void> {
    try {
      this.storage.set(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error(`[MMKVRepository] Error guardando (${this.prefix + key}):`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.storage.delete(this.prefix + key);
    } catch (error) {
      console.error(`[MMKVRepository] Error eliminando (${this.prefix + key}):`, error);
      throw error;
    }
  }

  async getAll(): Promise<Record<string, T>> {
    try {
      const results: Record<string, T> = {};
      for (const rawKey of this.storage.getAllKeys()) {
        if (rawKey.startsWith(this.prefix)) {
          const key = rawKey.substring(this.prefix.length);
          const value = await this.get(key);
          if (value !== null) results[key] = value;
        }
      }
      return results;
    } catch (error) {
      console.error('[MMKVRepository] Error recuperando todos los registros:', error);
      return {};
    }
  }

  async clearAll(): Promise<void> {
    try {
      for (const rawKey of this.storage.getAllKeys()) {
        if (rawKey.startsWith(this.prefix)) this.storage.delete(rawKey);
      }
    } catch (error) {
      console.error('[MMKVRepository] Error limpiando almacenamiento:', error);
      throw error;
    }
  }
}
