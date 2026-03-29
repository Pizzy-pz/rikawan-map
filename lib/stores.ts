import { supabase } from "./supabase";
import { Store, StoreFormData } from "@/types/store";

export async function getStores(userId: string): Promise<Store[]> {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data as Store[];
}

export async function getStore(id: string, userId: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data as Store;
}

export async function createStore(
  userId: string,
  data: StoreFormData & { latitude: number; longitude: number }
): Promise<Store | null> {
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

export async function updateStore(
  id: string,
  userId: string,
  data: StoreFormData & { latitude: number; longitude: number }
): Promise<Store | null> {
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
    .eq("user_id", userId)
    .select()
    .single();
  if (error) return null;
  return store as Store;
}

export async function deleteStore(id: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("stores")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}
