import { supabase } from "./supabase";
import { User } from "@/types/auth";

export async function signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: "登録に失敗しました" };
  return { user: { id: data.user.id, email: data.user.email! }, error: null };
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: "メールアドレスまたはパスワードが正しくありません" };
  if (!data.user) return { user: null, error: "ログインに失敗しました" };
  return { user: { id: data.user.id, email: data.user.email! }, error: null };
}

export async function signOut() {
  await supabase.auth.signOut();
}
