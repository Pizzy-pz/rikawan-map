"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MigratePage() {
  const [status, setStatus] = useState("");
  const router = useRouter();

  const handleMigrate = async () => {
    setStatus("移行中...");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus("ログインしてください");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const old: any[] = JSON.parse(localStorage.getItem("demo_stores") || "[]");
    if (!old.length) {
      setStatus("移行するデータがありません");
      return;
    }

    const rows = old.map((s) => ({
      user_id: user.id,
      name: s.name,
      address: s.address || "",
      latitude: s.latitude,
      longitude: s.longitude,
      memo: s.memo || null,
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));

    const { error } = await supabase.from("stores").insert(rows);

    if (error) {
      setStatus("エラー: " + error.message);
    } else {
      setStatus(`✅ ${rows.length}件の移行が完了しました！`);
      setTimeout(() => router.push("/stores"), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center space-y-4">
        <h1 className="text-xl font-bold text-gray-900">データ移行</h1>
        <p className="text-sm text-gray-500">localStorageのデータをSupabaseに移行します</p>
        <button
          onClick={handleMigrate}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          移行する
        </button>
        {status && (
          <p className={`text-sm font-medium ${status.startsWith("✅") ? "text-green-600" : "text-gray-700"}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
