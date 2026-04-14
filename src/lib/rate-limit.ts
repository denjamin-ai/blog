const attempts = new Map<string, number[]>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const userAttempts = new Map<string, number[]>();

export function checkUserRateLimit(
  userId: string,
  windowMs: number,
  max: number,
): { blocked: boolean } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const timestamps = (userAttempts.get(userId) ?? []).filter((t) => t > cutoff);
  if (timestamps.length >= max) {
    userAttempts.set(userId, timestamps);
    return { blocked: true };
  }
  timestamps.push(now);
  userAttempts.set(userId, timestamps);
  return { blocked: false };
}

export function getClientIP(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(request: Request): { blocked: boolean } {
  const ip = getClientIP(request);
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  // Cleanup entries outside the window, prevents unbounded Map growth
  const timestamps = (attempts.get(ip) ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= MAX_ATTEMPTS) {
    attempts.set(ip, timestamps);
    return { blocked: true };
  }

  timestamps.push(now);
  attempts.set(ip, timestamps);
  return { blocked: false };
}
