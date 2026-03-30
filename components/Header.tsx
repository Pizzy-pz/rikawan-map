/**
 * ヘッダーコンポーネント
 *
 * 全ページ共通のナビゲーションバー。
 * - アプリ名（クリックで店舗一覧へ）
 * - ログイン中ならメールアドレスとログアウトボタンを表示
 */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login"); // ログアウト後はログインページへリダイレクト
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* アプリ名 → 店舗一覧へのリンク */}
        <Link href="/stores" className="text-xl font-bold tracking-wide hover:opacity-80">
          Store Route Navigator
        </Link>

        {/* ログイン中のみ表示 */}
        {user && (
          <div className="flex items-center gap-4">
            {/* スマホでは非表示（sm: 以上で表示） */}
            <span className="text-sm text-blue-100 hidden sm:block">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-50 font-medium"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
