"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { getStores, deleteStore } from "@/lib/stores";
import { getMySharedNames, uploadMultipleToPublicStores, removeMultipleFromPublicStores } from "@/lib/publicStores";
import { Store } from "@/types/store";
import Header from "@/components/Header";
import StoreList from "@/components/StoreList";
import StoreSearch from "@/components/StoreSearch";
import LoadingOverlay from "@/components/LoadingOverlay";

const SCROLL_KEY = "stores_scroll";
const QUERY_KEY = "stores_query";

export default function StoresPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [query, setQuery] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem(QUERY_KEY) ?? "" : ""
  );
  const listRef = useRef<HTMLDivElement>(null);

  // 選択削除モード
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // シェアモード
  const [shareMode, setShareMode] = useState(false);
  const [shareSelectedIds, setShareSelectedIds] = useState<Set<string>>(new Set());
  const [unshareSelectedNames, setUnshareSelectedNames] = useState<Set<string>>(new Set());
  const [sharedNames, setSharedNames] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getStores(user.id).then(setStores);
      getMySharedNames(user.id).then(setSharedNames);
    }
  }, [user]);

  useEffect(() => {
    if (!stores.length || !listRef.current) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      listRef.current.scrollTop = parseInt(saved);
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, [stores]);

  const handleScroll = () => {
    if (listRef.current) {
      sessionStorage.setItem(SCROLL_KEY, String(listRef.current.scrollTop));
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    sessionStorage.setItem(QUERY_KEY, value);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  };

  const handleCancelSelect = () => {
    setSelecting(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (!user || selectedIds.size === 0) return;
    setDeleting(true);
    setDeleteProgress(0);
    setShowBulkDeleteConfirm(false);
    const ids = Array.from(selectedIds);
    for (let i = 0; i < ids.length; i++) {
      await deleteStore(ids[i], user.id);
      setDeleteProgress(i + 1);
    }
    setStores((prev) => prev.filter((s) => !selectedIds.has(s.id)));
    setSelectedIds(new Set());
    setSelecting(false);
    setDeleting(false);
    setDeleteProgress(0);
  };

  const handleToggleShareSelect = (id: string) => {
    setShareSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCancelShareMode = () => {
    setShareMode(false);
    setShareSelectedIds(new Set());
    setUnshareSelectedNames(new Set());
  };

  const handleToggleUnshareSelect = (name: string) => {
    setUnshareSelectedNames((prev) => {
      const next = new Set(prev);
      next.has(name.toLowerCase()) ? next.delete(name.toLowerCase()) : next.add(name.toLowerCase());
      return next;
    });
  };

  const handleSelectAllUnshared = () => {
    const unshared = filtered.filter((s) => !sharedNames.has(s.name.toLowerCase()));
    if (shareSelectedIds.size === unshared.length && unshared.length > 0) {
      setShareSelectedIds(new Set());
    } else {
      setShareSelectedIds(new Set(unshared.map((s) => s.id)));
    }
  };

  const handleShare = async () => {
    if (!user || shareSelectedIds.size === 0) return;
    setSharing(true);
    try {
      const targets = stores.filter((s) => shareSelectedIds.has(s.id));
      await uploadMultipleToPublicStores(user.id, targets);
      const newSharedNames = await getMySharedNames(user.id);
      setSharedNames(newSharedNames);
      setShareSelectedIds(new Set());
    } catch (e) {
      alert(`シェアに失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async () => {
    if (!user || unshareSelectedNames.size === 0) return;
    setSharing(true);
    try {
      await removeMultipleFromPublicStores(user.id, Array.from(unshareSelectedNames));
      const newSharedNames = await getMySharedNames(user.id);
      setSharedNames(newSharedNames);
      setUnshareSelectedNames(new Set());
    } catch (e) {
      alert(`シェアの取り消しに失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  if (!user) return null;

  const filtered = stores.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="h-screen flex flex-col">
      {deleting && (
        <LoadingOverlay
          message="削除しています..."
          current={deleteProgress}
          total={selectedIds.size}
        />
      )}
      {sharing && (
        <LoadingOverlay message="シェアしています..." />
      )}
      <Header />

      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl w-full mx-auto px-4 pt-3 pb-3">

          {selecting ? (
            /* 削除モード ヘッダー */
            <div className="space-y-3 mb-3">
              <div className="flex items-center gap-3">
                <button onClick={handleCancelSelect} className="text-gray-500 hover:text-gray-700 flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-lg font-bold text-gray-800">選択削除</span>
                <span className="text-sm text-gray-400">{selectedIds.size}件選択中</span>
                <button
                  onClick={handleSelectAll}
                  className="ml-auto text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition"
                >
                  {selectedIds.size === filtered.length ? "全て解除" : "全て選択"}
                </button>
              </div>
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={selectedIds.size === 0 || deleting}
                className="w-full bg-red-500 text-white py-3 rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-40 transition"
              >
                {deleting ? "削除中..." : `削除（${selectedIds.size}件）`}
              </button>
            </div>
          ) : shareMode ? (
            /* シェアモード ヘッダー */
            <div className="space-y-3 mb-3">
              <div className="flex items-center gap-3">
                <button onClick={handleCancelShareMode} className="text-gray-500 hover:text-gray-700 flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-lg font-bold text-gray-800">シェアモード</span>
              </div>
              <button
                onClick={handleSelectAllUnshared}
                className="w-full border-2 border-blue-400 text-blue-600 bg-blue-50 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition"
              >
                未シェアを全て選択
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  disabled={shareSelectedIds.size === 0 || sharing}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition"
                >
                  シェアする（{shareSelectedIds.size}件）
                </button>
                <button
                  onClick={handleUnshare}
                  disabled={unshareSelectedNames.size === 0 || sharing}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-40 transition"
                >
                  取り消す（{unshareSelectedNames.size}件）
                </button>
              </div>
            </div>
          ) : (
            /* 通常モード ヘッダー */
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-2">店舗一覧</h2>

              {/* 新規登録: 全幅 */}
              <Link
                href="/stores/new"
                className="w-full block text-center bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition mb-2"
              >
                ＋ 新規登録
              </Link>

              {/* サブ操作: 3等分 */}
              <div className="flex gap-2 mb-3">
                <Link
                  href="/stores/discover"
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  新規店舗
                </Link>
                <button
                  onClick={() => setShareMode(true)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  シェア
                </button>
                <button
                  onClick={() => setSelecting(true)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium border border-red-200 bg-white text-red-500 hover:bg-red-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  選択削除
                </button>
              </div>
            </>
          )}

          <StoreSearch value={query} onChange={handleQueryChange} />
        </div>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        <div className="max-w-2xl w-full mx-auto px-4 py-4">
          {query && filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">該当する店舗がありません</p>
              <p className="text-sm mt-1">「{query}」に一致する店舗は見つかりませんでした</p>
            </div>
          ) : (
            <StoreList
              stores={filtered}
              selectable={selecting}
              selectedIds={selecting ? selectedIds : shareSelectedIds}
              onToggleSelect={selecting ? handleToggleSelect : handleToggleShareSelect}
              shareMode={shareMode}
              sharedNames={sharedNames}
              unshareSelectedNames={unshareSelectedNames}
              onToggleUnshareSelect={handleToggleUnshareSelect}
            />
          )}
        </div>
      </div>

      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full shadow-lg">
            <p className="text-gray-800 font-medium mb-1">
              {selectedIds.size}件の店舗を削除しますか？
            </p>
            <p className="text-sm text-gray-500 mb-6">この操作は取り消せません。</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm"
              >
                いいえ
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm"
              >
                はい
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
