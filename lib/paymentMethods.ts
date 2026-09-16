import type { Client, Row } from "@libsql/client";
import { getDb } from "./db";
import { DEFAULT_PAYMENT_METHODS, defaultShort, inferPaymentMeta } from "@/constants/payments";
import type { PaymentKind, PaymentMethod } from "@/types";

export const PAYMENT_SELECT =
  "SELECT id, name, emoji, short, kind, last4, position FROM payment_methods WHERE user_id=? ORDER BY position, id";

const KINDS: PaymentKind[] = ["efectivo", "debito", "credito", "otro"];

export function rowToPayment(r: Row): PaymentMethod {
  const kind = String(r.kind ?? "otro") as PaymentKind;
  return {
    id: Number(r.id),
    name: String(r.name),
    emoji: String(r.emoji ?? "💳"),
    short: String(r.short || r.name),
    kind: KINDS.includes(kind) ? kind : "otro",
    last4: r.last4 ? String(r.last4) : null,
    position: Number(r.position),
  };
}

/**
 * Primera vez de cada usuario: los medios por defecto más cualquier nombre que
 * ya aparezca en sus gastos o gastos fijos (p. ej. "Nu Crédito" de antes de
 * esta pantalla), para que ningún movimiento quede con un medio inexistente.
 */
export async function seedPaymentMethods(db: Client, userId: number) {
  const used = await db.execute(
    `SELECT DISTINCT payment_method AS name FROM expenses WHERE user_id=? AND payment_method IS NOT NULL
     UNION SELECT DISTINCT payment_method FROM fixed_expenses WHERE user_id=? AND payment_method IS NOT NULL`,
    [userId, userId]
  );

  const all: Omit<PaymentMethod, "id">[] = [...DEFAULT_PAYMENT_METHODS];
  for (const r of used.rows) {
    const name = String(r.name ?? "").trim().slice(0, 40);
    if (!name || all.some((m) => m.name.toLowerCase() === name.toLowerCase())) continue;
    const { kind, emoji } = inferPaymentMeta(name);
    all.push({ name, emoji, short: defaultShort(name), kind, last4: null, position: all.length });
  }

  const now = new Date().toISOString();
  await db.batch(
    all.map((m) => ({
      sql: `INSERT OR IGNORE INTO payment_methods (user_id, name, emoji, short, kind, last4, position, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, m.name, m.emoji, m.short, m.kind, m.last4, m.position, now],
    })),
    "write"
  );
}

/** Medios del usuario (los siembra si todavía no tiene). */
export async function getPaymentMethods(userId: number): Promise<PaymentMethod[]> {
  const db = getDb();
  let res = await db.execute(PAYMENT_SELECT, [userId]);
  if (res.rows.length === 0) {
    await seedPaymentMethods(db, userId);
    res = await db.execute(PAYMENT_SELECT, [userId]);
  }
  return res.rows.map(rowToPayment);
}

export interface PaymentInput {
  name: string;
  emoji: string;
  short: string;
  kind: PaymentKind;
  last4: string | null;
}

/** Valida el cuerpo de crear/editar. Devuelve el mensaje de error si algo no cuadra. */
export function validatePaymentInput(body: unknown): PaymentInput | string {
  const b = (body ?? {}) as Record<string, unknown>;

  const name = String(b.name ?? "").trim();
  if (!name || name.length > 40) return "El nombre debe tener entre 1 y 40 caracteres";

  const emoji = String(b.emoji ?? "").trim().slice(0, 16) || inferPaymentMeta(name).emoji;

  const short = String(b.short ?? "").trim().slice(0, 14) || defaultShort(name);

  const rawKind = String(b.kind ?? "");
  const kind = (KINDS.includes(rawKind as PaymentKind) ? rawKind : inferPaymentMeta(name).kind) as PaymentKind;

  // Los dígitos son opcionales: vacío es válido y se guarda como NULL.
  const rawLast4 = String(b.last4 ?? "").trim();
  if (rawLast4 && !/^\d{4}$/.test(rawLast4)) return "Los últimos dígitos deben ser 4 números (o déjalo vacío)";

  return { name, emoji, short, kind, last4: rawLast4 || null };
}

/**
 * Apple Pay manda el nombre del pase tal cual ("Visa ••••4821", "Nu Crédito").
 * Se empareja con un medio del usuario por los últimos 4 dígitos y, si no,
 * por nombre; si no coincide con nada se deja el texto original para no
 * inventar un medio que el usuario no configuró.
 */
export function matchPaymentMethod(card: string, methods: PaymentMethod[]): string | null {
  const raw = card.trim();
  if (!raw) return null;

  const digits = raw.match(/(\d{4})(?!.*\d)/)?.[1];
  if (digits) {
    const byDigits = methods.find((m) => m.last4 === digits);
    if (byDigits) return byDigits.name;
  }

  const n = raw.toLowerCase();
  // "Visa ••••4821" → "visa": sin los dígitos ni los puntos queda el nombre a comparar
  const plain = n.replace(/[^a-záéíóúñ ]+/gi, " ").replace(/\s+/g, " ").trim();
  const byName = methods.find((m) => {
    const name = m.name.toLowerCase();
    return name === n || n.includes(name) || (plain.length >= 3 && name.includes(plain));
  });
  return byName ? byName.name : raw;
}
