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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const openDeleteConfirm = () => setShowDeleteConfirm(true);

  const handleDelete = async () => {
    setDeleting(true);
    const success = await deleteStore(id, user.id);
    if (success) {
      router.push("/stores");
    } else {
      setDeleting(false);
      setShowDeleteConfirm(false);
      alert("削除に失敗しました。再度お試しください。");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/stores" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">戻る</span>
          </Link>
          <div className="flex gap-2">
            <Link
              href={`/stores/${store.id}/edit`}
              className="text-base bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              編集
            </Link>
            <button
              onClick={openDeleteConfirm}
              className="text-base bg-red-50 text-red-600 px-5 py-2 rounded-lg hover:bg-red-100 transition"
            >
              削除
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h3 className="text-2xl font-bold text-gray-900">{store.name}</h3>

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

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full shadow-lg">
            <p className="text-gray-800 font-medium mb-1">「{store.name}」を削除しますか？</p>
            <p className="text-sm text-gray-500 mb-6">この操作は取り消せません。</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm"
              >
                いいえ
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm disabled:opacity-50"
              >
                {deleting ? "削除中..." : "はい"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
