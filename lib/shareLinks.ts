import { supabase } from "./supabase";

export async function getOrCreateShareLink(userId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("share_links")
    .select("token")
    .eq("owner_user_id", userId)
    .single();

  if (existing) return existing.token;

  const token = crypto.randomUUID();
  const { data, error } = await supabase
    .from("share_links")
    .insert({ owner_user_id: userId, token })
    .select("token")
    .single();

  if (error) return null;
  return data.token;
}

export async function deleteShareLink(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("share_links")
    .delete()
    .eq("owner_user_id", userId);
  return !error;
}

export async function getShareLinkToken(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("share_links")
    .select("token")
    .eq("owner_user_id", userId)
    .single();
  return data?.token ?? null;
}

export async function getShareLinkOwner(token: string): Promise<string | null> {
  const { data } = await supabase
    .from("share_links")
    .select("owner_user_id")
    .eq("token", token)
    .single();
  return data?.owner_user_id ?? null;
}
