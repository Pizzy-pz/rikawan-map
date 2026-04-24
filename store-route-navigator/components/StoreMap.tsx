/**
 * 店舗詳細ページの地図コンポーネント
 *
 * 座標（latitude/longitude）の有効性を確認し、
 * 有効な場合は Google マップを表示する。
 * 無効（null・範囲外）の場合はプレースホルダーを表示する。
 *
 * また、Google マップアプリへのリンクボタンも提供する:
 * - 座標あり → 目的地をピン指定してルート案内
 * - 座標なし → 店名 or 住所で場所検索
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsScript } from "@/lib/googleMaps";

type Props = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  storeName: string;
  address?: string;
};

/**
 * 座標が地図表示に使える有効な値かチェックする
 * - null / undefined / NaN を除外
 * - 緯度 -90〜90、経度 -180〜180 の範囲外を除外
 */
function isValidCoord(lat: unknown, lng: unknown): lat is number {
  return (
    lat != null && lng != null &&
    typeof lat === "number" && typeof lng === "number" &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

export default function StoreMap({ latitude, longitude, storeName, address }: Props) {
  const mapRef = useRef<HTMLDivElement>(null); // Google マップをマウントする div の参照
  const [mapReady, setMapReady] = useState(false);       // マップ初期化完了フラグ
  const [initError, setInitError] = useState<string | null>(null); // エラーメッセージ

  const hasCoords = isValidCoord(latitude, longitude);

  useEffect(() => {
    // 座標が無効な場合はマップ初期化をスキップ
    if (!hasCoords || !mapRef.current) return;

    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current) return;
        const position = { lat: latitude as number, lng: longitude as number };

        // Google マップを初期化
        const map = new window.google.maps.Map(mapRef.current, {
          center: position,
          zoom: 16,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });

        // ピン（マーカー）を落下アニメーションで表示
        new window.google.maps.Marker({
          position,
          map,
          title: storeName,
          animation: window.google.maps.Animation.DROP,
        });

        setMapReady(true);
      })
      .catch(() => setInitError("地図の読み込みに失敗しました"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCoords, latitude, longitude, storeName]);

  // Google マップアプリへのリンクを生成
  // - 座標あり: lat,lng で目的地指定のルート案内
  // - 住所あり: 住所で場所検索
  // - どちらもなし: 店名で場所検索
  const googleMapsNavUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeName)}`;

  return (
    <div className="space-y-3">
      {/* Google マップアプリへのリンクボタン */}
      <a
        href={googleMapsNavUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-green-700 active:bg-green-800 transition flex items-center justify-center gap-3 shadow-sm"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        {hasCoords ? "Google マップでルートを確認" : "Google マップで検索"}
      </a>

      {hasCoords ? (
        // --- 座標あり: Google マップを表示 ---
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-[400px] rounded-xl border border-gray-200 bg-gray-100"
          />
          {/* マップ読み込み中のオーバーレイ */}
          {!mapReady && !initError && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-100/80">
              <span className="text-gray-500 text-sm">地図を読み込み中...</span>
            </div>
          )}
          {/* エラー時のオーバーレイ */}
          {initError && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-100">
              <span className="text-red-500 text-sm">{initError}</span>
            </div>
          )}
        </div>
      ) : (
        // --- 座標なし: プレースホルダーを表示 ---
        <div className="w-full h-32 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1">
          <span className="text-gray-400 text-sm">位置情報が登録されていません</span>
          <span className="text-gray-300 text-xs">編集画面から座標を入力してください</span>
        </div>
      )}
    </div>
  );
}
