/** Backend API base (with context-path /api). Use for all upload paths so images work for any user/session. */
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/$/, "");

/**
 * Resolves avatar or any upload path to a full absolute URL.
 * Backend serves uploads at /api/uploads/** (avatars, reviews, documents).
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http")) return avatarUrl;
  const path = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
  return `${API_BASE}${path}`;
}

/**
 * Same as getAvatarUrl — use for any upload (review images, documents).
 * Ensures one place for image URLs so they load for all users.
 */
export function getUploadUrl(path: string | null | undefined): string | null {
  return getAvatarUrl(path);
}
