// In-memory rate limiter (per serverless instance)
const store = new Map<string, { count: number; resetAt: number }>();

const MAX_REQUESTS = 30;
const WINDOW_MS = 60 * 1000; // 1 minute

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}
