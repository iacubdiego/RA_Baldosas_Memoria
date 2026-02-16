'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  edad: number;
}

export function useAuth(redirectTo: string = '/auth') {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (!response.ok) {
        // No autenticado
        router.push(redirectTo);
        return;
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      router.push(redirectTo);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return { user, loading, logout };
}
