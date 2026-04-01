import { getApiBaseUrl } from '@/constants/api';
import { authStorage } from '@/lib/authStorage';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type FetchOptions = RequestInit & { skipAuth?: boolean };

function readMessage(data: unknown): string {
  if (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string') {
    return (data as { message: string }).message;
  }
  return 'Request failed';
}

const DEVICE_API_HINT =
  'If the phone is not on the same network as your PC (e.g. cellular or different Wi‑Fi), set EXPO_PUBLIC_API_BASE_URL to a reachable host (Tailscale IP, ngrok, or staging). Same Wi‑Fi as the dev machine often works without .env; Expo tunnel still needs a URL the device can reach. Open port 8080 for LAN testing.';

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, ...init } = options;
  const base = getApiBaseUrl();
  if (!base) {
    throw new ApiError(`API base URL is not configured. ${DEVICE_API_HINT}`, 0);
  }
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (init.body && typeof init.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = await authStorage.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    if (/network request failed|failed to fetch|aborted/i.test(raw)) {
      throw new ApiError(`Could not reach the server (${url}). ${DEVICE_API_HINT}`, 0);
    }
    throw e;
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    throw new ApiError(readMessage(data), res.status);
  }

  return data as T;
}
