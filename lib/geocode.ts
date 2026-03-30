/**
 * 住所 → 座標変換（ジオコーディング）
 *
 * ユーザーが住所を入力した場合に、Google の Geocoding API を通じて
 * 緯度・経度を取得する。
 *
 * APIキーはサーバー側（/api/geocode）で使用するため、
 * ブラウザには露出しない。認証トークンをヘッダーに付けて
 * サーバーに送信し、サーバーが Google API に問い合わせる。
 */
import { supabase } from "./supabase";

/**
 * 住所文字列から緯度・経度を取得する
 * - 成功時: { latitude, longitude } を返す
 * - 失敗時（住所不明、ネットワークエラー等）: null を返す
 */
export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    // ログイン中のセッショントークンを取得して Authorization ヘッダーに付ける
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    // Next.js の API ルートを経由してサーバー側で Google Geocoding API を呼ぶ
    const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return { latitude: data.latitude, longitude: data.longitude };
  } catch {
    return null;
  }
}
