// Demo store management using localStorage (replace with Supabase in production)
import { Store, StoreFormData } from "@/types/store";

const STORES_KEY = "demo_stores";

function getAllStores(): Store[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORES_KEY);
  return data ? JSON.parse(data) : [];
}

function saveAllStores(stores: Store[]) {
  localStorage.setItem(STORES_KEY, JSON.stringify(stores));
}

export function getStores(userId: string): Store[] {
  return getAllStores().filter((s) => s.user_id === userId);
}

export function getStore(id: string, userId: string): Store | null {
  return getAllStores().find((s) => s.id === id && s.user_id === userId) ?? null;
}

export function createStore(userId: string, data: StoreFormData & { latitude: number; longitude: number }): Store {
  const now = new Date().toISOString();
  const store: Store = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: data.name,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    memo: data.memo,
    created_at: now,
    updated_at: now,
  };
  const stores = getAllStores();
  saveAllStores([...stores, store]);
  return store;
}

export function updateStore(
  id: string,
  userId: string,
  data: StoreFormData & { latitude: number; longitude: number }
): Store | null {
  const stores = getAllStores();
  const index = stores.findIndex((s) => s.id === id && s.user_id === userId);
  if (index === -1) return null;
  const updated: Store = {
    ...stores[index],
    name: data.name,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    memo: data.memo,
    updated_at: new Date().toISOString(),
  };
  stores[index] = updated;
  saveAllStores(stores);
  return updated;
}

export function deleteStore(id: string, userId: string): boolean {
  const stores = getAllStores();
  const filtered = stores.filter((s) => !(s.id === id && s.user_id === userId));
  if (filtered.length === stores.length) return false;
  saveAllStores(filtered);
  return true;
}
