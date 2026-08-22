'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const supabase = createClient();

  // Accept currentUser directly — avoids a redundant getUser() round-trip
  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      let profileRes: any = { data: null };

      try {
        profileRes = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();
      } catch {
        profileRes = { data: null };
      }

      const profileObj = profileRes.data ? (profileRes.data as UserProfile) : null;
      const metaName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name;
      const metaAvatar =
        currentUser.user_metadata?.avatar_url ||
        currentUser.user_metadata?.picture ||
        currentUser.user_metadata?.avatarUrl ||
        null;

      // If user was previously soft-deleted and logs in again, reactivate public.users row
      if ((profileObj as any)?.deleted_at || currentUser.user_metadata?.is_deleted) {
        await supabase.from('users').upsert(
          {
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: metaName || currentUser.email?.split('@')[0] || 'User',
            avatar_url: metaAvatar,
            is_active: true,
            deleted_at: null,
          },
          { onConflict: 'id' }
        );

        await supabase.auth.updateUser({
          data: { is_deleted: false, deleted_at: null },
        });
      }

      const finalProfile: UserProfile = profileObj
        ? {
            ...profileObj,
            role:
              profileObj.role === 'admin' || currentUser.user_metadata?.role === 'admin'
                ? 'admin'
                : profileObj.role || 'customer',
            full_name: profileObj.full_name || metaName || currentUser.email?.split('@')[0] || 'User',
            avatar_url: profileObj.avatar_url || metaAvatar,
            deleted_at: null,
            is_active: true,
          }
        : {
            id: currentUser.id,
            email: currentUser.email || '',
            phone: undefined,
            full_name: metaName || currentUser.email?.split('@')[0] || 'User',
            avatar_url: metaAvatar,
            role: currentUser.user_metadata?.role === 'admin' ? 'admin' : 'customer',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

      return {
        profile: finalProfile,
        unreadNotifications: 0,
      };
    } catch {
      return { profile: null, unreadNotifications: 0 };
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { profile, unreadNotifications } = await fetchProfile(user);
      setState((prev) => ({ ...prev, user, profile, unreadNotifications }));
    }
  }, [supabase, fetchProfile]);

  // signOut clears auth state only. The caller is responsible for navigation.
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, profile: null, loading: false, unreadNotifications: 0 });
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          const { profile, unreadNotifications } = await fetchProfile(session.user);
          if (mounted) {
            setState({
              user: session.user,
              profile,
              unreadNotifications,
              loading: false,
            });
          }
        } else if (mounted) {
          setState({ user: null, profile: null, loading: false, unreadNotifications: 0 });
        }
      } catch {
        if (mounted) {
          setState({ user: null, profile: null, loading: false, unreadNotifications: 0 });
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          const { profile, unreadNotifications } = await fetchProfile(session.user);
          if (mounted) {
            setState({
              user: session.user,
              profile,
              unreadNotifications,
              loading: false,
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

    const handleProfileUpdated = () => {
      if (mounted) {
        refreshProfile();
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdated);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('profileUpdated', handleProfileUpdated);
    };
  }, [supabase, fetchProfile, refreshProfile]);

  return { ...state, signOut, refreshProfile };
}
