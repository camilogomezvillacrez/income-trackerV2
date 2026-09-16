/*
 * Rate limiter en memoria.
 * Funciona per-instance en Vercel (serverless): cada instancia tiene su propio
 * contador, así que el límite real puede ser N veces el configurado si Vercel
 * levanta varias. Para una app personal (2-3 usuarios) es suficiente; si algún
 * día hace falta un límite exacto, toca Redis/Upstash.
 */

interface Bucket {
  count: number;
  resetAt: number;
  blockedUntil: number;
}

const store = new Map<string, Bucket>();

/** Tope de entradas en memoria: al pasarse se purgan las ventanas ya vencidas. */
const MAX_ENTRIES = 5000;

export interface LimitRule {
  /** Nombre del límite; separa contadores de rutas distintas. */
  name: string;
  /** Máximo de peticiones permitidas dentro de la ventana. */
  max: number;
  /** Duración de la ventana en ms. */
  windowMs: number;
  /** Bloqueo extra al superar el máximo. Por defecto, hasta que cierre la ventana. */
  blockMs?: number;
}

export interface LimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

function prune(now: number) {
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt && bucket.blockedUntil <= now) store.delete(key);
  }
}

/**
 * Cuenta una petición de `subject` (userId, IP, token…) contra la regla dada.
 * Devuelve `allowed: false` con el tiempo de espera cuando ya se pasó del tope.
 */
export function checkLimit(rule: LimitRule, subject: string): LimitResult {
  const now = Date.now();
  const key = `${rule.name}:${subject}`;
  let bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + rule.windowMs, blockedUntil: 0 };
  }

  if (bucket.blockedUntil > now) {
    return { allowed: false, retryAfterMs: bucket.blockedUntil - now };
  }

  bucket.count++;

  if (bucket.count > rule.max) {
    bucket.blockedUntil = now + (rule.blockMs ?? bucket.resetAt - now);
    store.set(key, bucket);
    return { allowed: false, retryAfterMs: bucket.blockedUntil - now };
  }

  if (store.size >= MAX_ENTRIES) prune(now);
  store.set(key, bucket);
  return { allowed: true };
}

export function resetLimit(rule: LimitRule, subject: string) {
  store.delete(`${rule.name}:${subject}`);
}

// ── Reglas ────────────────────────────────────────────────────

/** Login: 10 intentos por IP cada 15 min, con bloqueo de 30 min. */
export const LOGIN_LIMIT: LimitRule = {
  name: "login",
  max: 10,
  windowMs: 15 * 60 * 1000,
  blockMs: 30 * 60 * 1000,
};

/** Chat con Claude: 20 mensajes por usuario a la hora. */
export const AI_CHAT_LIMIT: LimitRule = {
  name: "ai-chat",
  max: 20,
  windowMs: 60 * 60 * 1000,
};

/** Recomendaciones del dashboard: se piden solas al abrir, 10 por hora sobra. */
export const AI_RECS_LIMIT: LimitRule = {
  name: "ai-recs",
  max: 10,
  windowMs: 60 * 60 * 1000,
};

/** Atajo de Apple Pay: 40 gastos por hora y token (solo algunos llaman a Claude). */
export const SHORTCUT_LIMIT: LimitRule = {
  name: "shortcut-expense",
  max: 40,
  windowMs: 60 * 60 * 1000,
};

/*
 * Tope por IP para el atajo, aplicado ANTES de buscar el token en Turso:
 * un token inválido no debe costar una lectura de la base por intento.
 * Holgado a propósito, que el iPhone puede cambiar de IP.
 */
export const SHORTCUT_IP_LIMIT: LimitRule = {
  name: "shortcut-ip",
  max: 60,
  windowMs: 60 * 60 * 1000,
};

/** IP del cliente detrás del proxy de Vercel. */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
