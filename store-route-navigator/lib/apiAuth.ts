/**
 * APIルートの認証チェック共通ユーティリティ
 *
 * Next.js の API ルート（/api/...）は通常ブラウザのセッションCookieを
 * 自動で読まないため、クライアントが Authorization ヘッダーに
 * Supabase のアクセストークンを付けて送信し、
 * このモジュールでトークンの正当性を検証する。
 *
 * 検証フロー:
 *   1. リクエストの Authorization: Bearer <token> を取り出す
 *   2. Supabase の getUser(token) でトークンを検証
 *   3. 有効なユーザーが存在すれば true を返す
 */
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * リクエストが認証済みユーザーからのものか検証する
 * @returns true = 認証OK、false = 未認証または無効トークン
 */
export async function verifyAuth(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  if (!token) return false;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return !!user;
}
