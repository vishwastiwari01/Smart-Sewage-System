import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (authUser) => {
    if (!mountedRef.current) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!mountedRef.current) return;

      if (profile) {
        setUser({ ...authUser, ...profile });
      } else {
        // Profile doesn't exist yet (new user race) — create it then retry
        await supabase.from('profiles').upsert({
          id: authUser.id,
          email: authUser.email,
          role: 'citizen',     // default role
          name: authUser.email.split('@')[0],
        }, { onConflict: 'id' });

        const { data: retry } = await supabase
          .from('profiles').select('*').eq('id', authUser.id).single();

        if (mountedRef.current) {
          setUser(retry ? { ...authUser, ...retry } : { ...authUser, role: 'citizen' });
        }
      }
    } catch (err) {
      console.error('[Auth] fetchProfile error:', err.message);
      if (mountedRef.current) setUser({ ...authUser, role: null });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // onAuthStateChange fires IMMEDIATELY (synchronous) for cached sessions.
    // Do NOT also call getSession() — that creates a double-fire race condition.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mountedRef.current) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        // fetchProfile is async — loading will be set false inside it
        fetchProfile(session.user);
      }
    );

    // Hard safety timeout — if Supabase is down or slow, stop blocking the UI
    const safety = setTimeout(() => {
      if (mountedRef.current) {
        setUser(null);
        setLoading(false);
      }
    }, 5000); // 5s max wait

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(safety);
    };
  }, []); // eslint-disable-line

  const signOut = useCallback(async () => {
    setUser(null);
    setLoading(false);
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
