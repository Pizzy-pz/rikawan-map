// Google Maps JS API をページで一度だけ読み込む共通ローダー
import { supabase } from "./supabase";

let loadPromise: Promise<void> | null = null;

async function fetchMapsApiKey(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  const res = await fetch("/api/maps-config", { headers });
  if (!res.ok) throw new Error("Maps APIキーの取得に失敗しました");
  const data = await res.json();
  return data.key as string;
}

export function loadGoogleMapsScript(): Promise<void> {
  if (loadPromise) return loadPromise;

  // すでに読み込み済みの場合
  if (typeof window !== "undefined" && window.google?.maps) {
    loadPromise = Promise.resolve();
    return loadPromise;
  }

  loadPromise = fetchMapsApiKey().then((apiKey) => {
    return new Promise<void>((resolve, reject) => {
      const callbackName = "__googleMapsCallback__";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)[callbackName] = () => {
        resolve();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any)[callbackName];
      };

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&language=ja`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error("Google Maps の読み込みに失敗しました"));
      document.head.appendChild(script);
    });
  }).catch((err) => {
    // 失敗した場合は次回再試行できるようリセット
    loadPromise = null;
    throw err;
  });

  return loadPromise;
}
