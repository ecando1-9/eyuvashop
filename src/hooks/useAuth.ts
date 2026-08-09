'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/database';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  unreadNotifications: number;
}

interface UseAuthReturn extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    unreadNotifications: 0,
  });

  const router = useRouter();
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const [profileRes, notifRes] = await Promise.all([
        supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single(),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false),
      ]);

      return {
        profile: (profileRes.data as UserProfile) || null,
        unreadNotifications: notifRes.count || 0,
      };
    } catch {
      return { profile: null, unreadNotifications: 0 };
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { profile, unreadNotifications } = await fetchProfile(user.id);
      setState((prev) => ({ ...prev, profile, unreadNotifications }));
    }
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, profile: null, loading: false, unreadNotifications: 0 });
    router.push('/');
    router.refresh();
  }, [supabase, router]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user && mounted) {
        const { profile, unreadNotifications } = await fetchProfile(session.user.id);
        if (mounted) {
          setState({
            user: session.user,
            profile,
            loading: false,
            unreadNotifications,
          });
        }
      } else if (mounted) {
        setState({ user: null, profile: null, loading: false, unreadNotifications: 0 });
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const { profile, unreadNotifications } = await fetchProfile(session.user.id);
          if (mounted) {
            setState({
              user: session.user,
              profile,
              loading: false,
              unreadNotifications,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setState({ user: null, profile: null, loading: false, unreadNotifications: 0 });
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          if (mounted) {
            setState((prev) => ({ ...prev, user: session.user }));
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  return { ...state, signOut, refreshProfile };
}
