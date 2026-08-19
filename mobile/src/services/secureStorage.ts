import * as SecureStore from "expo-secure-store";

const tokenKey = "bloodlink.auth_token";

export const secureStorage = {
  getToken: (): Promise<string | null> => SecureStore.getItemAsync(tokenKey),
  saveToken: (token: string): Promise<void> => SecureStore.setItemAsync(tokenKey, token),
  clearToken: (): Promise<void> => SecureStore.deleteItemAsync(tokenKey),
};
