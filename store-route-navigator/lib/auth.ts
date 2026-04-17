/**
 * 認証操作（サインアップ・ログイン・ログアウト）
 *
 * Supabase Auth を使ってユーザー管理を行う。
 * 各関数はページコンポーネントから呼び出され、結果を返す。
 */
import { supabase } from "./supabase";
import { User } from "@/types/auth";

/**
 * 新規ユーザー登録
 * - 成功時: ユーザー情報を返す
 * - 失敗時: エラーメッセージを返す
 */
export async function signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: "登録に失敗しました" };
  return { user: { id: data.user.id, email: data.user.email! }, error: null };
}

/**
 * ログイン
 * - 成功時: ユーザー情報を返す
 * - 失敗時: 詳細を伏せた汎用エラーメッセージを返す（セキュリティ対策）
 */
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: "メールアドレスまたはパスワードが正しくありません" };
  if (!data.user) return { user: null, error: "ログインに失敗しました" };
  return { user: { id: data.user.id, email: data.user.email! }, error: null };
}

/**
 * ログアウト
 * - Supabase のセッションを破棄する
 */
export async function signOut() {
  await supabase.auth.signOut();
}
