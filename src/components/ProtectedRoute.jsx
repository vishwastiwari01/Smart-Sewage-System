import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/>
          <div className="text-sm text-on-surface-variant">Loading…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If role hasn't loaded yet (rare, but possible) — show escape hatch
  if (allowedRoles && !user.role) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4 bg-background p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-outline">error</span>
        <div className="text-sm font-medium text-on-surface">Profile sync issue — role not found.</div>
        <div className="text-xs text-outline max-w-xs">This usually resolves on sign-out and back in. Your account exists but the role profile may not have been created yet.</div>
        <button
          onClick={signOut || (() => { supabase.auth.signOut(); window.location.href = '/login'; })}
          className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold"
        >
          Sign Out & Try Again
        </button>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'citizen') return <Navigate to="/citizen/dashboard" replace />;
    if (user.role === 'crew')    return <Navigate to="/crew/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
