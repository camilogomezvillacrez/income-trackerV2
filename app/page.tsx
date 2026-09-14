import { redirect } from "next/navigation";
import { getSession, isIdle } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

export default async function HomePage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  // Inactiva: con Face ID se pinta bloqueada desde el primer frame; sin Face ID, al login
  const locked = isIdle(session);
  if (locked && !session.hasPasskey) redirect("/login");

  return (
    <DashboardShell
      userEmail={session.email}
      hasPasskey={!!session.hasPasskey}
      initiallyLocked={locked}
    />
  );
}
