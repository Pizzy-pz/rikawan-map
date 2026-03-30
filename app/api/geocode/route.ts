/**
 * 住所 → 緯度経度 変換 API（サーバーサイド）
 *
 * クライアントからの住所文字列を受け取り、Google Geocoding API に問い合わせて
 * 緯度・経度を返す。APIキーはサーバー側（環境変数 GOOGLE_MAPS_API_KEY）のみで
 * 使用し、ブラウザに露出しない。
 *
 * セキュリティ対策:
 * - 認証チェック: ログイン済みユーザーのみ利用可能
 * - レート制限: 同一IPから1分間30リクエストまで
 * - 入力バリデーション: 住所の文字数上限チェック
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/apiAuth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  // IPアドレスを取得してレート制限を確認（Vercel では x-forwarded-for ヘッダーを使用）
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!checkRateLimit(`geocode:${ip}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // 認証チェック（未ログインは拒否）
  const authenticated = await verifyAuth(req);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }
  // 300文字超の住所は Google API でも処理できないため弾く
  if (address.length > 300) {
    return NextResponse.json({ error: "address is too long" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // Google Geocoding API に問い合わせ
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.results?.[0]) {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 400 });
  }

  // 結果から緯度・経度を取り出して返す
  const loc = data.results[0].geometry.location;
  return NextResponse.json({ latitude: loc.lat, longitude: loc.lng });
}
