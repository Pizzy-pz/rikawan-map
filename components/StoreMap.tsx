"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsScript } from "@/lib/googleMaps";

type Props = {
  latitude: number;
  longitude: number;
  storeName: string;
  address: string;
};

export default function StoreMap({ latitude, longitude, storeName, address }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!mapRef.current) return;
        const position = { lat: latitude, lng: longitude };
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
  }, [apiKey, latitude, longitude, storeName]);

  const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;

  return (
    <div className="space-y-3">
      {apiKey && (
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
        Google マップでルートを確認
      </a>
    </div>
  );
}
