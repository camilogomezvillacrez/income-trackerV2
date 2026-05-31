import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

export default async function HomePage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  return <DashboardShell userEmail={session.email} />;
}
