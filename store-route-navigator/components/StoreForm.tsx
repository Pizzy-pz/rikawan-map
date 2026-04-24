"use client";

import { useState } from "react";
import Link from "next/link";
import { StoreFormData } from "@/types/store";

type Props = {
  initialData?: StoreFormData & { latitude?: number; longitude?: number };
  onSubmit: (data: StoreFormData & { latitude: number; longitude: number }) => void;
  submitLabel: string;
  loading?: boolean;
  existingNames?: string[];
};

function parseCoords(value: string): { lat: number; lng: number } | null {
  const cleaned = value.replace(/[()（）]/g, "").trim();
  const match = cleaned.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export default function StoreForm({ initialData, onSubmit, submitLabel, loading, existingNames }: Props) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [coordInput, setCoordInput] = useState(
    initialData?.latitude != null && initialData?.longitude != null
      ? `${initialData.latitude}, ${initialData.longitude}`
      : ""
  );
  const [memo, setMemo] = useState(initialData?.memo ?? "");
  const [error, setError] = useState<string | null>(null);

  const isDuplicate =
    existingNames != null &&
    name.trim().length > 0 &&
    existingNames.some((n) => n.toLowerCase() === name.trim().toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("店名は必須です");
      return;
    }

    if (!coordInput.trim()) {
      setError("座標を入力してください");
      return;
    }

    const parsed = parseCoords(coordInput);
    if (!parsed) {
      setError("座標の形式が正しくありません（緯度: -90〜90、経度: -180〜180）");
      return;
    }

    onSubmit({
      name: name.trim(),
      memo: memo.trim() || undefined,
      latitude: parsed.lat,
      longitude: parsed.lng,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            座標 <span className="text-red-500">*</span>
          </label>
          <Link
            href="/how-to-get-coordinates"
            target="_blank"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            座標の取得方法
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
        <input
          type="text"
          value={coordInput}
          onChange={(e) => setCoordInput(e.target.value)}
          placeholder="例：35.0053, 135.7731"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-400">Google マップで場所を長押しするとコピーできます</p>
      </div>

      {/* メモフィールド */}
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

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
