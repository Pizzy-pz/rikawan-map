import { loadGoogleMapsScript } from "./googleMaps";

export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  await loadGoogleMapsScript(apiKey);

  return new Promise((resolve) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        resolve({ latitude: loc.lat(), longitude: loc.lng() });
      } else {
        console.error("Geocoding error:", status);
        resolve(null);
      }
    });
  });
}
