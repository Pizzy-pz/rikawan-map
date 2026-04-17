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
      getStore(id, user.id).then((found) => {
        if (found) {
          setStore(found);
        } else {
          setNotFound(true);
        }
      });
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

  const handleDelete = async () => {
    if (!confirm(`「${store.name}」を削除しますか？\nこの操作は取り消せません。`)) return;
    await deleteStore(id, user.id);
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
            <h3 className="text-2xl font-bold text-gray-900">{store.name}</h3>
            <div className="flex gap-2 flex-shrink-0">
              <Link
                href={`/stores/${store.id}/edit`}
                className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition"
              >
                編集
              </Link>
              <button
                onClick={handleDelete}
                className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
              >
                削除
              </button>
            </div>
          </div>

          {store.memo && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">メモ</p>
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{store.memo}</p>
            </div>
          )}

          <div>
            <StoreMap
              latitude={store.latitude}
              longitude={store.longitude}
              storeName={store.name}
              address={store.address}
            />
          </div>

          <p className="text-xs text-gray-300 text-right">{store.address}</p>
        </div>
      </main>
    </div>
  );
}
