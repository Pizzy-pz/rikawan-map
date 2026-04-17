/**
 * ルート検索 API（サーバーサイド）
 *
 * 出発地・目的地の座標を受け取り、Google Directions API でルートを取得して返す。
 * APIキーはサーバー側のみで使用し、ブラウザに露出しない。
 *
 * セキュリティ対策:
 * - 認証チェック: ログイン済みユーザーのみ利用可能
 * - レート制限: 同一IPから1分間30リクエストまで
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  // IPアドレスを取得してレート制限を確認
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!checkRateLimit(`directions:${ip}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // 認証チェック（未ログインは拒否）
  const authenticated = await verifyAuth(req);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // クエリパラメータから出発地・目的地の座標を取得
  const { searchParams } = req.nextUrl;
  const originLat = searchParams.get("originLat");
  const originLng = searchParams.get("originLng");
  const destLat = searchParams.get("destLat");
  const destLng = searchParams.get("destLng");

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // Google Directions API に問い合わせ（徒歩モード）
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=walking&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK") {
    return NextResponse.json({ error: "Directions failed", status: data.status }, { status: 400 });
  }

  return NextResponse.json(data);
}
