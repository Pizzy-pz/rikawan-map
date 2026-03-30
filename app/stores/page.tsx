"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { getStores } from "@/lib/stores";
import { getOrCreateShareLink, deleteShareLink, getShareLinkToken } from "@/lib/shareLinks";
import { Store } from "@/types/store";
import Header from "@/components/Header";
import StoreList from "@/components/StoreList";
import StoreSearch from "@/components/StoreSearch";

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

  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

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

  const handleImportGo = () => {
    setImportError(null);
    const match = importUrl.trim().match(/\/shared\/([a-f0-9-]+)/i);
    if (!match) {
      setImportError("有効なシェアリンクを貼り付けてください");
      return;
    }
    router.push(`/stores/import?token=${match[1]}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  if (!user) return null;

  const filtered = stores.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const shareUrl = shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${shareToken}`
    : "";

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl w-full mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-800">店舗一覧</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowImport((v) => !v); setShowShare(false); setImportError(null); }}
                className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                リンクから追加
              </button>
              <button
                onClick={() => { setShowShare((v) => !v); setShowImport(false); }}
                className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                シェア
              </button>
              <Link
                href="/stores/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                + 新規登録
              </Link>
            </div>
          </div>

          {showImport && (
            <div className="mb-3 bg-green-50 border border-green-100 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-green-800">リンクからリストを追加</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={importUrl}
                  onChange={(e) => { setImportUrl(e.target.value); setImportError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleImportGo()}
                  placeholder="シェアリンクを貼り付け"
                  className="flex-1 text-xs bg-white border border-green-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                  onClick={handleImportGo}
                  disabled={!importUrl.trim()}
                  className="text-xs bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition whitespace-nowrap"
                >
                  確認
                </button>
              </div>
              {importError && (
                <p className="text-xs text-red-600">{importError}</p>
              )}
            </div>
          )}

          {showShare && (
            <div className="mb-3 bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-800">リストをシェア</p>
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
                  className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
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
            <StoreList stores={filtered} />
          )}
        </div>
      </div>
    </div>
  );
}
