/**
 * Google Maps JavaScript API のローダー
 *
 * Google マップを表示するには、Googleのスクリプトを1回だけ読み込む必要がある。
 * このモジュールはアプリ全体でスクリプトの二重読み込みを防ぎ、
 * Promise ベースで「読み込み完了」を通知する。
 *
 * セキュリティ対策:
 * - APIキーはブラウザのJSバンドルに含めず、認証済みユーザーのみが
 *   取得できる /api/maps-config エンドポイント経由で取得する
 */
import { supabase } from "./supabase";

// ロード中の Promise をキャッシュ（複数コンポーネントから呼ばれても1回だけ実行）
let loadPromise: Promise<void> | null = null;

/**
 * サーバーから Google Maps の API キーを取得する
 * - Supabase のセッショントークンを Authorization ヘッダーに付けて送信
 * - 未ログイン状態では 401 エラーになりキーを取得できない
 */
async function fetchMapsApiKey(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  const res = await fetch("/api/maps-config", { headers });
  if (!res.ok) throw new Error("Maps APIキーの取得に失敗しました");
  const data = await res.json();
  return data.key as string;
}

/**
 * Google Maps JavaScript API を読み込む
 *
 * - すでに読み込み済みなら即座に解決する Promise を返す
 * - 読み込み中なら同じ Promise を返す（二重読み込みを防ぐ）
 * - 新規読み込みの場合: APIキー取得 → スクリプトタグ挿入 → コールバックで解決
 *
 * 呼び出し方:
 *   await loadGoogleMapsScript();
 *   // この行以降で window.google.maps が使える
 */
export function loadGoogleMapsScript(): Promise<void> {
  if (loadPromise) return loadPromise;

  // すでに読み込み済みの場合（ページ遷移後など）
  if (typeof window !== "undefined" && window.google?.maps) {
    loadPromise = Promise.resolve();
    return loadPromise;
  }

  loadPromise = fetchMapsApiKey().then((apiKey) => {
    return new Promise<void>((resolve, reject) => {
      // Google Maps はスクリプト読み込み完了時にグローバル関数を呼び出す仕組み
      const callbackName = "__googleMapsCallback__";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)[callbackName] = () => {
        resolve(); // Maps の準備完了 → Promise を解決
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any)[callbackName]; // 使用後はグローバルから削除
      };

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&language=ja`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error("Google Maps の読み込みに失敗しました"));
      document.head.appendChild(script);
    });
  }).catch((err) => {
    // 失敗した場合は loadPromise をリセットして次回再試行できるようにする
    loadPromise = null;
    throw err;
  });

  return loadPromise;
}
