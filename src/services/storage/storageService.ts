import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Type-safe storage wrapper around AsyncStorage
 */
class StorageService {
  private prefix = '@hfinmate:';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(this.getKey(key), jsonValue);
    } catch (error) {
      console.error(`[StorageService] Failed to set item ${key}:`, error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(this.getKey(key));
      return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
    } catch (error) {
      console.error(`[StorageService] Failed to get item ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`[StorageService] Failed to remove item ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter((k) => k.startsWith(this.prefix));
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error('[StorageService] Failed to clear app storage:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
