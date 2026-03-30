type Props = {
  message: string;
  current?: number;
  total?: number;
};

export default function LoadingOverlay({ message, current, total }: Props) {
  const hasProgress = current != null && total != null && total > 0;
  const percent = hasProgress ? Math.round((current! / total!) * 100) : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5 px-8 w-full max-w-xs">
        {/* スピナー */}
        <div className="relative w-16 h-16">
          <svg
            className="animate-spin w-16 h-16 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-20"
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>

        {/* メッセージ */}
        <p className="text-base font-semibold text-gray-700 text-center">{message}</p>

        {/* プログレスバー */}
        {hasProgress && (
          <div className="w-full space-y-1.5">
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
