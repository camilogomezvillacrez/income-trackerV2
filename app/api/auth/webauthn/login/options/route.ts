import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getSession } from "@/lib/auth";
import { relyingParty } from "@/lib/webauthn";

/**
 * Ruta pública: entrar con Face ID sin sesión. Sin allowCredentials, el
 * iPhone ofrece la passkey guardada para este dominio.
 */
export async function POST(req: NextRequest) {
  const { rpID } = relyingParty(req);
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
  });

  const session = await getSession();
  session.challenge = options.challenge;
  await session.save();

  return NextResponse.json(options);
}
