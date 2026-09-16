import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { getAuthUser, getSession, unauthorized } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { relyingParty, setPasskeyHint, challengeMatcher, clearChallenges } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const session = await getSession();
  const expectedChallenge = challengeMatcher(session);
  if (!expectedChallenge) {
    return NextResponse.json({ error: "El intento venció. Toca Desbloquear para reintentar." }, { status: 400 });
  }

  const { rpID, origin } = relyingParty(req);
  const body = await req.json();

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (e) {
    // El texto de la libreria es para el log, no para la pantalla: es ingles
    // tecnico y no le dice al usuario que hacer.
    console.error("[webauthn] verify falló:", (e as Error).message);
    return NextResponse.json({ error: "No se pudo verificar tu Face ID. Intenta de nuevo." }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "No se pudo verificar" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;
  await getDb().execute(
    `INSERT INTO webauthn_credentials (id, user_id, public_key, counter, transports, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      credential.id,
      user.userId,
      isoBase64URL.fromBuffer(credential.publicKey),
      credential.counter,
      credential.transports?.join(",") ?? null,
      new Date().toISOString(),
    ]
  );

  clearChallenges(session);
  session.hasPasskey = true;
  await session.save();

  return setPasskeyHint(NextResponse.json({ ok: true }), [credential.id]);
}
