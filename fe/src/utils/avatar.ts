const API_BASE = "http://localhost:8080/api";

/**
 * Resolves avatar URL to a full absolute URL.
 * Handles relative paths from backend by prepending API_BASE.
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http")) return avatarUrl;
  return `${API_BASE}${avatarUrl}`;
}
