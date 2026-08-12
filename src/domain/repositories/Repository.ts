/**
 * Interfaz genérica para repositorios de datos locales.
 * Sigue los principios de Clean Architecture desacoplando la lógica de dominio
 * de cualquier librería de persistencia específica (ej. MMKV, SQLite, localStorage).
 */
export interface Repository<T = Record<string, any>> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  getAll(): Promise<Record<string, T>>;
  clearAll(): Promise<void>;
}
