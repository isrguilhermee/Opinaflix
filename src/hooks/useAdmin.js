'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useAdmin() {
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    checkAdminStatus();
  }, [session, status]);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/check-admin');
      const result = await response.json();

      if (result.success) {
        setIsAdmin(result.isAdmin);
        setError(null);
      } else {
        setIsAdmin(false);
        setError(result.message);
      }
    } catch (err) {
      console.error('Erro ao verificar status de admin:', err);
      setIsAdmin(false);
      setError('Erro ao verificar permissões');
    } finally {
      setLoading(false);
    }
  };

  return {
    isAdmin,
    loading,
    error,
    refetch: checkAdminStatus
  };
} 