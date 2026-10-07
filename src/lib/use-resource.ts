"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "./api";
import { useAuth } from "./auth";

export function useResource<T>(path: string | null) {
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const activePath = ready && user ? path : null;
  const [requestPath, setRequestPath] = useState(activePath);
  const [nonce, setNonce] = useState(0);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(Boolean(activePath));

  if (activePath !== requestPath) {
    setRequestPath(activePath);
    setData(null);
    setError(null);
    setStatus(null);
    setLoading(Boolean(activePath));
  }

  const reload = useCallback(() => {
    setError(null);
    setLoading(true);
    setNonce((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!activePath) return;
    let cancelled = false;

    api<T>(activePath)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
        setStatus(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setData(null);
        if (caught instanceof ApiError) {
          setStatus(caught.status);
          if (caught.status === 401) {
            logout();
            const next = `${window.location.pathname}${window.location.search}`;
            router.push(`/login?next=${encodeURIComponent(next)}`);
            return;
          }
          setError(caught.message);
          return;
        }
        setStatus(null);
        setError("Could not load this page.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activePath, nonce, logout, router]);

  return { data, error, status, loading, reload };
}
