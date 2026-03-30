"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { getShareLinkOwner } from "@/lib/shareLinks";
import { getStores, createStore } from "@/lib/stores";
import { Store } from "@/types/store";
import Header from "@/components/Header";

export default function SharedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [stores, setStores] = useState<Store[]>([]);
  const [invalid, setInvalid] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [copying, setCopying] = useState<string | null>(null);
  const [copyingAll, setCopyingAll] = useState(false);
  const [copied, setCopied] = useState<Set<string>>(new Set());
  const [allCopied, setAllCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !token) return;

    (async () => {
      const ownerId = await getShareLinkOwner(token);
      if (!ownerId) {
        setInvalid(true);
        setFetching(false);
        return;
      }
      if (ownerId === user.id) {
        router.push("/stores");
        return;
      }
      const data = await getStores(ownerId);
      setStores(data);
      setFetching(false);
    })();
  }, [user, token, router]);

  const handleCopyOne = async (store: Store) => {
    if (!user || copying) return;
    setCopying(store.id);
    await createStore(user.id, {
      name: store.name,
      address: store.address,
      latitude: store.latitude,
      longitude: store.longitude,
      memo: store.memo ?? undefined,
    });
    setCopied((prev) => new Set(prev).add(store.id));
    setCopying(null);
  };

  const handleCopyAll = async () => {
    if (!user || copyingAll) return;
    setCopyingAll(true);
    for (const store of stores) {
      if (!copied.has(store.id)) {
        await createStore(user.id, {
          name: store.name,
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
          memo: store.memo ?? undefined,
        });
      }
    }
    setCopied(new Set(stores.map((s) => s.id)));
    setAllCopied(true);
    setCopyingAll(false);
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  if (!user) return null;

  if (invalid) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <p className="text-gray-500 text-lg">このシェアリンクは無効です</p>
          <Link href="/stores" className="mt-4 text-blue-600 hover:underline text-sm">
            自分のリストに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">シェアされたリスト</h2>
            <p className="text-sm text-gray-500 mt-0.5">{stores.length}件の店舗</p>
          </div>
          {stores.length > 0 && (
            <button
              onClick={handleCopyAll}
              disabled={copyingAll || allCopied}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {copyingAll ? "コピー中..." : allCopied ? "全てコピー済み ✓" : "全てコピー"}
            </button>
          )}
        </div>

        {stores.length === 0 ? (
          <p className="text-center text-gray-400 py-16">店舗が登録されていません</p>
        ) : (
          <div className="space-y-3">
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{store.name}</p>
                  {store.memo && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{store.memo}</p>
                  )}
                </div>
                <button
                  onClick={() => handleCopyOne(store)}
                  disabled={copied.has(store.id) || copying === store.id}
                  className="text-sm flex-shrink-0 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition"
                >
                  {copied.has(store.id) ? "コピー済み ✓" : copying === store.id ? "..." : "コピー"}
                </button>
              </div>
            ))}
          </div>
        )}

        {allCopied && (
          <div className="mt-6 text-center">
            <Link
              href="/stores"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              自分のリストで確認する
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
