"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsScript } from "@/lib/googleMaps";

type Props = {
  latitude: number;
  longitude: number;
  storeName: string;
};

export default function MapView({ latitude, longitude, storeName }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current) return;
        const position = { lat: latitude, lng: longitude };
        const map = new window.google.maps.Map(mapRef.current, {
          center: position,
          zoom: 16,
        });
        new window.google.maps.Marker({
          position,
          map,
          title: storeName,
        });
      })
      .catch(() => setError("地図の読み込みに失敗しました"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, storeName]);

  if (error) {
    return (
      <div className="w-full h-64 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center">
        <span className="text-red-500 text-sm">{error}</span>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-64 rounded-lg border border-gray-200" />;
}
