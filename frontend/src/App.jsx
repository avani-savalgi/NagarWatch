import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import Login from './pages/Login.jsx';
import Shell from './components/Shell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FIRSearch from './pages/FIRSearch.jsx';
import MapView from './pages/MapView.jsx';
import LinkAnalysis from './pages/LinkAnalysis.jsx';
import AIAssistant from './pages/AIAssistant.jsx';
import AuditLog from './pages/AuditLog.jsx';
import CrimeAnalytics from './pages/CrimeAnalytics.jsx';

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="fir" element={<FIRSearch />} />
        <Route path="map" element={<MapView />} />
        <Route path="links" element={<LinkAnalysis />} />
        <Route path="ai" element={<AIAssistant />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="analytics" element={<CrimeAnalytics />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}