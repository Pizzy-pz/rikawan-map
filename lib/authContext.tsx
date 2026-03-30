/**
 * 認証状態のグローバル管理（React Context）
 *
 * Context を使うことで、どのコンポーネントからでも
 * `useAuth()` を呼び出すだけでログイン中のユーザー情報を取得できる。
 *
 * 使い方:
 *   const { user, loading, logout } = useAuth();
 *   - user: ログイン中のユーザー（未ログインなら null）
 *   - loading: セッション確認中かどうか（true の間はリダイレクト判断を保留する）
 *   - logout: ログアウト関数
 */
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/types/auth";
import { supabase } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

// デフォルト値（Provider の外でuseAuthを呼んだ場合のフォールバック）
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

/**
 * アプリ全体を囲むラッパー（app/layout.tsx で使用）
 * - マウント時に Supabase のセッションを確認してユーザー状態を設定する
 * - onAuthStateChange でログイン・ログアウトをリアルタイム検知する
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初回レンダリング時に既存セッションを確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null);
      setLoading(false);
    });

    // ログイン・ログアウト・トークン更新などの認証イベントを監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email! } : null);
      setLoading(false);
    });

    // コンポーネントがアンマウントされたときにリスナーを解除（メモリリーク防止）
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** 認証情報を取得するカスタムフック */
export function useAuth() {
  return useContext(AuthContext);
}
