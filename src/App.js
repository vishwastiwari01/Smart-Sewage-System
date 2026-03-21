import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSimulation } from "./hooks/useSimulation";
import TopBar        from "./components/common/TopBar";
import AlertToasts   from "./components/common/AlertToasts";
import LandingPage   from "./pages/LandingPage";
import LoginPage     from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import IncidentsPage from "./pages/IncidentsPage";
import AIPage        from "./pages/AIPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SafetyPage    from "./pages/SafetyPage";
import SimPage       from "./pages/SimPage";
import MessagesPage  from "./pages/MessagesPage";
import DigitalTwinPage   from "./pages/DigitalTwinPage";
import ArchitecturePage  from "./pages/ArchitecturePage";
import MobilePage        from "./pages/MobilePage";
import NotFoundPage      from "./pages/NotFoundPage";
import "./index.css";

function ProtectedShell({ user, onLogout }) {
  const { critCount, warnCount, alerts, dismissAlert } = useSimulation();
  return (
    <div className="app-shell">
      <TopBar critCount={critCount} warnCount={warnCount} user={user} onLogout={onLogout}/>
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

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<LandingPage />} />
        <Route path="/login"  element={
          user ? <Navigate to="/dashboard" replace/> : <LoginPage onLogin={setUser}/>
        }/>
        <Route path="/*" element={
          user
            ? <ProtectedShell user={user} onLogout={()=>setUser(null)}/>
            : <Navigate to="/login" replace/>
        }/>
        <Route path="*" element={<NotFoundPage />}/>
      </Routes>
    </BrowserRouter>
  );
}
