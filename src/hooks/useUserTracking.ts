'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUserTracking() {
  const { user } = useAuth();
  const supabase = createClient();
  const trackedProducts = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Generate or get a stable session ID for anonymous users
    if (typeof window !== 'undefined' && !localStorage.getItem('eyuva_session_id')) {
      localStorage.setItem('eyuva_session_id', 'sess_' + Math.random().toString(36).substring(2, 15));
    }
  }, []);

  const trackProductView = async (productId: string) => {
    if (!productId || trackedProducts.current.has(productId)) return; // Prevent duplicate tracking in one session

    trackedProducts.current.add(productId);
    
    try {
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('eyuva_session_id') : null;
      
      await supabase.from('user_events').insert([{
        user_id: user?.id || null,
        session_id: sessionId,
        event_type: 'view_product',
        target_id: productId
      }]);
    } catch (err) {
      console.warn('Silent tracking error:', err);
    }
  };

  const trackSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim() === '') return;

    try {
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem('eyuva_session_id') : null;
      
      await supabase.from('user_events').insert([{
        user_id: user?.id || null,
        session_id: sessionId,
        event_type: 'search',
        search_term: searchTerm
      }]);
    } catch (err) {
      console.warn('Silent tracking error:', err);
    }
  };

  return { trackProductView, trackSearch };
}
