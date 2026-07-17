"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context";
import { UserRole } from "@/types";
import Loader from "@/components/ui/Loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate dashboard
      router.replace(user.role === "admin" ? "/dashboard/admin" : "/dashboard");
    }
  }, [user, loading, requiredRole, router]);

  if (loading) {
    return <Loader size="lg" fullScreen />;
  }

  if (!user) return null;
  if (requiredRole && user.role !== requiredRole) return null;

  return <>{children}</>;
}
