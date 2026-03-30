/**
 * 店舗編集ページ（/stores/[id]/edit）
 *
 * 既存の店舗情報を StoreForm で編集する。
 * - URLパラメータ [id] から対象店舗を取得
 * - 他ユーザーの店舗はアクセス不可（getStore が user_id で絞り込む）
 * - 重複警告のため、編集中の店舗以外の店名一覧も取得する
 * - 更新後は詳細ページへリダイレクト
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { getStore, getStores, updateStore } from "@/lib/stores";
import { Store, StoreFormData } from "@/types/store";
import Header from "@/components/Header";
import StoreForm from "@/components/StoreForm";

export default function EditStorePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string; // URLの [id] を取得
  const [store, setStore] = useState<Store | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingNames, setExistingNames] = useState<string[]>([]);

  // 未ログインならログインページへリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && id) {
      // 対象の店舗データを取得（自分の店舗のみ取得される）
      getStore(id, user.id).then((found) => {
        if (found) {
          setStore(found);
        } else {
          setNotFound(true);
        }
      });
      // 重複警告用に、編集中の店舗以外の店名一覧を取得
      getStores(user.id).then((stores) =>
        setExistingNames(stores.filter((s) => s.id !== id).map((s) => s.name))
      );
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

  // store の取得が完了するまで何も表示しない
  if (!store) return null;

  /** フォーム送信時: DB を更新 → 詳細ページへ遷移 */
  const handleSubmit = async (data: StoreFormData & { latitude: number; longitude: number }) => {
    setSaving(true);
    await updateStore(id, user.id, data);
    setSaving(false);
    router.push(`/stores/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href={`/stores/${id}`} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h2 className="text-xl font-bold text-gray-800">店舗編集</h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* initialData で現在の値をフォームに初期セット（座標も含む） */}
          <StoreForm
            initialData={{ name: store.name, address: store.address, memo: store.memo, latitude: store.latitude, longitude: store.longitude }}
            onSubmit={handleSubmit}
            submitLabel="更新する"
            loading={saving}
            existingNames={existingNames}
          />
        </div>
      </main>
    </div>
  );
}
