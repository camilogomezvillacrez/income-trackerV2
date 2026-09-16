import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { getSession, unauthorized } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getCredentials, relyingParty, setPasskeyHint, challengeMatcher, clearChallenges } from "@/lib/webauthn";

/** Ruta pública (la app está bloqueada): Face ID correcto → renueva la actividad. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return unauthorized();

  const expectedChallenge = challengeMatcher(session);
  if (!expectedChallenge) {
    return NextResponse.json({ error: "El intento venció. Toca Desbloquear para reintentar." }, { status: 400 });
  }

  const body = await req.json();
  const stored = (await getCredentials(session.userId)).find((c) => c.id === body?.id);
  if (!stored) {
    return NextResponse.json({ error: "Credencial desconocida" }, { status: 400 });
  }

  const { rpID, origin } = relyingParty(req);

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: stored.id,
        publicKey: isoBase64URL.toBuffer(stored.publicKey),
        counter: stored.counter,
        transports: stored.transports,
      },
      requireUserVerification: true,
    });
  } catch (e) {
    // El texto de la libreria es para el log, no para la pantalla: es ingles
    // tecnico y no le dice al usuario que hacer.
    console.error("[webauthn] verify falló:", (e as Error).message);
    return NextResponse.json({ error: "No se pudo verificar tu Face ID. Intenta de nuevo." }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "No se pudo verificar" }, { status: 401 });
  }

  await getDb().execute(
    "UPDATE webauthn_credentials SET counter=? WHERE id=?",
    [verification.authenticationInfo.newCounter, stored.id]
  );

  clearChallenges(session);
  session.lastActivity = Date.now();
  session.hasPasskey   = true;
  await session.save();

  return setPasskeyHint(NextResponse.json({ ok: true }), [stored.id]);
}
