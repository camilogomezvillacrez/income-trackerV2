/*
 * Rate limiter en memoria por IP.
 * Funciona per-instance en Vercel (serverless). Para multi-instancia
 * se necesitaría Redis/Upstash, pero para una app personal esto es suficiente:
 * cada instancia tiene su propio contador y bcrypt ya añade ~100ms por intento.
 */

interface Bucket {
  count: number;
  resetAt: number;
  blockedUntil: number;
}

const store = new Map<string, Bucket>();

const WINDOW_MS    = 15 * 60 * 1000; // ventana de 15 minutos
const MAX_ATTEMPTS = 10;              // máx intentos por ventana
const BLOCK_MS     = 30 * 60 * 1000; // bloqueo de 30 min si se supera

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  let bucket = store.get(ip);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS, blockedUntil: 0 };
  }

  if (bucket.blockedUntil > now) {
    return { allowed: false, retryAfterMs: bucket.blockedUntil - now };
  }

  bucket.count++;

  if (bucket.count > MAX_ATTEMPTS) {
    bucket.blockedUntil = now + BLOCK_MS;
    store.set(ip, bucket);
    return { allowed: false, retryAfterMs: BLOCK_MS };
  }

  store.set(ip, bucket);
  return { allowed: true };
}

export function resetRateLimit(ip: string) {
  store.delete(ip);
}
