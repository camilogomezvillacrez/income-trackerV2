import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/queries";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { currentMonth } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const param = req.nextUrl.searchParams.get("month");
  const month = param && /^\d{4}-(0[1-9]|1[0-2])$/.test(param) ? param : currentMonth();
  const data = await getDashboardData(month, user.userId);
  return NextResponse.json(data);
}
