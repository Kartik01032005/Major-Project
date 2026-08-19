import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const tokenKey = "bloodlink.auth_token";

const webStorage = {
  getToken: (): Promise<string | null> => Promise.resolve(window.localStorage.getItem(tokenKey)),
  saveToken: (token: string): Promise<void> => {
    window.localStorage.setItem(tokenKey, token);
    return Promise.resolve();
  },
  clearToken: (): Promise<void> => {
    window.localStorage.removeItem(tokenKey);
    return Promise.resolve();
  },
};

export const secureStorage = {
  getToken: (): Promise<string | null> =>
    Platform.OS === "web" ? webStorage.getToken() : SecureStore.getItemAsync(tokenKey),
  saveToken: (token: string): Promise<void> =>
    Platform.OS === "web" ? webStorage.saveToken(token) : SecureStore.setItemAsync(tokenKey, token),
  clearToken: (): Promise<void> =>
    Platform.OS === "web" ? webStorage.clearToken() : SecureStore.deleteItemAsync(tokenKey),
};
