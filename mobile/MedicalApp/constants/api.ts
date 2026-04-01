import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const BACKEND_PORT = 8080;

function normalizeBase(url: string): string {
  return url.trim().replace(/\/$/, '');
}

/** Tunnel hosts cannot reach your PC’s :8080; need EXPO_PUBLIC_API_BASE_URL or LAN mode. */
function isTunnelHost(host: string): boolean {
  return /\.exp\.direct$/i.test(host) || /\.e2b\.app$/i.test(host);
}

/**
 * Same machine as Metro → same host for Spring Boot.
 * Uses the bundle URL (reliable on a real phone over LAN); falls back to expoConfig.hostUri.
 */
function devMachineHostForApi(): string | null {
  const scriptURL = (NativeModules.SourceCode as { scriptURL?: string } | undefined)?.scriptURL;
  if (typeof scriptURL === 'string') {
    const m = scriptURL.match(/https?:\/\/([^/:?#]+)/i);
    const host = m?.[1]?.trim();
    if (host && !isTunnelHost(host)) {
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
        return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
      }
      return host;
    }
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (typeof hostUri === 'string') {
    const host = hostUri.split(':')[0]?.trim();
    if (host && !isTunnelHost(host)) {
      if (host === 'localhost' || host === '127.0.0.1') {
        return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
      }
      return host;
    }
  }

  return null;
}

function unreachableOnPhysicalDevice(url: string): boolean {
  return /localhost|127\.0\.0\.1|10\.0\.2\.2/i.test(url);
}

/**
 * Base URL including `/api` (same as web `VITE_API_BASE_URL`).
 *
 * **Same LAN as the dev PC** (same Wi‑Fi, no tunnel): the host is usually inferred from the Metro bundle URL.
 *
 * **Different network** (cellular, other Wi‑Fi, isolated VLAN): the phone cannot reach the PC’s LAN IP —
 * you must set `EXPO_PUBLIC_API_BASE_URL` to something the device can actually open, e.g. the PC’s
 * Tailscale/ZeroTier IP, an ngrok/cloudflared URL to :8080, or a staging/production server.
 *
 * Priority: env → infer from Metro (LAN only) → `extra.apiBaseUrl`. Tunnel mode usually needs env.
 */
export function getApiBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (env) return normalizeBase(env);

  const devHost = devMachineHostForApi();
  if (devHost) {
    return `http://${devHost}:${BACKEND_PORT}/api`;
  }

  const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;
  const fromExtra = extra?.apiBaseUrl?.trim();
  if (fromExtra && !unreachableOnPhysicalDevice(fromExtra)) {
    return normalizeBase(fromExtra);
  }

  if (Constants.isDevice) {
    return '';
  }

  if (fromExtra) return normalizeBase(fromExtra);

  return Platform.OS === 'android'
    ? `http://10.0.2.2:${BACKEND_PORT}/api`
    : `http://localhost:${BACKEND_PORT}/api`;
}

/** Turn `/avatars/...` or `/uploads/...` into full URL for `<Image source={{ uri }} />`. */
export function resolveBackendAbsoluteUrl(path: string | null | undefined): string | undefined {
  if (!path?.trim()) return undefined;
  const p = path.trim();
  if (/^https?:\/\//i.test(p)) return p;
  const base = getApiBaseUrl();
  if (!base) return undefined;
  const root = base.replace(/\/api\/?$/, '');
  return `${root}${p.startsWith('/') ? p : `/${p}`}`;
}
