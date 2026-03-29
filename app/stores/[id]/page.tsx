"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { getStore, deleteStore } from "@/lib/stores";
import { Store } from "@/types/store";
import Header from "@/components/Header";
import StoreMap from "@/components/StoreMap";

export default function StoreDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [store, setStore] = useState<Store | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && id) {
      const found = getStore(id, user.id);
      if (found) {
        setStore(found);
      } else {
        setNotFound(true);
      }
    }
  }, [user, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  if (!user) return null;

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-6 text-center">
          <p className="text-gray-500 mt-16">店舗が見つかりませんでした</p>
          <Link href="/stores" className="text-blue-600 hover:underline mt-4 inline-block">
            一覧に戻る
          </Link>
        </main>
      </div>
    );
  }

  if (!store) return null;

  const handleDelete = () => {
    if (!confirm(`「${store.name}」を削除しますか？\nこの操作は取り消せません。`)) return;
    deleteStore(id, user.id);
    router.push("/stores");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/stores" className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h2 className="text-xl font-bold text-gray-800 truncate">{store.name}</h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-gray-900">{store.name}</h3>
              <p className="text-gray-600 mt-1 flex items-start gap-1">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {store.address}
              </p>
            </div>
            <div className="flex gap-4 flex-shrink-0">
              <Link
                href={`/stores/${store.id}/edit`}
                className="text-base bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                編集
              </Link>
              <button
                onClick={handleDelete}
                className="text-base bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition ml-4"
              >
                削除
              </button>
            </div>
          </div>

          {store.memo && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <p className="font-medium text-gray-500 text-xs mb-1">メモ</p>
              <p className="whitespace-pre-wrap">{store.memo}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">地図・ルート案内</p>
            <StoreMap
              latitude={store.latitude}
              longitude={store.longitude}
              storeName={store.name}
              address={store.address}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
