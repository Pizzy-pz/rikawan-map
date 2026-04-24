"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { createStore, getStores } from "@/lib/stores";
import { isInPublicStores, uploadToPublicStores } from "@/lib/publicStores";
import Header from "@/components/Header";
import StoreForm from "@/components/StoreForm";
import { StoreFormData } from "@/types/store";

export default function NewStorePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [existingNames, setExistingNames] = useState<string[]>([]);

  const [pendingStoreId, setPendingStoreId] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<(StoreFormData & { latitude: number; longitude: number }) | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

  const handleSubmit = async (data: StoreFormData & { latitude: number; longitude: number }) => {
    setSaving(true);
    const store = await createStore(user.id, data);
    setSaving(false);
    if (!store) return;

    const alreadyPublic = await isInPublicStores(data.name);
    if (alreadyPublic) {
      router.push(`/stores/${store.id}`);
    } else {
      setPendingStoreId(store.id);
      setPendingData(data);
      setShowUploadModal(true);
    }
  };

  const handleUpload = async () => {
    if (!user || !pendingData || !pendingStoreId) return;
    setUploading(true);
    await uploadToPublicStores(user.id, pendingData);
    setUploading(false);
    router.push(`/stores/${pendingStoreId}`);
  };

  const handleSkipUpload = () => {
    if (pendingStoreId) router.push(`/stores/${pendingStoreId}`);
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

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full shadow-lg">
            <h3 className="text-gray-800 font-semibold mb-2">この店舗を共有しますか？</h3>
            <p className="text-sm text-gray-500 mb-6">
              公開リストに追加すると、他のユーザーも新規店舗として発見できるようになります。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleSkipUpload}
                disabled={uploading}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm"
              >
                しない
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-sm disabled:opacity-50"
              >
                {uploading ? "共有中..." : "シェアする"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
