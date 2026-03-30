/**
 * Supabaseクライアントの初期化
 *
 * Supabase は認証・データベースをまとめて提供するバックエンドサービス。
 * ここで作成したクライアントを lib/ 全体でインポートして使用する。
 *
 * NEXT_PUBLIC_ プレフィックスの環境変数はブラウザ側でも読める（公開情報）。
 * URL と ANON_KEY はどちらも公開して問題ない値で、RLS（行レベルセキュリティ）が
 * データへの不正アクセスを防ぐ役割を担う。
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
