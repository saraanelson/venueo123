import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, fetchFullProfile } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession]       = useState(null);
  const [profile, setProfile]       = useState(null);       // base profile
  const [roleProfile, setRoleProfile] = useState(null);     // role-specific profile
  const [loading, setLoading]       = useState(true);

  // Listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
        setRoleProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load profile whenever session changes
  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    loadProfile(session.user.id);
  }, [session?.user?.id]);

  async function loadProfile(userId) {
    setLoading(true);
    try {
      const { base, roleProfile: rp } = await fetchFullProfile(userId);
      setProfile(base);
      setRoleProfile(rp);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    if (session?.user?.id) {
      await loadProfile(session.user.id);
    }
  }

  async function signUp({ email, password, fullName, role }) {
    const { data, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr) throw signUpErr;

    if (data.user) {
      // Create base profile
      const { error: profileErr } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, email, full_name: fullName, role });

      if (profileErr) throw profileErr;
    }

    return data;
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setRoleProfile(null);
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    roleProfile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
