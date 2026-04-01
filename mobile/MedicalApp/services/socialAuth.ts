import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { getApiBaseUrl } from '@/constants/api';

export type OAuthTokenPayload = {
  accessToken: string;
  refreshToken: string;
  userId: number;
  email: string;
  roles: string[];
};

/** Must match a route the app can open; backend only allows medicalapp:// and exp:// schemes. */
export function getOAuthReturnUrl(): string {
  return Linking.createURL('/oauth');
}

export function parseOAuthCallbackUrl(url: string): OAuthTokenPayload | null {
  try {
    const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : '';
    if (!query) return null;
    const params = new URLSearchParams(query);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userId = params.get('userId');
    const email = params.get('email');
    const roles = params.get('roles');
    if (!accessToken || !refreshToken || !userId || !email || roles === null) return null;
    const uid = parseInt(userId, 10);
    if (!Number.isFinite(uid)) return null;
    return {
      accessToken,
      refreshToken,
      userId: uid,
      email,
      roles: roles ? roles.split(',').map((r) => r.trim()).filter(Boolean) : [],
    };
  } catch {
    return null;
  }
}

async function openOAuthSession(loginUrl: string, returnUrl: string): Promise<OAuthTokenPayload | null> {
  WebBrowser.maybeCompleteAuthSession();
  const result = await WebBrowser.openAuthSessionAsync(loginUrl, returnUrl);
  if (result.type !== 'success') return null;
  const url = 'url' in result && typeof result.url === 'string' ? result.url : null;
  if (!url) return null;
  return parseOAuthCallbackUrl(url);
}

export async function signInWithGoogleMobile(): Promise<OAuthTokenPayload | null> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) return null;
  const returnUrl = getOAuthReturnUrl();
  const loginUrl = `${apiBase}/auth/google/login?redirect_uri=${encodeURIComponent(returnUrl)}`;
  return openOAuthSession(loginUrl, returnUrl);
}

export async function signInWithFacebookMobile(): Promise<OAuthTokenPayload | null> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) return null;
  const returnUrl = getOAuthReturnUrl();
  const loginUrl = `${apiBase}/auth/facebook/login?redirect_uri=${encodeURIComponent(returnUrl)}`;
  return openOAuthSession(loginUrl, returnUrl);
}
