/**
 * Google Maps JavaScript API キーの配信エンドポイント
 *
 * なぜこのエンドポイントが必要か:
 * - NEXT_PUBLIC_ 変数はビルド時にJSバンドルに埋め込まれ、
 *   誰でもソースから取得できてしまう
 * - このエンドポイントを通じてキーを返すことで、
 *   ログイン済みユーザーのみキーを取得できるようになる
 *
 * 認証: Authorization: Bearer <Supabase アクセストークン> が必要
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  // 未ログインのリクエストは拒否
  const authenticated = await verifyAuth(req);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
}

  // 認証済みユーザーにのみキーを返す
  return NextResponse.json({ key: apiKey });
}
