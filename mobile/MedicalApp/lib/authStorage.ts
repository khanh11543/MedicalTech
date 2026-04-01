import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS = 'accessToken';
const REFRESH = 'refreshToken';
const USER = 'user';
const REMEMBERED_EMAIL = 'rememberedEmail';
const DEVICE_ID = 'deviceId';
const TRUSTED_DEVICE = 'trustedDeviceToken';
const PENDING_MFA = 'pendingMfa';

export type StoredUser = { userId: number; email: string; roles: string[] };

export type PendingMfa = { email: string; mfaToken: string; rememberMe: boolean };

function randomDeviceId(): string {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

const isWeb = Platform.OS === 'web';
/** Fallback when native AsyncStorage TurboModule is null (Expo Go / dev client mismatch) or throws. */
const memory = new Map<string, string>();
let useMemoryOnly = false;

async function storageGet(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
    } catch {
      /* private mode */
    }
    return memory.get(key) ?? null;
  }

  if (useMemoryOnly) return memory.get(key) ?? null;

  try {
    return await AsyncStorage.getItem(key);
  } catch {
    useMemoryOnly = true;
    return memory.get(key) ?? null;
  }
}

async function storageSet(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
    } catch {
      /* quota */
    }
    memory.set(key, value);
    return;
  }

  if (useMemoryOnly) {
    memory.set(key, value);
    return;
  }

  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    useMemoryOnly = true;
    memory.set(key, value);
  }
}

async function storageRemove(key: string): Promise<void> {
  memory.delete(key);

  if (isWeb) {
    try {
      localStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }

  if (useMemoryOnly) return;

  try {
    await AsyncStorage.removeItem(key);
  } catch {
    useMemoryOnly = true;
  }
}

export const authStorage = {
  async getAccessToken(): Promise<string | null> {
    return storageGet(ACCESS);
  },

  async getRefreshToken(): Promise<string | null> {
    return storageGet(REFRESH);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await storageSet(ACCESS, accessToken);
    await storageSet(REFRESH, refreshToken);
  },

  async setUser(user: StoredUser): Promise<void> {
    await storageSet(USER, JSON.stringify(user));
  },

  async getUser(): Promise<StoredUser | null> {
    const raw = await storageGet(USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  },

  async clearSession(): Promise<void> {
    await storageRemove(ACCESS);
    await storageRemove(REFRESH);
    await storageRemove(USER);
  },

  async setRememberedEmail(email: string): Promise<void> {
    await storageSet(REMEMBERED_EMAIL, email);
  },

  async getRememberedEmail(): Promise<string | null> {
    return storageGet(REMEMBERED_EMAIL);
  },

  async clearRememberedEmail(): Promise<void> {
    await storageRemove(REMEMBERED_EMAIL);
  },

  async getOrCreateDeviceId(): Promise<string> {
    const existing = await storageGet(DEVICE_ID);
    if (existing) return existing;
    const id = randomDeviceId();
    await storageSet(DEVICE_ID, id);
    return id;
  },

  async getTrustedDeviceToken(): Promise<string | null> {
    return storageGet(TRUSTED_DEVICE);
  },

  async setTrustedDeviceToken(token: string): Promise<void> {
    await storageSet(TRUSTED_DEVICE, token);
  },

  async clearTrustedDeviceToken(): Promise<void> {
    await storageRemove(TRUSTED_DEVICE);
  },

  async setPendingMfa(data: PendingMfa): Promise<void> {
    await storageSet(PENDING_MFA, JSON.stringify(data));
  },

  async getPendingMfa(): Promise<PendingMfa | null> {
    const raw = await storageGet(PENDING_MFA);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PendingMfa;
    } catch {
      return null;
    }
  },

  async clearPendingMfa(): Promise<void> {
    await storageRemove(PENDING_MFA);
  },
};
