/**
 * Auth Storage Utility
 *
 * When "Keep me logged in" is checked  → tokens go to localStorage  (persist across sessions)
 * When unchecked                       → tokens go to sessionStorage (cleared on browser close)
 *
 * A small flag in localStorage remembers which mode was chosen so
 * api.ts and AuthContext can retrieve tokens from the correct store.
 */

const REMEMBER_KEY = "rememberMe";
const TRUSTED_DEVICE_KEY = "trustedDeviceToken";
const DEVICE_ID_KEY = "deviceId";

/** Returns the storage backend that currently holds auth data. */
function getStorage(): Storage {
  // Always use localStorage to prevent logout when app is closed
  return localStorage;
}

export const authStorage = {
  /** Call once at login time to choose the storage backend. */
  setRememberMe(remember: boolean) {
    localStorage.setItem(REMEMBER_KEY, String(remember));
  },

  getRememberMe(): boolean {
    return localStorage.getItem(REMEMBER_KEY) === "true";
  },

  // ---- device helpers ----

  /** Stable device id for trusted-device MFA binding. */
  getOrCreateDeviceId(): string {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id =
      (crypto as any)?.randomUUID?.() ||
      `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  },

  // ---- trusted device (MFA) helpers ----

  setTrustedDeviceToken(token: string) {
    localStorage.setItem(TRUSTED_DEVICE_KEY, token);
  },

  getTrustedDeviceToken(): string | null {
    return localStorage.getItem(TRUSTED_DEVICE_KEY);
  },

  clearTrustedDeviceToken() {
    localStorage.removeItem(TRUSTED_DEVICE_KEY);
  },

  // ---- token helpers ----

  setTokens(accessToken: string, refreshToken: string) {
    const s = getStorage();
    s.setItem("accessToken", accessToken);
    s.setItem("refreshToken", refreshToken);
  },

  getAccessToken(): string | null {
    return getStorage().getItem("accessToken");
  },

  getRefreshToken(): string | null {
    return getStorage().getItem("refreshToken");
  },

  // ---- user helpers ----

  setUser(user: { userId: number; email: string; roles: string[] }) {
    getStorage().setItem("user", JSON.stringify(user));
  },

  getUser(): { userId: number; email: string; roles: string[] } | null {
    const raw = getStorage().getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // ---- remembered account helpers ----

  setRememberedEmail(email: string) {
    localStorage.setItem("rememberedEmail", email);
  },

  getRememberedEmail(): string | null {
    return localStorage.getItem("rememberedEmail");
  },

  clearRememberedEmail() {
    localStorage.removeItem("rememberedEmail");
  },

  // ---- cleanup ----

  /** Clear auth data from BOTH storages (safe on logout). Keeps remembered email. */
  clear() {
    for (const s of [localStorage, sessionStorage]) {
      s.removeItem("accessToken");
      s.removeItem("refreshToken");
      s.removeItem("user");
    }
    localStorage.removeItem(REMEMBER_KEY);
  },
};
