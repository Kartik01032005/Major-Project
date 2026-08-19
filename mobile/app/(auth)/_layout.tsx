import { Redirect, Stack } from "expo-router";

import { useAuth } from "../../src/context/AuthContext";

export default function AuthLayout() {
  const { isAuthenticated, status } = useAuth();

  if (status === "loading") return null;
  if (isAuthenticated) return <Redirect href="/(protected)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
