"use client";
import { useEffect, useState } from "react";

interface User {
  $id: string;
  email?: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success && data.session) {
      // depois de criar a sessão no servidor, buscar usuário
      await checkSession();
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const logout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setUser(null);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  return { user, loading, login, logout, checkSession };
}
