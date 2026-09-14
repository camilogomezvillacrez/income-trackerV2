import webpush from "web-push";
import { getDb } from "./db";

export interface PushPayload {
  title: string;
  body: string;
  /** Pantalla que abre la app al tocar la notificación. */
  url?: string;
  /** Notificaciones con el mismo tag se reemplazan en vez de apilarse. */
  tag?: string;
}

let configured = false;

function configure() {
  if (configured) return true;
  const publicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "https://example.com", publicKey, privateKey);
  configured = true;
  return true;
}

/**
 * Envía a todos los dispositivos del usuario. Nunca lanza: una notificación
 * fallida no debe tumbar el registro del gasto. Devuelve cuántas se entregaron.
 */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<number> {
  if (!configure()) return 0;

  const db = getDb();
  let subs;
  try {
    subs = await db.execute(
      "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id=?",
      [userId]
    );
  } catch {
    return 0;
  }

  const results = await Promise.allSettled(
    subs.rows.map((r) =>
      webpush.sendNotification(
        { endpoint: String(r.endpoint), keys: { p256dh: String(r.p256dh), auth: String(r.auth) } },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 24, timeout: 5000 }
      )
    )
  );

  // 404/410: el dispositivo quitó el permiso o desinstaló la app → se limpia
  const gone = results
    .map((r, i) => (r.status === "rejected" && [404, 410].includes((r.reason as { statusCode?: number })?.statusCode ?? 0)
      ? String(subs.rows[i].endpoint) : null))
    .filter((e): e is string => !!e);
  if (gone.length) {
    await db.execute(
      `DELETE FROM push_subscriptions WHERE endpoint IN (${gone.map(() => "?").join(",")})`,
      gone
    ).catch(() => {});
  }

  return results.filter((r) => r.status === "fulfilled").length;
}
