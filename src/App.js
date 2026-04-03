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

function AdminShell({ user }) {
  const { critCount, warnCount, alerts, dismissAlert } = useSimulation();
  return (
    <div className="app-shell">
      <TopBar critCount={critCount} warnCount={warnCount} user={user} onLogout={() => supabase.auth.signOut()} />
      <AlertToasts alerts={alerts} onDismiss={dismissAlert}/>
      <div className="app-content" style={{ marginTop:48 }}>
        <Routes>
          <Route path="/dashboard"    element={<DashboardPage />} />
          <Route path="/incidents"    element={<IncidentsPage />} />
          <Route path="/ai"           element={<AIPage />} />
          <Route path="/analytics"    element={<AnalyticsPage />} />
          <Route path="/safety"       element={<SafetyPage />} />
          <Route path="/sim"          element={<SimPage />} />
          <Route path="/messages"     element={<MessagesPage />} />
          <Route path="/twin"         element={<DigitalTwinPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/mobile"       element={<MobilePage />} />
          <Route path="*"             element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function RoleRouter({ user }) {
  if (!user.role) {
    // Profile exists but role not loaded yet — show minimal spinner
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/>
          <span className="text-sm text-outline">Loading profile…</span>
        </div>
      </div>
    );
  }

  if (user.role === 'citizen') return <Navigate to="/citizen/dashboard" replace />;
  if (user.role === 'crew')    return <Navigate to="/crew/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/>
          <span className="text-sm text-outline">SmartFlow is loading…</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          user ? <RoleRouter user={user} /> : <LoginPage />
        }/>

        {/* CITIZEN ROUTES */}
        <Route path="/citizen/dashboard" element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <CitizenDashboard />
          </ProtectedRoute>
        }/>
        <Route path="/citizen/report" element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <ReportIssue />
          </ProtectedRoute>
        }/>
        <Route path="/citizen/my-reports" element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <MyReports />
          </ProtectedRoute>
        }/>

        {/* CREW ROUTES */}
        <Route path="/crew/dashboard" element={
          <ProtectedRoute allowedRoles={['crew', 'admin']}>
            <CrewDashboard />
          </ProtectedRoute>
        }/>
        <Route path="/crew/incident/:id" element={
          <ProtectedRoute allowedRoles={['crew', 'admin']}>
            <IncidentDetail />
          </ProtectedRoute>
        }/>

        {/* ADMIN ROUTES — must be BELOW citizen/crew to not catch them */}
        <Route path="/dashboard"    element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user} /></ProtectedRoute>}/>
        <Route path="/incidents"    element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user} /></ProtectedRoute>}/>
        <Route path="/ai"           element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user} /></ProtectedRoute>}/>
        <Route path="/analytics"    element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user} /></ProtectedRoute>}/>
        <Route path="/safety"       element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user} /></ProtectedRoute>}/>
        <Route path="/sim"          element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user} /></ProtectedRoute>}/>
        <Route path="/messages"     element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user} /></ProtectedRoute>}/>
        <Route path="/twin"         element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user} /></ProtectedRoute>}/>
        <Route path="/architecture" element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user} /></ProtectedRoute>}/>
        <Route path="/mobile"       element={<ProtectedRoute allowedRoles={['admin']}><AdminShell user={user} /></ProtectedRoute>}/>

        <Route path="*" element={<NotFoundPage />}/>
      </Routes>
    </BrowserRouter>
  );
}
