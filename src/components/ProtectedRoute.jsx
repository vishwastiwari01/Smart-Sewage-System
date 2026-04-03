import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const [profileTimeout, setProfileTimeout] = React.useState(false);

  React.useEffect(() => {
    let t;
    if (user && !user.role) {
      t = setTimeout(() => setProfileTimeout(true), 10000);
    }
    return () => clearTimeout(t);
  }, [user]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-sm text-gray-500">Loading Auth...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but profile/role hasn't synced yet, wait briefly
  if (allowedRoles && !user.role) {
    if (profileTimeout) {
      return (
        <div className="flex flex-col h-screen items-center justify-center gap-4 bg-background p-6 text-center">
          <div className="text-sm font-medium text-error">Profile sync taking longer than expected.</div>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold"
          >
            Sign Out and Retry
          </button>
        </div>
      );
    }
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
