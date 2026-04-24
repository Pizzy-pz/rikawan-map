"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { createStore } from "@/lib/stores";
import { getNewPublicStores, PublicStore } from "@/lib/publicStores";
import Header from "@/components/Header";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function DiscoverPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [addProgress, setAddProgress] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getNewPublicStores(user.id).then((data) => {
        setStores(data);
        setFetching(false);
      });
    }
  }, [user]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (!user || selectedIds.size === 0) return;
    setAdding(true);
    setAddProgress(0);
    const targets = stores.filter((s) => selectedIds.has(s.id));
    for (let i = 0; i < targets.length; i++) {
      const s = targets[i];
      await createStore(user.id, {
        name: s.name,
        latitude: s.latitude,
        longitude: s.longitude,
        memo: s.memo,
      });
      setAddProgress(i + 1);
    }
    setStores((prev) => prev.filter((s) => !selectedIds.has(s.id)));
    setSelectedIds(new Set());
    setAdding(false);
    setAddProgress(0);
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {adding && (
        <LoadingOverlay
          message="店舗を追加しています..."
          current={addProgress}
          total={selectedIds.size}
        />
      )}
      <Header />

      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl w-full mx-auto px-4 pt-3 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/stores" className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h2 className="text-xl font-bold text-gray-800">新規店舗リスト</h2>
              {stores.length > 0 && (
                <button
                  onClick={() =>
                    setSelectedIds(
                      selectedIds.size === stores.length
                        ? new Set()
                        : new Set(stores.map((s) => s.id))
                    )
                  }
                  className="text-xs text-blue-600 hover:underline"
                >
                  {selectedIds.size === stores.length ? "全て解除" : "全て選択"}
                </button>
              )}
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={handleAdd}
                disabled={adding}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                追加（{selectedIds.size}件）
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4">
        {stores.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium">現在共有されている新規店舗はありません</p>
            <p className="text-sm mt-1">他のユーザーが店舗をシェアすると、ここに表示されます</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {stores.map((store) => {
              const isSelected = selectedIds.has(store.id);
              return (
                <li key={store.id}>
                  <button
                    onClick={() => handleToggle(store.id)}
                    className={`w-full text-left border rounded-lg p-4 transition flex items-center gap-3 ${
                      isSelected
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{store.name}</h3>
                      {store.memo && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{store.memo}</p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
