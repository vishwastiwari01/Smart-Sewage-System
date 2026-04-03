import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!mountedRef.current) return;

      if (profile) {
        setUser({ ...authUser, ...profile });
      } else {
        // Profile not yet created (new account race). Retry once after 1.5s.
        setTimeout(async () => {
          if (!mountedRef.current) return;
          const { data: retry } = await supabase
            .from('profiles').select('*').eq('id', authUser.id).single();
          if (mountedRef.current) {
            setUser(retry ? { ...authUser, ...retry } : { ...authUser, role: null });
          }
        }, 1500);
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
      if (mountedRef.current) setUser({ ...authUser, role: null });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // ─── Use ONLY onAuthStateChange ───────────────────────────────────────────
    // Supabase v2 fires INITIAL_SESSION immediately with current cached session.
    // Do NOT also call getSession() — that creates a race condition where
    // setLoading(true) fires after setLoading(false).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        console.log('[Auth]', event, session?.user?.email ?? 'no user');

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        // For INITIAL_SESSION, TOKEN_REFRESHED, SIGNED_IN — fetch profile
        // Don't setLoading(true) here — it's already true from useState init.
        // Only set it true again on SIGNED_IN (new login)
        if (event === 'SIGNED_IN') setLoading(true);

        await fetchProfile(session.user);
      }
    );

    // Hard safety net — if still loading after 8s, give up and go to login
    const safety = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn('[Auth] Safety timeout — forcing null state');
        setUser(null);
        setLoading(false);
      }
    }, 8000);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(safety);
    };
  }, []); // eslint-disable-line

  const signOut = useCallback(async () => {
    setUser(null);
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
