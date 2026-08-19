import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

import { authService } from "../services/authService";
import { secureStorage } from "../services/secureStorage";
import type { AuthUser, LoginInput, RegisterInput } from "../types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  const clearSession = async () => {
    await secureStorage.clearToken();
    setUser(null);
    setStatus("unauthenticated");
  };

  const refreshSession = async () => {
    const token = await secureStorage.getToken();
    if (!token) {
      setStatus("unauthenticated");
      setUser(null);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setStatus("authenticated");
    } catch {
      await clearSession();
    }
  };

  useEffect(() => {
    let isActive = true;

    void secureStorage
      .getToken()
      .then((token) => {
        if (!token) {
          if (isActive) {
            setStatus("unauthenticated");
            setUser(null);
          }
          return null;
        }
        return authService.getCurrentUser();
      })
      .then((currentUser) => {
        if (currentUser && isActive) {
          setUser(currentUser);
          setStatus("authenticated");
        }
      })
      .catch(async () => {
        await secureStorage.clearToken();
        if (isActive) {
          setUser(null);
          setStatus("unauthenticated");
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const signIn = async (input: LoginInput) => {
    const response = await authService.login(input);
    setUser(response.user);
    setStatus("authenticated");
  };

  const signUp = async (input: RegisterInput) => {
    await authService.register(input);
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
    setStatus("unauthenticated");
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        isAuthenticated: status === "authenticated",
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
