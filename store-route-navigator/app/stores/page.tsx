"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { getStores, deleteStore } from "@/lib/stores";
import { getOrCreateShareLink, deleteShareLink, getShareLinkToken } from "@/lib/shareLinks";
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

  const [showShare, setShowShare] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // 選択・一括削除
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getStores(user.id).then(setStores);
      getShareLinkToken(user.id).then(setShareToken);
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

  const handleGenerateLink = async () => {
    if (!user) return;
    setShareLoading(true);
    const token = await getOrCreateShareLink(user.id);
    setShareToken(token);
    setShareLoading(false);
  };

  const handleDeleteLink = async () => {
    if (!user) return;
    setShareLoading(true);
    await deleteShareLink(user.id);
    setShareToken(null);
    setShareLoading(false);
  };

  const handleCopy = async () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/shared/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  if (!user) return null;

  const filtered = stores
    .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));

  const shareUrl = shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${shareToken}`
    : "";

  return (
    <div className="h-screen flex flex-col">
      {deleting && (
        <LoadingOverlay
          message="削除しています..."
          current={deleteProgress}
          total={selectedIds.size}
        />
      )}
      <Header />

      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl w-full mx-auto px-4 pt-3 pb-3">

          {selecting ? (
            /* 選択モード ヘッダー */
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  {selectedIds.size}件選択中
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {selectedIds.size === filtered.length ? "全て解除" : "全て選択"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={selectedIds.size === 0 || deleting}
                  className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-40 transition"
                >
                  {deleting ? "削除中..." : `削除（${selectedIds.size}件）`}
                </button>
                <button
                  onClick={handleCancelSelect}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            /* 通常モード ヘッダー */
            <>
              {/* Row 1: 店舗一覧 / 新規登録 / 削除 */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-800">店舗一覧</h2>
                <div className="flex items-center gap-6">
                  <Link
                    href="/stores/new"
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    ＋ 新規登録
                  </Link>
                  <button
                    onClick={() => { setSelecting(true); setShowShare(false); }}
                    className="bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition"
                  >
                    選択削除
                  </button>
                </div>
              </div>

              {/* Row 2: 追加店舗一覧(空) / シェア */}
              <div className="flex items-center justify-between mb-3">
                <button
                  disabled
                  className="text-sm font-medium text-gray-300 cursor-not-allowed"
                >
                  追加店舗一覧
                </button>
                <button
                  onClick={() => setShowShare((v) => !v)}
                  className={`flex items-center gap-1.5 px-9 py-2 rounded-lg text-sm font-medium border transition ${showShare ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  シェア
                </button>
              </div>
            </>
          )}

          {showShare && !selecting && (
            <div className="mb-2 bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-blue-800">リストをシェア</p>
              {shareToken ? (
                <>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 text-xs bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-600 truncate"
                    />
                    <button
                      onClick={handleCopy}
                      className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                    >
                      {copied ? "コピー済み ✓" : "コピー"}
                    </button>
                  </div>
                  <p className="text-xs text-blue-600">このリンクを持つログイン済みのユーザーがリストを閲覧・コピーできます</p>
                  <button
                    onClick={handleDeleteLink}
                    disabled={shareLoading}
                    className="text-xs text-red-500 hover:text-red-700 transition"
                  >
                    シェアを停止する
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGenerateLink}
                  disabled={shareLoading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {shareLoading ? "生成中..." : "シェアリンクを生成"}
                </button>
              )}
            </div>
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
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
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
