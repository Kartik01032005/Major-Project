const defaultApiUrl = "http://localhost:5000/api";

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || defaultApiUrl;

if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://")) {
  throw new Error("EXPO_PUBLIC_API_URL must be an absolute HTTP(S) URL.");
}

export const env = {
  apiUrl: apiUrl.replace(/\/$/, ""),
} as const;
