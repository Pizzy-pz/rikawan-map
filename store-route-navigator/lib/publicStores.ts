import { supabase } from "@/lib/supabase";
import { getStores } from "@/lib/stores";
import { Store, StoreFormData } from "@/types/store";

export type PublicStore = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  memo?: string;
  shared_by: string;
  created_at: string;
};

export async function isInPublicStores(name: string): Promise<boolean> {
  const { data } = await supabase
    .from("public_stores")
    .select("id")
    .ilike("name", name)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function uploadToPublicStores(
  userId: string,
  data: StoreFormData & { latitude: number; longitude: number }
): Promise<void> {
  await supabase.from("public_stores").insert({
    name: data.name,
    latitude: data.latitude,
    longitude: data.longitude,
    memo: data.memo ?? null,
    shared_by: userId,
  });
}

export async function uploadMultipleToPublicStores(
  userId: string,
  stores: Store[]
): Promise<void> {
  if (stores.length === 0) return;
  const rows = stores.map((s) => ({
    name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    memo: s.memo ?? null,
    shared_by: userId,
  }));
  await supabase.from("public_stores").insert(rows);
}

export async function getMySharedNames(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("public_stores")
    .select("name")
    .eq("shared_by", userId);
  return new Set((data ?? []).map((r: { name: string }) => r.name.toLowerCase()));
}

export async function getNewPublicStores(userId: string): Promise<PublicStore[]> {
  const [{ data: publicData }, myStores] = await Promise.all([
    supabase.from("public_stores").select("*").order("created_at", { ascending: false }),
    getStores(userId),
  ]);

  const myNames = new Set(myStores.map((s) => s.name.toLowerCase()));
  return (publicData ?? []).filter(
    (p: PublicStore) => !myNames.has(p.name.toLowerCase())
  );
}
