import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";
import { getAuthUser, getSession, unauthorized } from "@/lib/auth";
import { getCredentials, relyingParty, RP_NAME } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { rpID } = relyingParty(req);
  const existing = await getCredentials(user.userId);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: user.email,
    userID: isoUint8Array.fromUTF8String(String(user.userId)),
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({ id: c.id })),
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "required",
    },
  });

  const session = await getSession();
  session.challenge = options.challenge;
  await session.save();

  return NextResponse.json(options);
}
