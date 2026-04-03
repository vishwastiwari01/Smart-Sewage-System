import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Safety timeout — never hang forever
    const timeout = setTimeout(() => {
      if (mounted) { setUser(null); setLoading(false); }
    }, 5000);

    async function getSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("Auth Session Error:", error);
        
        if (data && data.session && data.session.user) {
          await fetchProfile(data.session.user, mounted);
        } else {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Critical getSession error:", err);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session && session.user) {
          await fetchProfile(session.user, mounted);
        } else {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Auth listener error:", err);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  async function fetchProfile(authUser, mounted) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      
      if (mounted) {
        setUser({ ...authUser, ...profile });
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (mounted) setLoading(false);
    }
  }

  const value = { user, loading, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
