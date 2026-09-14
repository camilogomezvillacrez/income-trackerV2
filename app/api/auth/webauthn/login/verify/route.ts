import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { clearPasskeyHint, getCredentialById, relyingParty, setPasskeyHint } from "@/lib/webauthn";

/** Ruta pública: Face ID correcto → crea la sesión del dueño de la passkey. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  const expectedChallenge = session.challenge;
  if (!expectedChallenge) {
    return NextResponse.json({ error: "Reto vencido, intenta de nuevo" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const stored = body?.id ? await getCredentialById(String(body.id)) : null;
  if (!stored) {
    // La passkey se desactivó: el aviso ya no aplica, toca la contraseña
    return clearPasskeyHint(NextResponse.json(
      { error: "Este Face ID ya no está registrado", unknownCredential: true },
      { status: 400 }
    ));
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
    return NextResponse.json({ error: `No se pudo verificar: ${(e as Error).message}` }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "No se pudo verificar" }, { status: 401 });
  }

  await getDb().execute(
    "UPDATE webauthn_credentials SET counter=? WHERE id=?",
    [verification.authenticationInfo.newCounter, stored.id]
  );

  session.userId       = stored.userId;
  session.email        = stored.email;
  session.lastActivity = Date.now();
  session.hasPasskey   = true;
  session.challenge    = undefined;
  await session.save();

  return setPasskeyHint(NextResponse.json({ ok: true }), [stored.id]);
}
