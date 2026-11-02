import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService } from './storageService';

const CURRENT_ACCOUNT_KEY = 'current_account_email';

let cachedAccount: string | null | undefined;

function normalizeEmail(email?: string | null): string {
  return (email || '').trim().toLowerCase();
}

/** Stable per-account id derived from Google email (auth identity). */
export function toAccountId(email?: string | null): string {
  const normalized = normalizeEmail(email);
  if (!normalized) return 'guest';
  return normalized.replace(/[^a-z0-9]/g, '_');
}

export async function setCurrentAccount(email?: string | null): Promise<string> {
  const normalized = normalizeEmail(email);
  cachedAccount = normalized || null;
  try {
    if (normalized) {
      await AsyncStorage.setItem('@hfinmate:' + CURRENT_ACCOUNT_KEY, normalized);
    } else {
      await AsyncStorage.removeItem('@hfinmate:' + CURRENT_ACCOUNT_KEY);
    }
  } catch {
    // ignore persistence failure
  }
  return toAccountId(normalized);
}

export async function getCurrentAccountEmail(): Promise<string | null> {
  if (cachedAccount !== undefined) return cachedAccount;
  try {
    const stored = await AsyncStorage.getItem('@hfinmate:' + CURRENT_ACCOUNT_KEY);
    cachedAccount = stored ? normalizeEmail(stored) : null;
    return cachedAccount;
  } catch {
    return null;
  }
}

export function getCachedAccountId(): string {
  if (cachedAccount === undefined) return 'guest';
  return toAccountId(cachedAccount);
}

/** Prefix any local cache key with the auth account so data is referenced by account. */
export function scopedKey(baseKey: string, accountEmail?: string | null): string {
  const accountId =
    accountEmail !== undefined ? toAccountId(accountEmail) : getCachedAccountId();
  return `acc_${accountId}__${baseKey}`;
}

export async function getScopedItem<T>(baseKey: string): Promise<T | null> {
  const email = await getCurrentAccountEmail();
  return storageService.getItem<T>(scopedKey(baseKey, email));
}

export async function setScopedItem<T>(baseKey: string, value: T): Promise<void> {
  const email = await getCurrentAccountEmail();
  await storageService.setItem(scopedKey(baseKey, email), value);
}

export async function removeScopedItem(baseKey: string): Promise<void> {
  const email = await getCurrentAccountEmail();
  await storageService.removeItem(scopedKey(baseKey, email));
}

/**
 * One-time migration: copy legacy global key to the current account scope
 * so existing on-device data is not lost when switching to per-account keys.
 */
export async function migrateLegacyKey<T>(baseKey: string): Promise<T | null> {
  const email = await getCurrentAccountEmail();
  const sKey = scopedKey(baseKey, email);
  const scoped = await storageService.getItem<T>(sKey);
  if (scoped !== null && scoped !== undefined) return scoped;
  const legacy = await storageService.getItem<T>(baseKey);
  if (legacy !== null && legacy !== undefined) {
    await storageService.setItem(sKey, legacy);
    return legacy;
  }
  return null;
}
