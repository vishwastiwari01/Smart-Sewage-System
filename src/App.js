import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { supabase } from "./lib/supabase";
import { useSimulation } from "./hooks/useSimulation";

// General Pages
import LandingPage   from "./pages/LandingPage";
import LoginPage     from "./pages/LoginPage";
import NotFoundPage  from "./pages/NotFoundPage";

// Admin Pages
import DashboardPage    from "./pages/DashboardPage";
import IncidentsPage    from "./pages/IncidentsPage";
import AIPage           from "./pages/AIPage";
import AnalyticsPage    from "./pages/AnalyticsPage";
import SafetyPage       from "./pages/SafetyPage";
import SimPage          from "./pages/SimPage";
import MessagesPage     from "./pages/MessagesPage";
import DigitalTwinPage  from "./pages/DigitalTwinPage";
import ArchitecturePage from "./pages/ArchitecturePage";
import MobilePage       from "./pages/MobilePage";

// Role Components
import ProtectedRoute   from "./components/ProtectedRoute";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import ReportIssue      from "./pages/citizen/ReportIssue";
import MyReports        from "./pages/citizen/MyReports";
import CrewDashboard    from "./pages/crew/CrewDashboard";
import IncidentDetail   from "./pages/crew/IncidentDetail";

// Common
import TopBar      from "./components/common/TopBar";
import AlertToasts from "./components/common/AlertToasts";
import "./index.css";

function AdminShell({ user, children }) {
  const { critCount, warnCount, alerts, dismissAlert } = useSimulation();
  const TOPBAR_H = 48;
  return (
    // height: 100vh on shell. TopBar is fixed (48px).
    // Content gets an EXPLICIT calc height so DashboardPage's h-full resolves.
    <div style={{ height:'100vh', overflow:'hidden', position:'relative' }}>
      <TopBar critCount={critCount} warnCount={warnCount} user={user} onLogout={() => supabase.auth.signOut()} />
      <AlertToasts alerts={alerts} onDismiss={dismissAlert}/>
      <div style={{
        position:'absolute',
        top: TOPBAR_H,
        left: 0, right: 0, bottom: 0,   // fills exactly the space BELOW the TopBar
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  );
}


// Redirects already-logged-in users away from login/landing
// Shows a tiny spinner ONLY on the login page if auth is still resolving
function AuthGate({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Show the login/landing page immediately — just disable the submit button
    // via a tiny overlay so the user sees the UI right away
    return (
      <>
        {children}
        <div style={{
          position:'fixed', inset:0, background:'rgba(255,255,255,0.7)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999
        }}>
          <div style={{ textAlign:'center' }}>
            <div style={{
              width:32, height:32, border:'3px solid #e2e8f0',
              borderTopColor:'#0066CC', borderRadius:'50%',
              animation:'spin 0.7s linear infinite', margin:'0 auto 8px'
            }}/>
            <div style={{ fontSize:12, color:'#94a3b8' }}>Checking session…</div>
          </div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </>
    );
  }

  // If already logged in, go to dashboard
  if (user) {
    if (user.role === 'citizen') return <Navigate to="/citizen/dashboard" replace />;
    if (user.role === 'crew')    return <Navigate to="/crew/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  // NOTE: loading is NOT checked here — BrowserRouter mounts immediately
  // so public pages (login, landing) appear instantly with zero delay.
  // ProtectedRoute handles the auth check for private routes.
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* ── PUBLIC — render INSTANTLY, no loading gate ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          <AuthGate><LoginPage /></AuthGate>
        } />

        {/* ── CITIZEN ── */}
        <Route path="/citizen/dashboard" element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <CitizenDashboard />
          </ProtectedRoute>
        } />
        <Route path="/citizen/report" element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <ReportIssue />
          </ProtectedRoute>
        } />
        <Route path="/citizen/my-reports" element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <MyReports />
          </ProtectedRoute>
        } />

        {/* ── CREW ── */}
        <Route path="/crew/dashboard" element={
          <ProtectedRoute allowedRoles={['crew', 'admin']}>
            <CrewDashboard />
          </ProtectedRoute>
        } />
        <Route path="/crew/incident/:id" element={
          <ProtectedRoute allowedRoles={['crew', 'admin']}>
            <IncidentDetail />
          </ProtectedRoute>
        } />

        {/* ── ADMIN ── */}
        <Route path="/dashboard"    element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user}><DashboardPage /></AdminShell></ProtectedRoute>} />
        <Route path="/incidents"    element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user}><IncidentsPage /></AdminShell></ProtectedRoute>} />
        <Route path="/ai"           element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user}><AIPage /></AdminShell></ProtectedRoute>} />
        <Route path="/analytics"    element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user}><AnalyticsPage /></AdminShell></ProtectedRoute>} />
        <Route path="/safety"       element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user}><SafetyPage /></AdminShell></ProtectedRoute>} />
        <Route path="/sim"          element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user}><SimPage /></AdminShell></ProtectedRoute>} />
        <Route path="/messages"     element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user}><MessagesPage /></AdminShell></ProtectedRoute>} />
        <Route path="/twin"         element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user}><DigitalTwinPage /></AdminShell></ProtectedRoute>} />
        <Route path="/architecture" element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user}><ArchitecturePage /></AdminShell></ProtectedRoute>} />
        <Route path="/mobile"       element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user}><MobilePage /></AdminShell></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
