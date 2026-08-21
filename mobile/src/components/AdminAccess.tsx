import { Redirect } from "expo-router";
import type { PropsWithChildren } from "react";

import { useAuth } from "../context/AuthContext";

/** Keeps every admin route protected even when opened through a deep link. */
export function AdminAccess({ children }: PropsWithChildren) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Redirect href="/(protected)" />;
  return <>{children}</>;
}
