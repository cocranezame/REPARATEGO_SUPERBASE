import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/auth-store";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";

type RefreshResponse = {
  success: true;
  data: { access_token: string; refresh_token: string };
};

function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    const encoded = parts[1];
    if (encoded === undefined) return null;
    const payload: unknown = JSON.parse(atob(encoded));
    if (
      typeof payload === "object" &&
      payload !== null &&
      "exp" in payload &&
      typeof (payload as Record<string, unknown>).exp === "number"
    ) {
      return (payload as { exp: number }).exp;
    }
    return null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiry(token);
  if (exp === null) return true;
  return exp * 1000 < Date.now() + 30_000;
}

type AuthGuardResult = {
  isAuthenticated: boolean;
  isChecking: boolean;
};

export function useAuthGuard(): AuthGuardResult {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const {
      isAuthenticated: auth,
      accessToken,
      refreshToken,
      setTokens,
      logout,
    } = useAuthStore.getState();

    if (!auth || accessToken === null) {
      setIsChecking(false);
      return;
    }

    if (!isTokenExpired(accessToken)) {
      setIsChecking(false);
      return;
    }

    if (refreshToken === null) {
      logout();
      setIsChecking(false);
      return;
    }

    fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Refresh failed");
        const data = (await res.json()) as RefreshResponse;
        setTokens(data.data.access_token, data.data.refresh_token);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, []); // runs once on mount — reads from store.getState() to avoid stale closure deps

  return { isAuthenticated, isChecking };
}
