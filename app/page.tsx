import { redirect } from "next/navigation";
import { getSession, isIdle } from "@/lib/auth";
import { userHasPasskey } from "@/lib/webauthn";
import { getDashboardData } from "@/lib/queries";
import { currentMonth } from "@/lib/utils";
import DashboardShell from "@/components/DashboardShell";

export default async function HomePage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  // La marca de la cookie puede quedar desactualizada (p. ej. si otra petición
  // reescribió la cookie al activar Face ID): si dice "sin Face ID", se confirma
  // en la base de datos antes de mandar al login.
  const hasPasskey = session.hasPasskey || await userHasPasskey(session.userId);

  // Inactiva: con Face ID se pinta bloqueada desde el primer frame; sin Face ID, al login
  const locked = isIdle(session);
  if (locked && !hasPasskey) redirect("/login");

  /*
   * Los datos del mes viajan dentro del HTML.
   *
   * Antes el arranque en frio eran dos viajes de red seguidos hasta Virginia:
   * primero el HTML, y solo cuando habia hidratado empezaba el segundo a
   * /api/dashboard. Aqui ya tenemos la sesion y estamos al lado de la base de
   * datos, asi que el segundo viaje sobra.
   *
   * Bloqueada no se mandan: seria entregarlos antes de que te identifiques.
   */
  const initialData = locked ? null : await getDashboardData(currentMonth(), session.userId);

  return (
    <DashboardShell
      userEmail={session.email}
      hasPasskey={hasPasskey}
      initiallyLocked={locked}
      initialData={initialData}
    />
  );
}
