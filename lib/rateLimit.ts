/**
 * APIエンドポイントのレート制限（流量制御）
 *
 * 同一IPアドレスから短時間に大量のリクエストが来た場合にブロックする。
 * これにより Google Maps API の不正使用（課金詐欺）やサービス過負荷を防ぐ。
 *
 * 実装方式: インメモリ（Map）
 * - サーバーインスタンスごとにカウントを保持する
 * - Vercel のサーバーレス環境では、インスタンスが再起動するとリセットされる
 * - 本格的な制限には Redis（Upstash 等）が必要だが、小規模アプリでは十分
 *
 * 制限値: 1分間に同一IPから30リクエストまで
 */

const store = new Map<string, { count: number; resetAt: number }>();

const MAX_REQUESTS = 30;    // ウィンドウ内の最大リクエスト数
const WINDOW_MS = 60 * 1000; // ウィンドウの長さ（1分）

/**
 * リクエストを許可するか判定する
 * @param key - IP アドレスなど一意のキー（例: "geocode:192.168.1.1"）
 * @returns true = 許可、false = 拒否（制限超過）
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = store.get(key);

  // 初回アクセス or ウィンドウ期限切れ → カウンターをリセット
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  // 制限超過 → 拒否
  if (entry.count >= MAX_REQUESTS) {
    return false;
  }

  // カウントアップして許可
  entry.count++;
  return true;
}
