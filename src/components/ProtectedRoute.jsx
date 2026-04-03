import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-sm text-gray-500">Loading Auth...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but profile/role hasn't synced yet, wait briefly
  if (allowedRoles && !user.role) {
    return <div className="flex h-screen items-center justify-center text-sm text-gray-500">Loading profile...</div>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their correct dashboard based on actual role
    if (user.role === 'citizen') return <Navigate to="/citizen/dashboard" replace />;
    if (user.role === 'crew') return <Navigate to="/crew/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
