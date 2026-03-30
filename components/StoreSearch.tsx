/**
 * 店舗名検索バーコンポーネント
 *
 * 入力値は親コンポーネント（stores/page.tsx）で管理し、
 * onChange で変化を通知する（制御コンポーネント）。
 * 入力中はクリアボタン（×）を表示する。
 */
"use client";

type Props = {
  value: string;                    // 現在の検索テキスト
  onChange: (value: string) => void; // テキスト変更時のコールバック
};

export default function StoreSearch({ value, onChange }: Props) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="店名で検索..."
        className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* 検索アイコン（左端） */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      {/* クリアボタン（×）：テキストが入力されているときのみ表示 */}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
