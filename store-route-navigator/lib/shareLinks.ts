/**
 * シェアリンクの管理
 *
 * ユーザーが自分の店舗リストを他のユーザーと共有するためのトークン管理。
 * トークンは URL に含まれ、そのリンクを持つログイン済みユーザーが
 * リストを閲覧・コピーできる。
 *
 * セキュリティ対策:
 * - トークンは crypto.randomUUID() で生成（128ビットの暗号論的乱数）
 * - Supabase RLS によりユーザーは自分のリンクのみ操作できる
 */
import { supabase } from "./supabase";

/**
 * シェアリンクのトークンを取得（なければ新規作成）
 * - 既存トークンがあればそれを返す
 * - なければ新しい UUID v4 トークンを生成して保存する
 */
export async function getOrCreateShareLink(userId: string): Promise<string | null> {
  // 既存のトークンを確認
  const { data: existing } = await supabase
    .from("share_links")
    .select("token")
    .eq("owner_user_id", userId)
    .single();

  if (existing) return existing.token;

  // 新規作成: crypto.randomUUID() で安全なランダムトークンを生成
  const token = crypto.randomUUID();
  const { data, error } = await supabase
    .from("share_links")
    .insert({ owner_user_id: userId, token })
    .select("token")
    .single();

  if (error) return null;
  return data.token;
}

/**
 * シェアリンクを削除（シェアの停止）
 * - リンクを削除すると、そのトークンを持っていても店舗リストにアクセスできなくなる
 */
export async function deleteShareLink(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("share_links")
    .delete()
    .eq("owner_user_id", userId);
  return !error;
}

/**
 * 自分のシェアリンクトークンを取得（シェアページでの表示用）
 * - リンク未作成の場合は null を返す
 */
export async function getShareLinkToken(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("share_links")
    .select("token")
    .eq("owner_user_id", userId)
    .single();
  return data?.token ?? null;
}

/**
 * トークンからリンクの所有者ID を取得（インポートページで使用）
 * - 無効なトークンの場合は null を返す
 * - 返ってきた owner_user_id を使って、その人の店舗一覧を取得する
 */
export async function getShareLinkOwner(token: string): Promise<string | null> {
  const { data } = await supabase
    .from("share_links")
    .select("owner_user_id")
    .eq("token", token)
    .single();
  return data?.owner_user_id ?? null;
}
