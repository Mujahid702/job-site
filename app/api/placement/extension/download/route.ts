import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(new URL("/placement-os-extension.zip", appUrl));
}
