export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return { latitude: data.latitude, longitude: data.longitude };
  } catch {
    return null;
  }
}
