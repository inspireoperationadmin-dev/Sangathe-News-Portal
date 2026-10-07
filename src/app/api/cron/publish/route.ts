import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { executeSchedulerRun } from "@/lib/scheduling";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!secret) return false;
  const actual = Buffer.from(supplied);
  const expected = Buffer.from(secret);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const result = await executeSchedulerRun("CRON");
    revalidatePath("/");
    revalidatePath("/admin/articles");
    revalidatePath("/admin/schedule");
    return NextResponse.json({ success: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Scheduled publisher failed", error);
    return NextResponse.json({ error: "Scheduled publisher failed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export const GET = run;
export const POST = run;
