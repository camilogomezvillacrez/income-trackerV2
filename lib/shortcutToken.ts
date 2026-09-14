import { createHash, randomBytes } from "node:crypto";

/** Token del atajo: se muestra una sola vez; en la base solo queda su hash. */
export function generateShortcutToken() {
  const token = `fin_${randomBytes(24).toString("base64url")}`;
  return { token, hash: hashShortcutToken(token) };
}

export function hashShortcutToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
