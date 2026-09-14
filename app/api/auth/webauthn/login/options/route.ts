import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getSession } from "@/lib/auth";
import { PASSKEY_HINT_COOKIE, readPasskeyHint, relyingParty } from "@/lib/webauthn";

/**
 * Ruta pública: entrar con Face ID sin sesión. Si la cookie de aviso trae los
 * IDs de las passkeys de este dispositivo se piden por nombre (Safari va
 * directo a Face ID); si no, el iPhone ofrece la passkey guardada del dominio.
 */
export async function POST(req: NextRequest) {
  const { rpID } = relyingParty(req);
  const known = readPasskeyHint(req.cookies.get(PASSKEY_HINT_COOKIE)?.value);

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: known.length
      ? known.map((id) => ({ id, transports: ["internal", "hybrid"] as AuthenticatorTransport[] }))
      : undefined,
  });

  const session = await getSession();
  session.challenge = options.challenge;
  await session.save();

  return NextResponse.json(options);
}
