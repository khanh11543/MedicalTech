/**
 * XSS sanitization utility for frontend.
 * Strips dangerous HTML/JS patterns from user input before sending to API.
 */

const XSS_PATTERNS: [RegExp, string][] = [
  // Script tags
  [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ""],
  [/<\/script>/gi, ""],
  [/<script[^>]*>/gi, ""],
  // Event handlers: onclick=, onerror=, onload=, etc.
  [/on\w+\s*=/gi, ""],
  // javascript: and vbscript: protocols
  [/javascript\s*:/gi, ""],
  [/vbscript\s*:/gi, ""],
  // eval(...)
  [/eval\s*\(/gi, ""],
  // expression(...)
  [/expression\s*\(/gi, ""],
];

/**
 * Strip known XSS patterns from a string value.
 */
export function stripXss(value: string): string {
  if (!value) return value;

  let cleaned = value.replace(/\0/g, "");

  for (const [pattern] of XSS_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  return cleaned;
}

/**
 * Recursively sanitize all string values in an object/array.
 * Used to clean request payloads before sending to API.
 */
export function sanitizeData<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    return stripXss(data) as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item)) as T;
  }

  if (typeof data === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized as T;
  }

  return data;
}
