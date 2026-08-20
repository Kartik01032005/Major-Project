const defaultApiUrl = "http://localhost:5000/api";

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || defaultApiUrl;

if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
  throw new Error("EXPO_PUBLIC_API_URL must be an absolute HTTP(S) URL.");
}

/**
 * Optional Google Maps Android API key, read from the environment. Powers the
 * embedded map tiles on Android. When unset, the map UI renders an informative
 * fallback instead of a blank surface — no key is ever required to use the app.
 *
 * Note: under Expo Go the bundled Expo-managed maps key is used automatically,
 * so this value only matters for standalone/development client builds.
 */
const googleMapsAndroidApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY?.trim() ?? "";

export const env = {
  apiUrl: apiUrl.replace(/\/$/, ""),
  googleMapsAndroidApiKey,
} as const;
