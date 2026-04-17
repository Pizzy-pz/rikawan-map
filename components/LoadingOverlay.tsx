/**
 * ローディングオーバーレイコンポーネント
 *
 * 店舗の追加・削除などの時間のかかる処理中に画面全体を覆って表示する。
 * - スピナー（くるくる回るアニメーション）
 * - メッセージテキスト
 * - 進捗バー（current / total を渡した場合のみ表示）
 *
 * 使い方:
 *   <LoadingOverlay message="削除しています..." current={3} total={10} />
 */
type Props = {
  message: string;    // 表示するメッセージ（例: "追加しています..."）
  current?: number;   // 現在の処理件数（進捗バー用）
  total?: number;     // 合計件数（進捗バー用）
};

export default function LoadingOverlay({ message, current, total }: Props) {
  // current と total が両方あるときのみ進捗バーを表示
  const hasProgress = current != null && total != null && total > 0;
  const percent = hasProgress ? Math.round((current! / total!) * 100) : null;

  return (
    // 画面全体を半透明の白でブロック（ユーザー操作を防ぐ）
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5 px-8 w-full max-w-xs">

        {/* スピナー（SVG の円弧を animate-spin で回転） */}
        <div className="relative w-16 h-16">
          <svg
            className="animate-spin w-16 h-16 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            {/* 背景の薄い円 */}
            <circle
              className="opacity-20"
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            {/* 回転する弧 */}
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>

        {/* メッセージテキスト */}
        <p className="text-base font-semibold text-gray-700 text-center">{message}</p>

        {/* 進捗バー（current / total が渡されたときのみ表示） */}
        {hasProgress && (
          <div className="w-full space-y-1.5">
            {/* バーの背景 → 内側の青いバーが percent% 分だけ伸びる */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              {current} / {total} 件
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
