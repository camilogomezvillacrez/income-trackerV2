import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/queries";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { currentMonth } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const month = req.nextUrl.searchParams.get("month") ?? currentMonth();
  const data = await getDashboardData(month, user.userId);
  return NextResponse.json(data);
}
