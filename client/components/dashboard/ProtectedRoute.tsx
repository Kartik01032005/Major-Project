"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context";
import { UserRole } from "@/types";
import Loader from "@/components/ui/Loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  allowPending?: boolean;
}

export const normalizeUserRole = (role?: string): "USER" | "BLOOD_BANK" | "HOSPITAL" => {
  if (!role) return "USER";
  const upper = role.toUpperCase();
  if (upper === "BLOOD_BANK" || upper === "ADMIN") return "BLOOD_BANK";
  if (upper === "HOSPITAL") return "HOSPITAL";
  return "USER";
};

export const getDashboardRoute = (user: { role?: string; approvalStatus?: string } | null): string => {
  if (!user) return "/dashboard";
  const norm = normalizeUserRole(user.role);
  if (norm === "BLOOD_BANK") return "/dashboard/admin";
  if (norm === "HOSPITAL") return "/dashboard/hospital";
  return "/dashboard";
};

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    const normRole = normalizeUserRole(user.role);

    if (requiredRole) {
      const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const normalizedAllowed = allowed.map(r => normalizeUserRole(r));

      if (!normalizedAllowed.includes(normRole)) {
        router.replace(getDashboardRoute(user));
      }
    }
  }, [user, loading, requiredRole, router]);

  if (loading) {
    return <Loader size="lg" fullScreen />;
  }

  if (!user) return null;

  const normRole = normalizeUserRole(user.role);

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const normalizedAllowed = allowed.map(r => normalizeUserRole(r));
    if (!normalizedAllowed.includes(normRole)) return null;
  }

  return <>{children}</>;
}
