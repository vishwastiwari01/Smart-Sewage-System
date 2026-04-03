import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Tiny inline spinner — no external deps
function Spinner() {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:12,
      background:'var(--background, #fafafa)'
    }}>
      <div style={{
        width:32, height:32, border:'3px solid #e2e8f0',
        borderTopColor:'#0066CC', borderRadius:'50%',
        animation:'spin 0.7s linear infinite'
      }}/>
      <span style={{ fontSize:13, color:'#94a3b8' }}>Loading…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, signOut } = useAuth();

  // Still resolving session — show spinner (this should be very brief, <500ms)
  if (loading) return <Spinner />;

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but role hasn't loaded yet (DB delay) — brief spinner with escape
  if (!user.role) {
    return (
      <div style={{
        minHeight:'100vh', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', gap:16,
        background:'var(--background, #fafafa)'
      }}>
        <div style={{
          width:32, height:32, border:'3px solid #e2e8f0',
          borderTopColor:'#0066CC', borderRadius:'50%',
          animation:'spin 0.7s linear infinite'
        }}/>
        <span style={{ fontSize:13, color:'#94a3b8' }}>Loading profile…</span>
        <button onClick={signOut}
          style={{ fontSize:12, color:'#64748b', textDecoration:'underline', background:'none', border:'none', cursor:'pointer' }}>
          Sign out and try again
        </button>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Wrong role → redirect to their correct home
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    if (user.role === 'citizen') return <Navigate to="/citizen/dashboard" replace />;
    if (user.role === 'crew')    return <Navigate to="/crew/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
