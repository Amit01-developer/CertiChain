import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Spinner from './components/ui/Spinner';

const Landing       = lazy(() => import('./pages/Landing'));
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail    = lazy(() => import('./pages/VerifyEmail'));
const VerifySearch   = lazy(() => import('./pages/VerifySearch'));
const VerifyDetail   = lazy(() => import('./pages/VerifyDetail'));
const NotFound       = lazy(() => import('./pages/NotFound'));

const Dashboard         = lazy(() => import('./pages/dashboard/Dashboard'));
const Certificates      = lazy(() => import('./pages/dashboard/Certificates'));
const NewCertificate    = lazy(() => import('./pages/dashboard/NewCertificate'));
const CertificateDetail = lazy(() => import('./pages/dashboard/CertificateDetail'));
const Templates         = lazy(() => import('./pages/dashboard/Templates'));
const NewTemplate       = lazy(() => import('./pages/dashboard/NewTemplate'));
const Recipients        = lazy(() => import('./pages/dashboard/Recipients'));
const Analytics         = lazy(() => import('./pages/dashboard/Analytics'));
const AuditLogs         = lazy(() => import('./pages/dashboard/AuditLogs'));
const OrgProfile        = lazy(() => import('./pages/dashboard/OrgProfile'));
const Settings          = lazy(() => import('./pages/dashboard/Settings'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/"                   element={<Landing />} />
          <Route path="/login"              element={<Login />} />
          <Route path="/register"           element={<Register />} />
          <Route path="/forgot-password"    element={<ForgotPassword />} />
          <Route path="/reset-password"     element={<ResetPassword />} />
          <Route path="/verify-email"       element={<VerifyEmail />} />
          <Route path="/verify"             element={<VerifySearch />} />
          <Route path="/verify/:id"         element={<VerifyDetail />} />
        </Route>

        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index                            element={<Dashboard />} />
          <Route path="certificates"              element={<Certificates />} />
          <Route path="certificates/new"          element={<NewCertificate />} />
          <Route path="certificates/bulk"         element={<NewCertificate bulk />} />
          <Route path="certificates/:id"          element={<CertificateDetail />} />
          <Route path="templates"                 element={<Templates />} />
          <Route path="templates/new"             element={<NewTemplate />} />
          <Route path="recipients"                element={<Recipients />} />
          <Route path="analytics"                 element={<Analytics />} />
          <Route path="audit-logs"                element={<AuditLogs />} />
          <Route path="organization"              element={<OrgProfile />} />
          <Route path="settings"                  element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
