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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const showRoute = (map: unknown) => {
    setError(null);
    setRouteLoading(true);

    if (!navigator.geolocation) {
      setError("お使いのブラウザは位置情報に対応していません");
      setRouteLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const destination = { lat: latitude, lng: longitude };

        const directionsService = new window.google.maps.DirectionsService();
        const directionsRenderer = new window.google.maps.DirectionsRenderer();

        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.WALKING,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (result: any, status: any) => {
            setRouteLoading(false);
            if (status === "OK" && result) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              directionsRenderer.setMap(map as any);
              directionsRenderer.setDirections(result);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (map as any).fitBounds(result.routes[0].bounds);
            } else {
              setError("ルートを取得できませんでした。住所を確認してください。");
            }
          }
        );
      },
      (err) => {
        setRouteLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("位置情報の取得が拒否されました。ブラウザの設定で許可してください。");
        } else {
          setError("現在地を取得できませんでした。");
        }
      },
      { timeout: 10000 }
    );
  };

  // 地図初期化のみ（ルート取得はボタン押下時）
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
        mapInstanceRef.current = map;
        setMapReady(true);
      })
      .catch(() => setInitError("地図の読み込みに失敗しました"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, latitude, longitude, storeName]);

  const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=walking`;

  if (!apiKey) {
    return (
      <div className="space-y-3">
        <div className="w-full h-56 bg-gray-100 border border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-500 gap-2">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm font-medium">APIキー未設定</p>
          <p className="text-xs text-center px-6 text-gray-400">
            .env.local に NEXT_PUBLIC_GOOGLE_MAPS_API_KEY を設定すると地図が表示されます
          </p>
        </div>
        <a
          href={googleMapsNavUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Google マップで経路を確認
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => showRoute(mapInstanceRef.current)}
        disabled={routeLoading || !mapReady}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
        {routeLoading ? "ルートを取得中..." : "現在地からのルートを表示"}
      </button>
      <a
        href={googleMapsNavUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        Google マップで開く
      </a>
    </div>
  );
}
