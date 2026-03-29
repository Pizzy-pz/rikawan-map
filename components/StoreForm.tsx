"use client";

import { useState } from "react";
import { StoreFormData } from "@/types/store";
import { geocodeAddress } from "@/lib/geocode";

type Props = {
  initialData?: StoreFormData & { latitude?: number; longitude?: number };
  onSubmit: (data: StoreFormData & { latitude: number; longitude: number }) => void;
  submitLabel: string;
  loading?: boolean;
};

function parseCoords(value: string): { lat: number; lng: number } | null {
  // "(35.0053, 135.7731)" や "35.0053, 135.7731" に対応
  const cleaned = value.replace(/[()（）]/g, "").trim();
  const match = cleaned.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

export default function StoreForm({ initialData, onSubmit, submitLabel, loading }: Props) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [coordInput, setCoordInput] = useState("");
  const [memo, setMemo] = useState(initialData?.memo ?? "");
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  const handleCoordChange = (value: string) => {
    setCoordInput(value);
    const parsed = parseCoords(value);
    if (parsed) {
      setAddress(`${parsed.lat}, ${parsed.lng}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("店名は必須です");
      return;
    }

    // 座標が入力されている場合
    const parsed = parseCoords(coordInput);
    if (parsed) {
      onSubmit({
        name: name.trim(),
        address: address.trim(),
        memo: memo.trim() || undefined,
        latitude: parsed.lat,
        longitude: parsed.lng,
      });
      return;
    }

    // 住所からジオコーディング
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
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          店名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：酒場あおば"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 座標入力 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700">
            座標 <span className="text-gray-400 text-xs">（Google マップからコピー）</span>
          </label>
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          住所 <span className="text-gray-400 text-xs">（座標入力で自動入力）</span>
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="例：京都府京都市下京区四条通小橋西入ル真町455"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          メモ <span className="text-gray-400 text-xs">（任意）</span>
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="場所情報、担当者名など"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

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
