/**
 * シェアリンク閲覧ページ（/shared/[token]）
 *
 * 他ユーザーが共有した店舗リストを閲覧・コピーするページ。
 * URLの [token] からリンクの所有者を特定し、その店舗一覧を表示する。
 *
 * 重複コピー防止:
 * - 自分の既存店舗と同名の店舗は「コピー済み」として扱う
 *
 * アクセス制御:
 * - ログイン必須（未ログインはログインページへリダイレクト）
 * - 自分のリンクにアクセスした場合は店舗一覧ページへリダイレクト
 * - 無効なトークンはエラーを表示
 */
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
  const token = params.token as string; // URLの [token] を取得

  const [stores, setStores] = useState<Store[]>([]);
  const [invalid, setInvalid] = useState(false);       // 無効なトークンフラグ
  const [fetching, setFetching] = useState(true);
  const [copying, setCopying] = useState<string | null>(null); // コピー中の店舗ID
  const [copyingAll, setCopyingAll] = useState(false);
  const [copied, setCopied] = useState<Set<string>>(new Set()); // コピー済みの店舗IDセット
  const [allCopied, setAllCopied] = useState(false);

  // 未ログインならログインページへ
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !token) return;

    (async () => {
      // トークンからリンクの所有者を取得
      const ownerId = await getShareLinkOwner(token);
      if (!ownerId) {
        setInvalid(true); // 存在しないトークン
        setFetching(false);
        return;
      }
      // 自分自身のリンクにアクセスした場合は自分の一覧ページへ
      if (ownerId === user.id) {
        router.push("/stores");
        return;
      }

      // 共有された店舗リストと自分の店舗リストを並行取得
      const [sharedStores, myStores] = await Promise.all([
        getStores(ownerId),
        getStores(user.id),
      ]);

      // 自分が既に持っている店名（大文字小文字を無視）
      const myNames = new Set(myStores.map((s) => s.name.toLowerCase()));

      // 同名の店舗を「コピー済み」として初期設定（重複コピー防止）
      const alreadyCopied = new Set(
        sharedStores.filter((s) => myNames.has(s.name.toLowerCase())).map((s) => s.id)
      );
      setStores(sharedStores);
      setCopied(alreadyCopied);

      // 全店舗がすでにコピー済みの場合
      if (sharedStores.length > 0 && alreadyCopied.size === sharedStores.length) {
        setAllCopied(true);
      }
      setFetching(false);
    })();
  }, [user, token, router]);

  /** 1件コピー */
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

  /** 全件コピー（コピー済みをスキップ） */
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

  // 無効なトークンの場合
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

        {/* 全コピー完了後に自分のリストへ誘導するボタンを表示 */}
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
