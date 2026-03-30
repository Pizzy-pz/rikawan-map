import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const authenticated = await verifyAuth(req);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  return NextResponse.json({ key: apiKey });
}
