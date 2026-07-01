// hooks/useAuth.ts
'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}