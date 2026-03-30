"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsScript } from "@/lib/googleMaps";

type Props = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  storeName: string;
  address: string;
};

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
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const hasCoords = isValidCoord(latitude, longitude);

  useEffect(() => {
    if (!hasCoords || !mapRef.current) return;

    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current) return;
        const position = { lat: latitude as number, lng: longitude as number };
        const map = new window.google.maps.Map(mapRef.current, {
          center: position,
          zoom: 16,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });
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

  // 座標あり：lat,lng でルート検索
  // 座標なし：住所または店名で場所検索
  const googleMapsNavUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeName)}`;

  return (
    <div className="space-y-3">
      {hasCoords ? (
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-96 rounded-xl border border-gray-200 bg-gray-100"
          />
          {!mapReady && !initError && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-100/80">
              <span className="text-gray-500 text-sm">地図を読み込み中...</span>
            </div>
          )}
          {initError && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-100">
              <span className="text-red-500 text-sm">{initError}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-32 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1">
          <span className="text-gray-400 text-sm">位置情報が登録されていません</span>
          <span className="text-gray-300 text-xs">編集画面から座標を入力してください</span>
        </div>
      )}

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
    </div>
  );
}
