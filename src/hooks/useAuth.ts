// hooks/useAuth.ts
'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { getToken } from '../lib/auth-token';

export function useAuth() {
  const [user, setUser] = useState(null);
  // Sem token salvo, não há nada para carregar.
  const [loading, setLoading] = useState(() => !!getToken());

  useEffect(() => {
    // Sem token salvo, nem tenta chamar /api/auth/me.
    if (!getToken()) return;

    apiFetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
