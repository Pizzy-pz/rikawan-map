"use client";

import { useRef, useState } from "react";
import { loadGoogleMapsScript } from "@/lib/googleMaps";

type Props = {
  destLat: number;
  destLng: number;
  storeName: string;
};

export default function RouteMap({ destLat, destLng, storeName }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [routeShown, setRouteShown] = useState(false);

  const showRoute = () => {
    setError(null);
    setLoading(true);

    if (!navigator.geolocation) {
      setError("お使いのブラウザは位置情報に対応していません");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const destination = { lat: destLat, lng: destLng };

        try {
          await loadGoogleMapsScript();
        } catch {
          setError("地図の読み込みに失敗しました");
          setLoading(false);
          return;
        }

        setLoading(false);

        if (!mapRef.current) return;
        const map = new window.google.maps.Map(mapRef.current, {
          center: origin,
          zoom: 14,
        });
        const directionsService = new window.google.maps.DirectionsService();
        const directionsRenderer = new window.google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (result: any, status: any) => {
            if (status === "OK" && result) {
              directionsRenderer.setDirections(result);
              setRouteShown(true);
            } else {
              setError("ルートを取得できませんでした。住所を確認してください。");
            }
          }
        );
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("位置情報の取得が拒否されました。ブラウザの設定から位置情報を許可してください。");
        } else {
          setError("位置情報を取得できませんでした。");
        }
      }
    );
  };

  return (
    <div className="space-y-3">
      {!routeShown && (
        <button
          onClick={showRoute}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          {loading ? "読み込み中..." : `現在地から「${storeName}」へのルートを表示`}
        </button>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div
        ref={mapRef}
        className={`w-full rounded-lg border border-gray-200 transition-all ${routeShown ? "h-96" : "h-0"}`}
      />
    </div>
  );
}
