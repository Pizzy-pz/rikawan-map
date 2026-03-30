import { supabase } from "./supabase";

export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return { latitude: data.latitude, longitude: data.longitude };
  } catch {
    return null;
  }
}
