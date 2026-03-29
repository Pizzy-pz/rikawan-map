"use client";

import { useEffect, useRef } from "react";

type Props = {
  latitude: number;
  longitude: number;
  storeName: string;
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
    initMap: () => void;
  }
}

export default function MapView({ latitude, longitude, storeName }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const initMap = () => {
      if (!mapRef.current) return;
      const position = { lat: latitude, lng: longitude };
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: position,
        zoom: 16,
      });
      markerRef.current = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: storeName,
      });
    };

    if (window.google?.maps) {
      initMap();
    } else {
      window.initMap = initMap;
      const existingScript = document.getElementById("google-maps-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&language=ja`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }
  }, [latitude, longitude, storeName]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-64 bg-gray-100 border border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 gap-2">
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm font-medium">地図を表示するには</p>
        <p className="text-xs text-center px-4">
          .env.local に NEXT_PUBLIC_GOOGLE_MAPS_API_KEY を設定してください
        </p>
        <p className="text-xs text-gray-400">
          緯度: {latitude.toFixed(6)} / 経度: {longitude.toFixed(6)}
        </p>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-64 rounded-lg border border-gray-200" />;
}
