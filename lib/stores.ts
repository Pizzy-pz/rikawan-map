/**
 * 店舗データのCRUD操作
 *
 * Supabase の "stores" テーブルに対する操作をまとめたモジュール。
 * RLS（行レベルセキュリティ）により、各ユーザーは自分の店舗データのみ
 * 読み書きできる。user_id を条件に含めることで二重の安全策とする。
 */
import { supabase } from "./supabase";
import { Store, StoreFormData } from "@/types/store";

/**
 * 保存前の入力値バリデーション
 * - 座標の範囲チェック（緯度 -90〜90、経度 -180〜180）
 * - 各フィールドの文字数上限チェック
 * バリデーション失敗時は例外をスローしてデータベース書き込みを中断する
 */
function validateStoreInput(data: StoreFormData & { latitude: number; longitude: number }) {
  if (!data.name || data.name.trim().length === 0) throw new Error("店名は必須です");
  if (data.name.length > 100) throw new Error("店名は100文字以内で入力してください");
  if (data.address && data.address.length > 200) throw new Error("住所は200文字以内で入力してください");
  if (data.memo && data.memo.length > 500) throw new Error("メモは500文字以内で入力してください");
  if (data.latitude < -90 || data.latitude > 90) throw new Error("緯度の値が不正です (-90〜90)");
  if (data.longitude < -180 || data.longitude > 180) throw new Error("経度の値が不正です (-180〜180)");
}

/** 指定ユーザーの店舗一覧を取得（登録日の新しい順） */
export async function getStores(userId: string): Promise<Store[]> {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data as Store[];
}

/** 指定IDの店舗を1件取得（自分の店舗のみ） */
export async function getStore(id: string, userId: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId) // 他ユーザーの店舗を取得できないよう user_id も条件に含める
    .single();
  if (error) return null;
  return data as Store;
}

/** 店舗を新規作成 */
export async function createStore(
  userId: string,
  data: StoreFormData & { latitude: number; longitude: number }
): Promise<Store | null> {
  validateStoreInput(data); // 保存前にバリデーション
  const { data: store, error } = await supabase
    .from("stores")
    .insert({
      user_id: userId,
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      memo: data.memo ?? null,
    })
    .select()
    .single();
  if (error) return null;
  return store as Store;
}

/** 既存の店舗情報を更新 */
export async function updateStore(
  id: string,
  userId: string,
  data: StoreFormData & { latitude: number; longitude: number }
): Promise<Store | null> {
  validateStoreInput(data); // 保存前にバリデーション
  const { data: store, error } = await supabase
    .from("stores")
    .update({
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      memo: data.memo ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId) // 自分の店舗のみ更新可能
    .select()
    .single();
  if (error) return null;
  return store as Store;
}

/** 店舗を削除 */
export async function deleteStore(id: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("stores")
    .delete()
    .eq("id", id)
    .eq("user_id", userId); // 自分の店舗のみ削除可能
  return !error;
}
