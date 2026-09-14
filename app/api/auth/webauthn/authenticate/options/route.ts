import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getSession, unauthorized } from "@/lib/auth";
import { getCredentials, relyingParty } from "@/lib/webauthn";

/** Ruta pública (la app está bloqueada): exige cookie de sesión válida, no actividad reciente. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return unauthorized();

  const credentials = await getCredentials(session.userId);
  if (credentials.length === 0) {
    return NextResponse.json({ error: "Face ID no está activado" }, { status: 400 });
  }

  const { rpID } = relyingParty(req);
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map((c) => ({
      id: c.id,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    })),
    userVerification: "required",
  });

  session.challenge = options.challenge;
  await session.save();

  return NextResponse.json(options);
}
