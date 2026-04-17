/**
 * 店舗新規登録ページ（/stores/new）
 *
 * StoreForm コンポーネントを使って新しい店舗を登録する。
 * - マウント時に既存の店名一覧を取得し、重複警告に使用する
 * - フォーム送信後は登録した店舗の詳細ページへリダイレクト
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { createStore, getStores } from "@/lib/stores";
import Header from "@/components/Header";
import StoreForm from "@/components/StoreForm";
import { StoreFormData } from "@/types/store";

export default function NewStorePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [existingNames, setExistingNames] = useState<string[]>([]);

  // 未ログインならログインページへリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // 既存の店名一覧を取得（重複警告のため）
  useEffect(() => {
    if (user) {
      getStores(user.id).then((stores) => setExistingNames(stores.map((s) => s.name)));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    );
  }

  if (!user) return null;

  /** フォーム送信時: DB に保存 → 詳細ページへ遷移 */
  const handleSubmit = async (data: StoreFormData & { latitude: number; longitude: number }) => {
    setSaving(true);
    const store = await createStore(user.id, data);
    setSaving(false);
    if (store) {
      router.push(`/stores/${store.id}`);
    }
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
          <h2 className="text-xl font-bold text-gray-800">店舗登録</h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <StoreForm onSubmit={handleSubmit} submitLabel="登録する" loading={saving} existingNames={existingNames} />
        </div>
      </main>
    </div>
  );
}
