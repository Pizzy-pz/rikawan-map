/**
 * 店舗登録・編集フォームコンポーネント
 *
 * 新規登録ページ・編集ページの両方で使用する共通フォーム。
 * 座標の入力方法は2種類:
 *   1. 座標直接入力（Google マップの長押しでコピーできる形式）
 *   2. 住所入力 → ジオコーディングで座標を自動取得
 *
 * バリデーション:
 * - 店名は必須
 * - 座標を入力した場合は有効な範囲（緯度 -90〜90、経度 -180〜180）
 * - 重複店名の警告（existingNames と照合）
 */
"use client";

import { useState } from "react";
import { StoreFormData } from "@/types/store";
import { geocodeAddress } from "@/lib/geocode";

type Props = {
  initialData?: StoreFormData & { latitude?: number; longitude?: number }; // 編集時の初期値
  onSubmit: (data: StoreFormData & { latitude: number; longitude: number }) => void;
  submitLabel: string;  // ボタンラベル（"登録する" or "更新する"）
  loading?: boolean;    // 親の保存処理中フラグ
  existingNames?: string[]; // 重複チェック用の既存店名一覧
};

/**
 * 座標文字列をパースして { lat, lng } を返す
 * Google マップからコピーした "(35.0053, 135.7731)" 形式に対応
 * 範囲外・不正な形式の場合は null を返す
 */
function parseCoords(value: string): { lat: number; lng: number } | null {
  // 全角・半角のカッコを除去
  const cleaned = value.replace(/[()（）]/g, "").trim();
  const match = cleaned.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (isNaN(lat) || isNaN(lng)) return null;
  // 座標の有効範囲チェック
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export default function StoreForm({ initialData, onSubmit, submitLabel, loading, existingNames }: Props) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  // 編集時は既存の座標を "lat, lng" 形式で初期表示する
  const [coordInput, setCoordInput] = useState(
    initialData?.latitude != null && initialData?.longitude != null
      ? `${initialData.latitude}, ${initialData.longitude}`
      : ""
  );
  const [memo, setMemo] = useState(initialData?.memo ?? "");
  const [geocoding, setGeocoding] = useState(false); // ジオコーディング処理中フラグ
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false); // 座標取得方法の説明の表示切り替え

  // 重複店名チェック（大文字小文字を無視して比較）
  const isDuplicate =
    existingNames != null &&
    name.trim().length > 0 &&
    existingNames.some((n) => n.toLowerCase() === name.trim().toLowerCase());

  /**
   * 座標入力欄の変更ハンドラ
   * 有効な座標が入力されたら住所欄に "lat, lng" を自動入力する
   */
  const handleCoordChange = (value: string) => {
    setCoordInput(value);
    const parsed = parseCoords(value);
    if (parsed) {
      setAddress(`${parsed.lat}, ${parsed.lng}`);
    }
  };

  /**
   * フォーム送信ハンドラ
   *
   * 処理フロー:
   *   1. 座標欄に入力あり → パースして onSubmit
   *   2. 座標欄が空 → 住所欄からジオコーディング → onSubmit
   *   3. どちらも無効 → エラーメッセージを表示
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("店名は必須です");
      return;
    }

    // 座標欄に何か入力されている場合はパース結果を使う
    const parsed = parseCoords(coordInput);
    if (coordInput.trim()) {
      if (!parsed) {
        setError("座標の形式が正しくありません（緯度: -90〜90、経度: -180〜180）");
        return;
      }
      onSubmit({
        name: name.trim(),
        address: address.trim(),
        memo: memo.trim() || undefined,
        latitude: parsed.lat,
        longitude: parsed.lng,
      });
      return;
    }

    // 座標欄が空の場合は住所からジオコーディング
    if (!address.trim()) {
      setError("座標か住所のどちらかを入力してください");
      return;
    }

    setGeocoding(true);
    const coords = await geocodeAddress(address.trim());
    setGeocoding(false);

    if (!coords) {
      setError("住所から位置情報を取得できませんでした。座標を直接入力してください。");
      return;
    }

    onSubmit({
      name: name.trim(),
      address: address.trim(),
      memo: memo.trim() || undefined,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 店名フィールド */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          店名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：酒場あおば"
          maxLength={100}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* 同名店舗が存在する場合の警告（登録は可能） */}
        {isDuplicate && (
          <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            同じ名前の店舗がすでに登録されています
          </p>
        )}
      </div>

      {/* 座標入力フィールド */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">
            座標 <span className="text-gray-400 text-xs">（Google マップからコピー）</span>
          </label>
          {/* 「取得方法」トグルボタン */}
          <button
            type="button"
            onClick={() => setShowSteps((v) => !v)}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            取得方法
            <svg
              className={`w-3 h-3 transition-transform ${showSteps ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* 座標の取得手順（開閉式） */}
        {showSteps && (
          <div className="mb-2 bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
            {[
              { step: "1", text: "Google マップで登録したい場所を長押しして、ピンを立てる" },
              { step: "2", text: "画面下部に出てくるパネルを少し上にスクロールすると住所が表示される" },
              { step: "3", text: "住所の下矢印をタップ →「（35.xxxx, 135.xxxx）」のような数字をタップしてコピー" },
              { step: "4", text: "コピーした数字をそのまま下の欄にペースト" },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-2 items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {step}
                </span>
                <p className="text-xs text-blue-900 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        )}

        <input
          type="text"
          value={coordInput}
          onChange={(e) => handleCoordChange(e.target.value)}
          placeholder="例：35.0053, 135.7731"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 住所フィールド（座標入力で自動入力される） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          住所 <span className="text-gray-400 text-xs">（座標入力で自動入力）</span>
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="例：京都府京都市下京区四条通小橋西入ル真町455"
          maxLength={200}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* メモフィールド（任意） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          メモ <span className="text-gray-400 text-xs">（任意）</span>
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="場所情報、担当者名など"
          rows={3}
          maxLength={500}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* 送信ボタン（ジオコーディング中・保存中はdisabledに） */}
      <button
        type="submit"
        disabled={loading || geocoding}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {geocoding ? "住所を検索中..." : loading ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
